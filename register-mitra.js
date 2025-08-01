// 🔗 Inisialisasi Supabase langsung di sini
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = "https://mguxpcbskqxnbpbuhdjj.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ndXhwY2Jza3F4bmJwYnVoZGpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyMzU1MDEsImV4cCI6MjA2ODgxMTUwMX0.MujhdOQF_aSUWX7XJkQ0ybMNtTPsO-FZggg4DYSHFYY";

const supabase = createClient(supabaseUrl, supabaseKey);
console.log("✅ Supabase berhasil terhubung dari register-mitra.js");

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("registerForm");
  const togglePassword = document.getElementById("togglePassword");
  const passwordInput = document.getElementById("password");

  // Ambil owner_id dari URL
  const urlParams = new URLSearchParams(window.location.search);
  const owner_id = urlParams.get("owner");

  // 👁️ Toggle password visibility
  togglePassword.addEventListener("click", () => {
    const type = passwordInput.type === "password" ? "text" : "password";
    passwordInput.type = type;
    togglePassword.textContent = type === "password" ? "👁️" : "🙈";
  });

  // 📩 Submit form pendaftaran
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("username").value.trim();
    const full_name = document.getElementById("full_name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const id_number = document.getElementById("id_number").value.trim();
    const phone_number = document.getElementById("phone_number").value.trim();
    const address = document.getElementById("address").value.trim();
    const nik = document.getElementById("nik").value.trim();

    if (!owner_id) {
      alert("❌ Link tidak valid! Parameter owner tidak ditemukan.");
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          full_name,
          id_number,
          phone_number,
          address,
          nik,
          role: "mitra-cabang",
          owner_id
        }
      }
    });

    if (error) {
      alert("❌ Gagal mendaftar: " + error.message);
      console.error(error);
      return;
    }

    alert("✅ Pendaftaran berhasil! Silakan login.");
    window.location.href = "login.html";
  });
});
