const readline = require('readline');
const { Pool } = require('pg');
const { createClient } = require('@supabase/supabase-js');

function prompt(label) {
  return new Promise((resolve) => {
    const terminal = readline.createInterface({ input: process.stdin, output: process.stdout });
    terminal.question(label, (value) => {
      terminal.close();
      resolve(value.trim());
    });
  });
}

function promptSecret(label) {
  return new Promise((resolve) => {
    const input = process.stdin;
    let value = '';
    if (!input.isTTY) throw new Error('Run this command in an interactive terminal so the password can be hidden.');
    process.stdout.write(label);
    input.setRawMode(true);
    input.resume();
    input.setEncoding('utf8');
    const onData = (character) => {
      if (character === '\u0003') {
        input.setRawMode(false);
        process.exit(1);
      }
      if (character === '\r' || character === '\n') {
        input.setRawMode(false);
        input.pause();
        input.removeListener('data', onData);
        process.stdout.write('\n');
        resolve(value);
      } else if (character === '\u007f' || character === '\b') {
        value = value.slice(0, -1);
      } else if (character >= ' ') {
        value += character;
      }
    };
    input.on('data', onData);
  });
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('Set DATABASE_URL before creating the initial admin.');
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before creating the initial admin.');
  const firstName = await prompt('Administrator first name: ');
  const middleName = await prompt('Administrator middle name: ');
  const lastName = await prompt('Administrator last name: ');
  const fullName = [firstName, middleName, lastName].join(' ');
  const email = (await prompt('Administrator email: ')).toLowerCase();
  const password = await promptSecret('Administrator password (minimum 12 characters): ');
  const confirmPassword = await promptSecret('Confirm administrator password: ');
  if (!firstName || !middleName || !lastName || fullName.length > 150 || !email || password.length < 12) {
    throw new Error('First, middle, and last names, a valid email, and a password of at least 12 characters are required.');
  }
  if (password !== confirmPassword) throw new Error('Passwords do not match. No administrator account was created.');

  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } });
  let authUserId;
  try {
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });
    if (authError || !authData.user) throw new Error(authError?.message || 'Could not create the Supabase Auth account.');
    authUserId = authData.user.id;
    const userId = (await pool.query("SELECT nextval(pg_get_serial_sequence('users', 'user_id')) AS user_id")).rows[0].user_id;
    const initial = firstName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').match(/[A-Za-z]/)?.[0] || 'X';
    const dateOfBirth = new Date().toISOString().slice(0, 10);
    const uic = `${initial.toUpperCase()}-01-${dateOfBirth.replace(/-/g, '')}-${String(userId).padStart(6, '0')}`;
    const result = await pool.query(
      "INSERT INTO users (user_id, uic, birth_order, supabase_user_id, email, password_hash, full_name, role, is_active, terms_accepted, email_verified) VALUES ($1, $2, 1, $3, $4, NULL, $5, 'admin', TRUE, TRUE, TRUE) RETURNING user_id, uic, email, full_name, role",
      [userId, uic, authUserId, email, fullName],
    );
    process.stdout.write(`Created administrator ${result.rows[0].email} (user ${result.rows[0].user_id}). Sign-in UIC: ${result.rows[0].uic}\n`);
  } catch (error) {
    if (authUserId) await supabase.auth.admin.deleteUser(authUserId);
    throw error;
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});
