import { supabase } from "./config.js";

let users = [];
let userChart;

const roleCount = { owner: 0, admin: 0, "mitra-cabang": 0, cabang: 0, link: 0 };

document.addEventListener("DOMContentLoaded", async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return window.location.href = "/login.html";

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role;

  if (profileError || !["owner", "admin"].includes(role)) {
    document.body.innerHTML = '<h3>🚫 Akses ditolak. Halaman ini hanya untuk Owner atau Admin.</h3>';
    return;
  }

  if (role !== "owner") {
    document.querySelectorAll(".hanya-owner").forEach(el => el.style.display = "none");
  }
  if (role !== "admin") {
    document.querySelectorAll(".hanya-admin").forEach(el => el.style.display = "none");
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, role, created_at, parent_id, full_name")
    .eq("owner_id", user.id);

  if (error) {
    alert("Gagal mengambil data user: " + error.message);
    return;
  }

  users = data;

  users.forEach(u => {
    if (roleCount[u.role] !== undefined) roleCount[u.role]++;
  });

  document.getElementById('summary').innerHTML = `
    <p>👑 Owner: ${roleCount.owner}</p>
    <p>🛡️ Admin: ${roleCount.admin}</p>
    <p>🧑 Mitra Cabang: ${roleCount['mitra-cabang']}</p>
    <p>🏢 Cabang: ${roleCount.cabang}</p>
    <p>👨‍💻 Link: ${roleCount.link}</p>
  `;

  drawChartDefault();
  tampilkanTopCabang();

  if (role === 'owner') {
    document.getElementById("total-penjualan").textContent = "Rp 5.000.000";
  }
  if (role === 'admin') {
    document.getElementById("voucher-terjual").textContent = "120";
  }
});

function drawChartDefault() {
  const now = new Date();
  const dateCounts = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    dateCounts[key] = 0;
  }

  users.forEach(u => {
    const d = new Date(u.created_at).toISOString().slice(0, 10);
    if (dateCounts[d] !== undefined) dateCounts[d]++;
  });

  const labels = Object.keys(dateCounts);
  const dataPoints = Object.values(dateCounts);

  const ctx = document.getElementById('userChart');
  userChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'User Baru per Hari',
        data: dataPoints,
        backgroundColor: 'rgba(54, 162, 235, 0.7)'
      }]
    },
    options: {
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

document.getElementById('filterBtn').addEventListener('click', () => {
  const start = document.getElementById('startDate').value;
  const end = document.getElementById('endDate').value;
  if (!start || !end) return alert('Pilih tanggal awal dan akhir.');

  const startDate = new Date(start);
  const endDate = new Date(end);
  const dateCounts = {};

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const key = d.toISOString().slice(0, 10);
    dateCounts[key] = 0;
  }

  users.forEach(u => {
    const d = new Date(u.created_at);
    const key = d.toISOString().slice(0, 10);
    if (dateCounts[key] !== undefined) dateCounts[key]++;
  });

  userChart.data.labels = Object.keys(dateCounts);
  userChart.data.datasets[0].data = Object.values(dateCounts);
  userChart.update();
});

function tampilkanTopCabang() {
  const cabangs = users.filter(u => u.role === 'cabang');
  const links = users.filter(u => u.role === 'link');

  const linkCount = {};
  links.forEach(link => {
    if (link.parent_id) {
      linkCount[link.parent_id] = (linkCount[link.parent_id] || 0) + 1;
    }
  });

  const cabangList = cabangs.map(cabang => ({
    nama: cabang.full_name || '(Tanpa Nama)',
    jumlah_link: linkCount[cabang.id] || 0
  }));

  cabangList.sort((a, b) => b.jumlah_link - a.jumlah_link);

  const tbody = document.querySelector('#topCabangTable tbody');
  tbody.innerHTML = '';

  if (cabangList.length === 0) {
    tbody.innerHTML = '<tr><td colspan="2">Belum ada data cabang</td></tr>';
    return;
  }

  cabangList.forEach(row => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${row.nama}</td><td>${row.jumlah_link}</td>`;
    tbody.appendChild(tr);
  });
}

