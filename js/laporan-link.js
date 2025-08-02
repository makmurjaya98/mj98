// ✅ File: laporan-link.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://mguxpcbskqxnbpbuhdjj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ndXhwY2Jza3F4bmJwYnVoZGpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyMzU1MDEsImV4cCI6MjA2ODgxMTUwMX0.MujhdOQF_aSUWX7XJkQ0ybMNtTPsO-FZggg4DYSHFYY'
);

let currentUser = null;
let currentRole = null;
let allData = [];

// Ambil user login
async function initUser() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return window.location.href = "/login.html";

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, cabang_id, mitra_id")
    .eq("id", user.id)
    .single();

  currentUser = profile;
  currentRole = profile.role;
}

async function loadLaporanLink() {
  let query = supabase.from('laporan_penjualan_link').select('*').order('created_at', { ascending: false });

  // Filter berdasarkan role
  if (currentRole === "link") {
    query = query.eq("link_id", currentUser.id);
  } else if (currentRole === "cabang") {
    query = query.eq("cabang_id", currentUser.cabang_id);
  } else if (currentRole === "mitra-cabang") {
    query = query.eq("mitra_id", currentUser.mitra_id);
  }

  const { data, error } = await query;
  if (error) return console.error("Gagal ambil data:", error);

  allData = data;
  renderTable(allData);
}

function renderTable(data) {
  const tbody = document.querySelector("#laporan-link-table tbody");
  tbody.innerHTML = "";

  data.forEach(row => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${row.nama_link || '-'}</td>
      <td>${row.qty || 0}</td>
      <td>Rp ${row.harga_pokok}</td>
      <td>Rp ${row.total_pokok}</td>
      <td>Rp ${row.share_cabang}</td>
      <td>Rp ${row.total_share}</td>
      <td>Rp ${row.komisi_link}</td>
      <td>${(currentRole !== 'link') ? 'Rp ' + row.komisi_cabang : '-'}</td>
      <td>${(currentRole === 'owner' || currentRole === 'admin') ? 'Rp ' + row.komisi_mitra : '-'}</td>
      <td>Rp ${row.pendapatan_link}</td>
      <td>Rp ${row.total_setoran}</td>
      <td>${row.status_setoran ? '✅' : '❌'}</td>
      <td>${new Date(row.created_at).toLocaleDateString()}</td>
    `;
    tbody.appendChild(tr);
  });
}

window.filterTanggal = function () {
  const start = new Date(document.getElementById('filter-start').value);
  const end = new Date(document.getElementById('filter-end').value);

  if (!start || !end) return alert("❗Masukkan kedua tanggal untuk filter.");

  const filtered = allData.filter(row => {
    const tgl = new Date(row.created_at);
    return tgl >= start && tgl <= end;
  });

  renderTable(filtered);
};

window.exportExcel = function () {
  import("https://cdn.sheetjs.com/xlsx-0.20.0/package/xlsx.mjs").then(XLSX => {
    const rows = Array.from(document.querySelectorAll("#laporan-link-table tbody tr")).map(tr => {
      const cells = tr.querySelectorAll("td");
      return {
        Link: cells[0].innerText,
        Qty: cells[1].innerText,
        Harga_Pokok: cells[2].innerText,
        Total_Pokok: cells[3].innerText,
        Share_Cabang: cells[4].innerText,
        Total_Share: cells[5].innerText,
        Komisi_Link: cells[6].innerText,
        Komisi_Cabang: cells[7].innerText,
        Komisi_Mitra: cells[8].innerText,
        Pendapatan_Link: cells[9].innerText,
        Total_Setoran: cells[10].innerText,
        Status: cells[11].innerText,
        Tanggal: cells[12].innerText,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Link");
    XLSX.writeFile(workbook, "laporan_penjualan_link.xlsx");
  });
};

window.konfirmasiSetoran = async function () {
  const { error } = await supabase
    .from("laporan_penjualan_link")
    .update({ status_setoran: true })
    .eq("link_id", currentUser.id);

  if (error) return alert("❌ Gagal konfirmasi");

  alert("✅ Setoran dikonfirmasi");
  loadLaporanLink();
};

document.addEventListener("DOMContentLoaded", async () => {
  await initUser();
  await loadLaporanLink();
});
