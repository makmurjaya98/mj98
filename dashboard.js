import { supabase, redirectDashboard } from "./supabase-init.js";

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return window.location.href = "login.html";
    }

    // 🔁 Langsung redirect ke dashboard sesuai role
    await redirectDashboard();
  } catch (err) {
    alert("❌ Terjadi kesalahan: " + err.message);
    window.location.href = "login.html";
  }
});
