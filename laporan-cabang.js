import { supabase } from "./supabase-init.js";

let currentUser = null;
let currentRole = null;
let cabangId = null;

document.addEventListener("DOMContentLoaded", async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    alert("Silakan login terlebih dahulu.");
    window.location.href = "/login.html";
    return;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile || profile.role !== "cabang") {
    alert("Akses ditolak. Halaman ini hanya untuk Cabang.");
    window.location.href = "/login.html";
    return;
  }

  currentUser = profile;
  currentRole = profile.role;
  cabangId = profile.id;

  // Event listener tombol
  document.getElementById("tampilkanBtn").addEventListener("click", loadLaporan);
  document.getElementById("logoutBtn").addEventListener("click", logout);

  // Load awal
  await loadLaporan();
});

async function loadLaporan() {
  const start = document.getElementById("filter-start").value;
  const end = document.getElementById("filter-end").value;

  const filters = {};
  if (start) filters.start = new Date(start + "T00:00:00");
  if (end) filters.end = new Date(end + "T23:59:59");

  // Ambil semua link di bawah cabang ini
  const { data: links } = await supabase
    .from("profiles")
    .select("id, username")
    .eq("role", "link")
    .eq("cabang_id", cabangId);

  const linkIds = links.map(link => link.id);
  const linkMap = Object.fromEntries(links.map(link => [link.id, link.username]));

  if (linkIds.length === 0) {
    renderKosong();
    return;
  }

  // Ambil penjualan semua link
  let query = supabase
    .from("penjualan")
    .select("*")
    .in("user_id", linkIds);

  if (filters.start) query = query.gte("tanggal", filters.start.toISOString());
  if (filters.end) query = query.lte("tanggal", filters.end.toISOString());

  const { data: penjualan, error } = await query;

  if (error) {
    console.error("Gagal ambil penjualan:", error);
    Swal.fire("Error", "Gagal mengambil data penjualan", "error");
    return;
  }

  renderLaporan(penjualan, linkMap);
}

function renderLaporan(penjualan, linkMap) {
  const tbody = document.querySelector("#laporan-table tbody");
  tbody.innerHTML = "";

  let totalVoucher = 0;
  let totalPenjualan = 0;
  let totalShare = 0;
  let totalKomisi = 0;
  let totalPendapatan = 0;

  const komisiPersen = 0.1; // contoh 10%
  
  penjualan.forEach(p => {
    const jumlah = p.jumlah || 0;
    const harga_jual = p.harga_jual || 0;
    const harga_pokok = p.harga_pokok || 0;
    const share_cabang = p.share_cabang || 0;
    const tanggal = new Date(p.tanggal).toLocaleDateString("id-ID");

    const total = jumlah * harga_jual;
    const komisi = jumlah * harga_pokok * komisiPersen;
    const pendapatan = komisi + (jumlah * share_cabang);

    totalVoucher += jumlah;
    totalPenjualan += total;
    totalShare += jumlah * share_cabang;
    totalKomisi += komisi;
    totalPendapatan += pendapatan;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${linkMap[p.user_id] || "-"}</td>
      <td>${jumlah}</td>
      <td>Rp${formatRupiah(total)}</td>
      <td>Rp${formatRupiah(jumlah * share_cabang)}</td>
      <td>Rp${formatRupiah(komisi)}</td>
      <td>Rp${formatRupiah(pendapatan)}</td>
      <td>${tanggal}</td>
    `;
    tbody.appendChild(tr);
  });

  document.getElementById("summary-text").textContent =
    `Total voucher: ${totalVoucher} | Total penjualan: Rp${formatRupiah(totalPenjualan)} | Total share: Rp${formatRupiah(totalShare)} | Komisi Cabang: Rp${formatRupiah(totalKomisi)} | Pendapatan Cabang: Rp${formatRupiah(totalPendapatan)}`;
}

function renderKosong() {
  const tbody = document.querySelector("#laporan-table tbody");
  tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;">Tidak ada penjualan dari Link</td></tr>`;
  document.getElementById("summary-text").textContent =
    `Total voucher: 0 | Total penjualan: Rp0 | Total share: Rp0 | Komisi Cabang: Rp0 | Pendapatan Cabang: Rp0`;
}

function formatRupiah(number) {
  return number.toLocaleString("id-ID");
}

async function logout() {
  await supabase.auth.signOut();
  window.location.href = "/login.html";
}

