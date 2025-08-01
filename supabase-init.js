// MJ98 - supabase-init.js
// 🔌 Inisialisasi dan utilitas umum Supabase

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// 🎯 Konfigurasi URL dan anon key dari Supabase
export const supabaseUrl = 'https://mguxpcbskqxnbpbuhdjj.supabase.co';
export const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ndXhwY2Jza3F4bmJwYnVoZGpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyMzU1MDEsImV4cCI6MjA2ODgxMTUwMX0.MujhdOQF_aSUWX7XJkQ0ybMNtTPsO-FZggg4DYSHFYY';

// 🚀 Client Supabase
export const supabase = createClient(supabaseUrl, supabaseKey);

// 🛡️ Fungsi Proteksi Login
export async function proteksiLogin(redirectUrl = "login.html") {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    window.location.href = redirectUrl;
    return null;
  }
  return user;
}

// 📡 Ambil profil lengkap (dari tabel profiles)
export async function ambilProfilLengkap(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("❌ Gagal ambil profil:", error.message);
    return null;
  }
  return data;
}

// 🔁 Redirect ke dashboard sesuai role
export function redirectDashboard(role) {
  if (role === "owner") window.location.href = "dashboard-owner.html";
  else if (role === "mitra-cabang") window.location.href = "dashboard-mitra.html";
  else if (role === "cabang") window.location.href = "dashboard-cabang.html";
  else if (role === "link") window.location.href = "dashboard-link.html";
  else alert("❌ Role tidak dikenali: " + role);
}

// ✅ Logging
console.log("✅ supabase-init.js berhasil dimuat");

