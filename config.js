// MJ98 - config.js
// ✅ Inisialisasi koneksi Supabase

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// ✅ Konfigurasi Supabase
export const supabaseUrl = 'https://mguxpcbskqxnbpbuhdjj.supabase.co';
export const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ndXhwY2Jza3F4bmJwYnVoZGpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyMzU1MDEsImV4cCI6MjA2ODgxMTUwMX0.MujhdOQF_aSUWX7XJkQ0ybMNtTPsO-FZggg4DYSHFYY';

export const supabase = createClient(supabaseUrl, supabaseKey);

// ✅ Logging jika koneksi berhasil
console.log("✅ Supabase berhasil dikonfigurasi di config.js");

// ✅ Fungsi utilitas umum jika diperlukan (misalnya redirect jika tidak login)
export async function proteksiLogin() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) window.location.href = "login.html";
  return user;
}
