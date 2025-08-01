import { supabase } from "./supabase-init.js";

let currentUser = null;
let mitraId = null;

document.addEventListener("DOMContentLoaded", async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    alert("Silakan login terlebih dahulu.");
    return window.location.href = "/login.html";
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile || profile.role !== "mitra-cabang") {
    alert("Akses ditolak. Hanya untuk Mitra-Cabang.");
    return window.location.href = "/login.html";
  }

  currentUser = profile;
  mitraId = profile.id;

  document.getElementById("tampilkanBtn").addEventListener("click", loadLaporan);
  document.getElementById("logoutBtn").addEventListener("click", logout);

  await loadLaporan();
});

async function loadLaporan() {
  const start = document.getElementById("filter-start").value;
  const end = document.getElementById("filter-end").value;

  const startDate = start ? new Date(start + "T00:00:00") : null;
  const endDate = end ? new Date(end + "T23:59:59") : null;

  // 1. Ambil semua cabang milik mitra ini
  const { data: cabangs } = await supabase
    .from("profiles")
    .select("id, username")
    .eq("role", "cabang")
    .eq("mitra_id", mitraId);

  if (!cabangs || cabangs.length === 0) {
    renderKosong();
    return;
  }

  const cabangIds = cabangs.map(c => c.id);
  const cabangMap = Object.fromEntries(cabangs.map(c => [c.id, c.username]));

  // 2. Ambil semua link di bawah cabang tersebut
  const { data: links } = await supabase
    .from("profiles")
    .select("id, username, cabang_id")
    .eq("role", "link")
    .in("cabang_id", cabangIds);

  if (!links || links.length === 0) {
    renderKosong();
    return;
  }

  const linkIds = links.map(l => l.id);
  const linkMap = Object.fromEntries(links.map(l => [l.id, { username: l.username, cabang_id: l.cabang_id }]));

  // 3. Ambil semua penjualan dari link tersebut
  let query = supabase
    .from("penjualan")
    .select("*")
    .in("user_id", linkIds);

  if (startDate) query = query.gte("tanggal", startDate.toISOString());
  if (endDate) query = query.lte("tanggal", endDate.toISOString());

  const { data: penjualan, error } = await query;
  if (error) {
    console.error("Gagal ambil penjualan", error);
    Swal.fire("Error", "Gagal mengambil data penjualan", "error");
    return;
  }

  renderLaporan(penjualan, linkMap, cabangMap);
}

function renderLaporan(penjualan, linkMap, cabangMap) {
  const tbodyLink = document.querySelector("#laporan-link tbody");
  const tbodyCabang = document.querySelector("#rekap-cabang tbody");
  tbodyLink.innerHTML = "";
  tbodyCabang.innerHTML = "";

  const komisiCabangPersen = 0.1; // 10%
  const komisiMitraPersen = 0.05; // 5%

  let totalVoucher = 0;
  let totalPenjualan = 0;
  let totalShare = 0;
  let totalKomisiCabang = 0;
  let totalKomisiMitra = 0;
  let totalPendapatan = 0;

  const rekapPerCabang = {};

  penjualan.forEach(p => {
    const jumlah = p.jumlah || 0;
    const harga_jual = p.harga_jual || 0;
    const harga_pokok = p.harga_pokok || 0;
    const share_cabang = p.share_cabang || 0;
    const tanggal = new Date(p.tanggal).toLocaleDateString("id-ID");

    const total = jumlah * harga_jual;
    const komisiCabang = jumlah * harga_pokok * komisiCabangPersen;
    const komisiMitra = jumlah * harga_pokok * komisiMitraPersen;
    const share = jumlah * share_cabang;
    const pendapatan = komisiCabang + share + komisiMitra;

    totalVoucher += jumlah;
    totalPenjualan += total;
    totalShare += share;
    totalKomisiCabang += komisiCabang;
    totalKomisiMitra += komisiMitra;
    totalPendapatan += pendapatan;

    const { username: linkNama, cabang_id } = linkMap[p.user_id] || {};
    const cabangNama = cabangMap[cabang_id] || "-";

    // Tabel link
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${linkNama}</td>
      <td>${cabangNama}</td>
      <td>${jumlah}</td>
      <td>Rp${formatRupiah(total)}</td>
      <td>Rp${formatRupiah(share)}</td>
      <td>Rp${formatRupiah(komisiCabang)}</td>
      <td>Rp${formatRupiah(komisiMitra)}</td>
      <td>Rp${formatRupiah(pendapatan)}</td>
      <td>${tanggal}</td>
    `;
    tbodyLink.appendChild(tr);

    // Rekap per cabang
    if (!rekapPerCabang[cabang_id]) {
      rekapPerCabang[cabang_id] = {
        nama: cabangNama,
        jumlah: 0,
        penjualan: 0,
        share: 0,
        komisiCabang: 0,
        komisiMitra: 0,
        pendapatan: 0
      };
    }

    const r = rekapPerCabang[cabang_id];
    r.jumlah += jumlah;
    r.penjualan += total;
    r.share += share;
    r.komisiCabang += komisiCabang;
    r.komisiMitra += komisiMitra;
    r.pendapatan += pendapatan;
  });

  // Tabel rekap cabang
  for (const cabang_id in rekapPerCabang) {
    const r = rekapPerCabang[cabang_id];
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${r.nama}</td>
      <td>${r.jumlah}</td>
      <td>Rp${formatRupiah(r.penjualan)}</td>
      <td>Rp${formatRupiah(r.share)}</td>
      <td>Rp${formatRupiah(r.komisiCabang)}</td>
      <td>Rp${formatRupiah(r.komisiMitra)}</td>
      <td>Rp${formatRupiah(r.pendapatan)}</td>
    `;
    tbodyCabang.appendChild(tr);
  }

  // Ringkasan total
  document.getElementById("summary-text").textContent =
    `Total voucher: ${totalVoucher} | Total penjualan: Rp${formatRupiah(totalPenjualan)} | Share Harga: Rp${formatRupiah(totalShare)} | Komisi Cabang: Rp${formatRupiah(totalKomisiCabang)} | Komisi Mitra: Rp${formatRupiah(totalKomisiMitra)} | Pendapatan Total: Rp${formatRupiah(totalPendapatan)}`;
}

function renderKosong() {
  document.querySelector("#laporan-link tbody").innerHTML = `<tr><td colspan="9" style="text-align:center;">Tidak ada data penjualan</td></tr>`;
  document.querySelector("#rekap-cabang tbody").innerHTML = "";
  document.getElementById("summary-text").textContent =
    `Total voucher: 0 | Total penjualan: Rp0 | Share Harga: Rp0 | Komisi Cabang: Rp0 | Komisi Mitra: Rp0 | Pendapatan Total: Rp0`;
}

function formatRupiah(number) {
  return number.toLocaleString("id-ID");
}

async function logout() {
  await supabase.auth.signOut();
  window.location.href = "/login.html";
}

