import { supabase } from "./supabase-init.js";

let currentUser = null;
let currentProfile = null;
let komisi = {};

document.addEventListener("DOMContentLoaded", async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    alert("Silakan login terlebih dahulu.");
    return (window.location.href = "/login.html");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, username")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "link") {
    alert("Akses ditolak. Halaman ini hanya untuk user Link.");
    return (window.location.href = "/login.html");
  }

  currentUser = user;
  currentProfile = profile;

  // Ambil data komisi dari voucher_share_settings
  const { data: setting } = await supabase
    .from("voucher_share_settings")
    .select("komisi_link_persen, komisi_cabang_persen, komisi_mitra_persen, share_cabang")
    .eq("id", user.id)
    .single();

  komisi = {
    link: (setting?.komisi_link_persen || 0) / 100,
    cabang: (setting?.komisi_cabang_persen || 0) / 100,
    mitra: (setting?.komisi_mitra_persen || 0) / 100,
    share_cabang: setting?.share_cabang || 0,
  };

  await loadLaporan();
  document.getElementById("filter-start").addEventListener("change", loadLaporan);
  document.getElementById("filter-end").addEventListener("change", loadLaporan);
});

async function loadLaporan() {
  const tbody = document.querySelector("#laporan-link-table tbody");
  tbody.innerHTML = "";

  const start = document.getElementById("filter-start").value;
  const end = document.getElementById("filter-end").value;

  const filterStart = start ? new Date(start + "T00:00:00").toISOString() : null;
  const filterEnd = end ? new Date(end + "T23:59:59").toISOString() : null;

  let query = supabase
    .from("penjualan")
    .select("*")
    .eq("user_id", currentUser.id);

  if (filterStart) query = query.gte("tanggal", filterStart);
  if (filterEnd) query = query.lte("tanggal", filterEnd);

  const { data: penjualan, error } = await query;
  if (error) return Swal.fire("Error", "Gagal memuat data", "error");

  penjualan.forEach(p => {
    const jumlah = p.jumlah || 0;
    const harga_pokok = p.harga_pokok || 0;
    const harga_jual = p.harga_jual || 0;
    const tanggal = new Date(p.tanggal).toLocaleDateString("id-ID");

    const total_pokok = harga_pokok * jumlah;
    const total_jual = harga_jual * jumlah;

    const komisi_link = jumlah * harga_pokok * komisi.link;
    const komisi_cabang = jumlah * harga_pokok * komisi.cabang;
    const komisi_mitra = jumlah * harga_pokok * komisi.mitra;
    const total_share = komisi.share_cabang * jumlah;

    const pendapatan_link = (harga_jual - harga_pokok - komisi.share_cabang) * jumlah + komisi_link;
    const setoran_owner = total_pokok - komisi_link - komisi_cabang - komisi_mitra;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${jumlah}</td>
      <td>Rp${formatRupiah(harga_pokok)}</td>
      <td>Rp${formatRupiah(total_pokok)}</td>
      <td>Rp${formatRupiah(harga_jual)}</td>
      <td>Rp${formatRupiah(total_jual)}</td>
      <td>Rp${formatRupiah(komisi_link)}</td>
      <td>Rp${formatRupiah(komisi_cabang)}</td>
      <td>Rp${formatRupiah(komisi_mitra)}</td>
      <td>Rp${formatRupiah(total_share)}</td>
      <td>Rp${formatRupiah(pendapatan_link)}</td>
      <td>Rp${formatRupiah(setoran_owner)}</td>
      <td>${p.status || "-"}</td>
      <td>${tanggal}</td>
    `;
    tbody.appendChild(tr);
  });
}

window.filterTanggal = loadLaporan;

window.exportExcel = () => {
  const rows = [...document.querySelectorAll("#laporan-link-table tr")];
  const csv = rows.map(row =>
    [...row.children].map(cell => `"${cell.innerText}"`).join(",")
  ).join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `laporan-link-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

window.konfirmasiSetoran = async () => {
  const { isConfirmed } = await Swal.fire({
    title: "Konfirmasi Setoran?",
    text: "Data penjualan akan dianggap sudah disetor ke owner.",
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Ya, Konfirmasi"
  });

  if (!isConfirmed) return;

  const { error } = await supabase
    .from("penjualan")
    .update({ status: "Disetor" })
    .eq("user_id", currentUser.id)
    .eq("status", "Belum Disetor");

  if (error) {
    return Swal.fire("Error", "Gagal update status setoran", "error");
  }

  Swal.fire("Berhasil", "Setoran dikonfirmasi", "success");
  await loadLaporan();
};

function formatRupiah(angka) {
  return angka.toLocaleString("id-ID");
}
