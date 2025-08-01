// protect.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
import { supabaseUrl, supabaseKey } from './config.js';

export const supabase = createClient(supabaseUrl, supabaseKey);

export async function protectPage(allowedRoles = []) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return window.location.href = '/login.html';

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !allowedRoles.includes(profile.role)) {
    document.body.innerHTML = \<h3>🚫 Akses ditolak untuk role: \.</h3>\;
    throw new Error('Akses ditolak');
  }

  return profile.role;
}

