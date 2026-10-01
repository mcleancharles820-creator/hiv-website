import { createClient } from '@supabase/supabase-js';

let client = null;
let channel = null;

function getClient() {
  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
  const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase Realtime environment variables are missing.');
    return null;
  }

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

  if (!supabase || !session?.access_token || !session?.refresh_token) {
    console.error('No valid Supabase Realtime session.');
    return false;
  }

  const { error } = await supabase.auth.setSession({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  });

  if (error) {
    console.error('Failed to set Supabase session:', error);
    throw error;
  }

  // Explicitly give Realtime the authenticated user's JWT.
  supabase.realtime.setAuth(session.access_token);

  console.log('Supabase Realtime session authenticated.');

  return true;
}

export async function subscribeToChatChanges(onChange) {
  const supabase = getClient();

  if (!supabase) return () => {};

  const { data, error } = await supabase.auth.getSession();

  if (error) {
    console.error('Unable to get Supabase session:', error);
    return () => {};
  }

  if (!data.session) {
    console.warn('No Supabase session available for Realtime.');
    return () => {};
  }

  // Make sure Realtime uses the current authenticated JWT.
  supabase.realtime.setAuth(data.session.access_token);

  if (channel) {
    await supabase.removeChannel(channel);
    channel = null;
  }

  channel = supabase
    .channel('hivelink-chat-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'chat_sessions',
      },
      onChange
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'chat_messages',
      },
      onChange
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'patients',
      },
      onChange
    )
    .subscribe((status, error) => {
      console.log('Supabase Realtime status:', status);

      if (error) {
        console.error('Supabase Realtime error:', error);
      }
    });

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