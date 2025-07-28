import { api, APIError } from "encore.dev/api";
import { Query } from "encore.dev/api";
import { authDB } from "../auth/db";

export interface LaporanRequest {
  fromDate?: Query<string>;
  toDate?: Query<string>;
  mitraCabangId?: Query<number>;
  cabangId?: Query<number>;
  linkId?: Query<number>;
}

export interface StokVoucherItem {
  tanggal: Date;
  jenisVoucher: string;
  linkId: number;
  linkName: string;
  linkUsername: string;
  cabangId: number;
  cabangName: string;
  mitraCabangId: number;
  mitraCabangName: string;
  stokTersisa: number;
}

export interface PenjualanVoucherItem {
  tanggal: Date;
  jenisVoucher: string;
  linkId: number;
  linkName: string;
  linkUsername: string;
  cabangId: number;
  cabangName: string;
  mitraCabangId: number;
  mitraCabangName: string;
  jumlahTerjual: number;
}

export interface PendapatanVoucherItem {
  tanggal: Date;
  jenisVoucher: string;
  linkId: number;
  linkName: string;
  linkUsername: string;
  cabangId: number;
  cabangName: string;
  mitraCabangId: number;
  mitraCabangName: string;
  hargaPokok: number;
  hargaJual: number;
  shareHargaCabang: number;
  feeLink: number;
  feeCabang: number;
  komisiMitra: number;
  pendapatanBersih: number;
  jumlahTerjual: number;
}

export interface LaporanResponse {
  stokVoucher: StokVoucherItem[];
  penjualanVoucher: PenjualanVoucherItem[];
  pendapatanVoucher: PendapatanVoucherItem[];
}

