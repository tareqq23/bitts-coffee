import { supabase } from './supabaseClient.js';

function response(status, payload) {
  return {
    status,
    ok: status >= 200 && status < 300,
    async json() { return payload; }
  };
}

window.supabaseLogin = async (options) => {
  const body = JSON.parse(options.body || '{}');
  const { data, error } = await supabase.auth.signInWithPassword({
    email: body.username,
    password: body.password
  });
  if (error) return response(401, { success: false, error: error.message });
  return response(200, { success: true, token: data.session?.access_token });
};

window.supabaseAuthCheck = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return { success: !!user, authenticated: !!user };
};

const existingSession = await supabase.auth.getSession();
if (existingSession.data.session) window.location.replace('/admin');
