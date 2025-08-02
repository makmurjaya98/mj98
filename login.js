import { supabase, redirectDashboard } from "./supabase-init.js";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  const togglePassword = document.getElementById("togglePassword");
  const passwordInput = document.getElementById("password");

  // 👁️ Toggle password visibility
  togglePassword.addEventListener("click", () => {
    const type = passwordInput.type === "password" ? "text" : "password";
    passwordInput.type = type;
    togglePassword.textContent = type === "password" ? "👁️" : "🙈";
  });

  // 📩 Proses login saat form disubmit
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    if (!email || !password) {
      alert("❗ Email dan password wajib diisi.");
      return;
    }

    // 🟢 Login ke Supabase
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      alert("❌ Login gagal: " + error.message);
      return;
    }

    // 🔁 Redirect otomatis berdasarkan role
    try {
      await redirectDashboard();
    } catch (err) {
      alert("❌ Gagal redirect: " + err.message);
    }
  });
});
