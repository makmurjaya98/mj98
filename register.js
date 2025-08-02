import { supabase } from "./config.js";

// ✅ Fungsi validasi UUID
function isValidUUID(uuid) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid);
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("registerForm");
  const togglePassword = document.getElementById("togglePassword");
  const passwordInput = document.getElementById("password");

  // 👁️ Toggle password visibility
  togglePassword.addEventListener("click", () => {
    const type = passwordInput.type === "password" ? "text" : "password";
    passwordInput.type = type;
    togglePassword.textContent = type === "password" ? "👁️" : "🙈";
  });

  // 📩 Saat Form Submit
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // 🔍 Ambil semua input dari form
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const role = document.getElementById("role").value;
    const username = document.getElementById("username").value.trim();
    const full_name = document.getElementById("full_name").value.trim();
    const id_number = document.getElementById("id_number").value.trim();
    const phone_number = document.getElementById("phone_number").value.trim();
    const address = document.getElementById("address").value.trim();
    const nik = document.getElementById("nik").value.trim();

    // Validasi input wajib
    if (!email || !password || !role || !username || !full_name || !id_number || !phone_number || !address || !nik) {
      alert("❗ Semua kolom wajib diisi!");
      return;
    }

    // ⛓️ Mapping parent ID
    const urlParams = new URLSearchParams(window.location.search);
    let owner_id = null;
    let mitra_id = null;
    let cabang_id = null;
    let parent_id = null;

    if (role === "owner") {
      // Tidak ada parent
    } else if (role === "mitra-cabang") {
      owner_id = urlParams.get("owner");
      parent_id = owner_id;
      if (!owner_id) return alert("❌ Link tidak valid: owner_id kosong");
    } else if (role === "cabang") {
      mitra_id = urlParams.get("mitra");
      owner_id = urlParams.get("owner");
      parent_id = mitra_id;
      if (!mitra_id || !owner_id) return alert("❌ Link tidak valid: mitra/owner kosong");
    } else if (role === "link") {
      cabang_id = urlParams.get("cabang");
      mitra_id = urlParams.get("mitra");
      owner_id = urlParams.get("owner");
      parent_id = cabang_id;
      if (!cabang_id || !mitra_id || !owner_id) return alert("❌ Link tidak valid: cabang/mitra/owner kosong");
    }

    // ✨ Kirim metadata lengkap ke Supabase
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role,
          username: username.slice(0, 30),
          full_name: full_name.slice(0, 50),
          id_number: id_number.slice(0, 50),
          phone_number: phone_number.slice(0, 20),
          address: address.slice(0, 100),
          nik: nik.slice(0, 50),
          is_active: true,
          is_verified: false,
          ...(isValidUUID(owner_id) && { owner_id }),
          ...(isValidUUID(mitra_id) && { mitra_id }),
          ...(isValidUUID(cabang_id) && { cabang_id }),
          ...(isValidUUID(parent_id) && { parent_id })
        }
      }
    });

    if (error) {
      alert("❌ Gagal mendaftar: " + error.message);
      console.error(error);
    } else {
      alert("✅ Berhasil mendaftar! Silakan cek email untuk verifikasi.");
      window.location.href = "login.html";
    }
  });
});
