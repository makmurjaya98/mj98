// 🔐 Script Proteksi Akses Berdasarkan Role
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
import { supabaseUrl, supabaseKey } from './config.js';

const supabase = createClient(supabaseUrl, supabaseKey);

export async function cekAksesFitur(namaHalaman) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    alert('Silakan login dulu');
    window.location.href = '/login.html';
    return;
  }

  const { data: profil, error: errorProfil } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (errorProfil || !profil) {
    alert('Gagal mendapatkan profil user');
    window.location.href = '/login.html';
    return;
  }

  const role = profil.role;

  const { data: akses, error: errorAkses } = await supabase
    .from('akses_fitur')
    .select('*')
    .eq('role', role)
    .eq('fitur', namaHalaman)
    .single();

  if (errorAkses || !akses || akses.diizinkan !== true) {
    alert('❌ Akses ditolak!');
    window.location.href = '/unauthorized.html';
  }
}
