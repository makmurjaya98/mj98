import { supabase } from "./supabase-init.js";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("registerForm");
  const togglePassword = document.getElementById("togglePassword");
  const passwordInput = document.getElementById("password");

  // Ambil parameter dari URL
  const urlParams = new URLSearchParams(window.location.search);
  const owner_id = urlParams.get("owner");
  const mitra_id = urlParams.get("mitra");
  const cabang_id = urlParams.get("cabang");

  // Toggle password visibility
  togglePassword.addEventListener("click", () => {
    const type = passwordInput.type === "password" ? "text" : "password";
    passwordInput.type = type;
    togglePassword.textContent = type === "password" ? "👁️" : "🙈";
  });

  // Submit form pendaftaran
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

    // Validasi parameter penting
    if (!owner_id || !mitra_id || !cabang_id) {
      alert("❌ Link tidak valid. Parameter owner/mitra/cabang wajib!");
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
          role: "link",
          owner_id,
          mitra_id,
          cabang_id
        }
      }
    });

    if (error) {
      alert("❌ Gagal mendaftar: " + error.message);
      console.error(error);
      return;
    }

    alert("✅ Berhasil mendaftar sebagai Link Penjual!");
    window.location.href = "dashboard-link.html";
  });
});