// Retrieves comprehensive voucher reports including stock, sales, and revenue data.
export const getLaporan = api<LaporanRequest, LaporanResponse>(
  { expose: true, method: "GET", path: "/voucher/laporan" },
  async (req) => {
    // Build date filter conditions
    let dateCondition = "";
    const params: any[] = [];
    let paramIndex = 1;

    if (req.fromDate) {
      dateCondition += ` AND created_at >= $${paramIndex}`;
      params.push(new Date(req.fromDate));
      paramIndex++;
    }

    if (req.toDate) {
      const toDate = new Date(req.toDate);
      toDate.setHours(23, 59, 59, 999); // End of day
      dateCondition += ` AND created_at <= $${paramIndex}`;
      params.push(toDate);
      paramIndex++;
    }

    // Build hierarchy filter conditions
    let hierarchyCondition = "";
    
    if (req.linkId) {
      hierarchyCondition += ` AND link_id = $${paramIndex}`;
      params.push(req.linkId);
      paramIndex++;
    } else if (req.cabangId) {
      hierarchyCondition += ` AND cabang_id = $${paramIndex}`;
      params.push(req.cabangId);
      paramIndex++;
    } else if (req.mitraCabangId) {
      hierarchyCondition += ` AND mitra_cabang_id = $${paramIndex}`;
      params.push(req.mitraCabangId);
      paramIndex++;
    }

    // Get stock data
    const stokVoucher: StokVoucherItem[] = [];
    const stockQuery = `
      SELECT 
        vs.updated_at as tanggal,
        vs.voucher_type as jenis_voucher,
        vs.link_id,
        l.full_name as link_name,
        l.username as link_username,
        vs.cabang_id,
        c.full_name as cabang_name,
        vs.mitra_cabang_id,
        m.full_name as mitra_cabang_name,
        vs.amount as stok_tersisa
      FROM voucher_stocks vs
      JOIN users l ON vs.link_id = l.id
      JOIN users c ON vs.cabang_id = c.id
      JOIN users m ON vs.mitra_cabang_id = m.id
      WHERE vs.amount > 0 ${hierarchyCondition}
      ORDER BY vs.updated_at DESC
    `;

    const stockRows = authDB.rawQuery<{
      tanggal: Date;
      jenis_voucher: string;
      link_id: number;
      link_name: string;
      link_username: string;
      cabang_id: number;
      cabang_name: string;
      mitra_cabang_id: number;
      mitra_cabang_name: string;
      stok_tersisa: number;
    }>(stockQuery, ...params.slice(req.linkId ? -1 : req.cabangId ? -1 : req.mitraCabangId ? -1 : 0));

    for await (const row of stockRows) {
      stokVoucher.push({
        tanggal: row.tanggal,
        jenisVoucher: row.jenis_voucher,
        linkId: row.link_id,
        linkName: row.link_name,
        linkUsername: row.link_username,
        cabangId: row.cabang_id,
        cabangName: row.cabang_name,
        mitraCabangId: row.mitra_cabang_id,
        mitraCabangName: row.mitra_cabang_name,
        stokTersisa: row.stok_tersisa,
      });
    }

    // Get sales data
    const penjualanVoucher: PenjualanVoucherItem[] = [];
    const salesQuery = `
      SELECT 
        vs.created_at as tanggal,
        vs.voucher_type as jenis_voucher,
        vs.link_id,
        l.full_name as link_name,
        l.username as link_username,
        vs.cabang_id,
        c.full_name as cabang_name,
        vs.mitra_cabang_id,
        m.full_name as mitra_cabang_name,
        vs.quantity_sold as jumlah_terjual
      FROM voucher_sales vs
      JOIN users l ON vs.link_id = l.id
      JOIN users c ON vs.cabang_id = c.id
      JOIN users m ON vs.mitra_cabang_id = m.id
      WHERE 1=1 ${dateCondition} ${hierarchyCondition}
      ORDER BY vs.created_at DESC
    `;

    const salesRows = authDB.rawQuery<{
      tanggal: Date;
      jenis_voucher: string;
      link_id: number;
      link_name: string;
      link_username: string;
      cabang_id: number;
      cabang_name: string;
      mitra_cabang_id: number;
      mitra_cabang_name: string;
      jumlah_terjual: number;
    }>(salesQuery, ...params);

    for await (const row of salesRows) {
      penjualanVoucher.push({
        tanggal: row.tanggal,
        jenisVoucher: row.jenis_voucher,
        linkId: row.link_id,
        linkName: row.link_name,
        linkUsername: row.link_username,
        cabangId: row.cabang_id,
        cabangName: row.cabang_name,
        mitraCabangId: row.mitra_cabang_id,
        mitraCabangName: row.mitra_cabang_name,
        jumlahTerjual: row.jumlah_terjual,
      });
    }

    // Get revenue data with pricing information
    const pendapatanVoucher: PendapatanVoucherItem[] = [];
    const revenueQuery = `
      SELECT 
        vs.created_at as tanggal,
        vs.voucher_type as jenis_voucher,
        vs.link_id,
        l.full_name as link_name,
        l.username as link_username,
        vs.cabang_id,
        c.full_name as cabang_name,
        vs.mitra_cabang_id,
        m.full_name as mitra_cabang_name,
        vs.quantity_sold as jumlah_terjual,
        COALESCE(vp.harga_pokok, 0) as harga_pokok,
        COALESCE(vp.harga_jual, 0) as harga_jual,
        COALESCE(vp.share_harga_cabang, 0) as share_harga_cabang,
        COALESCE(vp.fee_link_pct, 0) as fee_link_pct,
        COALESCE(vp.fee_cabang_pct, 0) as fee_cabang_pct,
        COALESCE(vp.komisi_mitra_pct, 0) as komisi_mitra_pct
      FROM voucher_sales vs
      JOIN users l ON vs.link_id = l.id
      JOIN users c ON vs.cabang_id = c.id
      JOIN users m ON vs.mitra_cabang_id = m.id
      LEFT JOIN voucher_prices vp ON vs.cabang_id = vp.cabang_id AND vs.voucher_type = vp.voucher_type
      WHERE 1=1 ${dateCondition} ${hierarchyCondition}
      ORDER BY vs.created_at DESC
    `;

    const revenueRows = authDB.rawQuery<{
      tanggal: Date;
      jenis_voucher: string;
      link_id: number;
      link_name: string;
      link_username: string;
      cabang_id: number;
      cabang_name: string;
      mitra_cabang_id: number;
      mitra_cabang_name: string;
      jumlah_terjual: number;
      harga_pokok: number;
      harga_jual: number;
      share_harga_cabang: number;
      fee_link_pct: number;
      fee_cabang_pct: number;
      komisi_mitra_pct: number;
    }>(revenueQuery, ...params);

    for await (const row of revenueRows) {
      // Calculate fees and commissions
      const hargaPokok = row.harga_pokok;
      const hargaJual = row.harga_jual;
      const shareHargaCabang = row.share_harga_cabang;
      const jumlahTerjual = row.jumlah_terjual;

      // Calculate per unit fees
      const feeLink = (hargaPokok * row.fee_link_pct / 100);
      const feeCabang = (hargaPokok * row.fee_cabang_pct / 100);
      const komisiMitra = (hargaPokok * row.komisi_mitra_pct / 100);

      // Calculate net revenue for owner per unit
      const pendapatanBersihPerUnit = hargaPokok - feeLink - feeCabang - komisiMitra;
      const pendapatanBersih = pendapatanBersihPerUnit * jumlahTerjual;

      pendapatanVoucher.push({
        tanggal: row.tanggal,
        jenisVoucher: row.jenis_voucher,
        linkId: row.link_id,
        linkName: row.link_name,
        linkUsername: row.link_username,
        cabangId: row.cabang_id,
        cabangName: row.cabang_name,
        mitraCabangId: row.mitra_cabang_id,
        mitraCabangName: row.mitra_cabang_name,
        hargaPokok: hargaPokok,
        hargaJual: hargaJual,
        shareHargaCabang: shareHargaCabang,
        feeLink: feeLink * jumlahTerjual,
        feeCabang: feeCabang * jumlahTerjual,
        komisiMitra: komisiMitra * jumlahTerjual,
        pendapatanBersih: pendapatanBersih,
        jumlahTerjual: jumlahTerjual,
      });
    }

    return {
      stokVoucher,
      penjualanVoucher,
      pendapatanVoucher,
    };
  }
);
