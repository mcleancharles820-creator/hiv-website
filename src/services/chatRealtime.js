import { createClient } from '@supabase/supabase-js';

let client;
let channel;

function getClient() {
  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
  const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return null;
  if (!client) {
    client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: false,
        persistSession: true,
        storage: window.sessionStorage,
      },
    });
  }
  return client;
}

export async function setChatRealtimeSession(session) {
  const supabase = getClient();
  if (!supabase || !session?.access_token || !session?.refresh_token) return false;
  const { error } = await supabase.auth.setSession({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  });
  if (error) throw error;
  return true;
}

export async function subscribeToChatChanges(onChange) {
  const supabase = getClient();
  if (!supabase) return () => {};
  const { data } = await supabase.auth.getSession();
  if (!data.session) return () => {};

  if (channel) await supabase.removeChannel(channel);
  channel = supabase
    .channel('hivelink-chat-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_sessions' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages' }, onChange)
    .subscribe();

  return () => {
    if (!channel || !client) return;
    const currentChannel = channel;
    channel = null;
    client.removeChannel(currentChannel);
  };
}

export async function clearChatRealtimeSession() {
  if (!client) return;
  if (channel) {
    await client.removeChannel(channel);
    channel = null;
  }
  await client.auth.signOut();
}
