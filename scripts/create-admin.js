const readline = require('readline');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

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
  const fullName = await prompt('Administrator name: ');
  const email = (await prompt('Administrator email: ')).toLowerCase();
  const password = await promptSecret('Administrator password (minimum 12 characters): ');
  if (!fullName || !email || password.length < 12) throw new Error('A name, valid email, and password of at least 12 characters are required.');

  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
  try {
    const hash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      "INSERT INTO users (email, password_hash, full_name, role, is_active, terms_accepted) VALUES ($1, $2, $3, 'admin', TRUE, TRUE) RETURNING user_id, email, full_name, role",
      [email, hash, fullName],
    );
    process.stdout.write(`Created administrator ${result.rows[0].email} (user ${result.rows[0].user_id}).\n`);
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});
