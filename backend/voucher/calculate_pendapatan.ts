import { api } from "encore.dev/api";

export interface CalculatePendapatanRequest {
  jumlahTerjual: number;
  hargaPokok: number;
  hargaJual: number;
  shareHarga: number;
  feeLinkPercent: number;
  feeCabangPercent: number;
  komisiMitraPercent: number;
}

export interface PendapatanResult {
  pendapatanLink: number;
  pendapatanCabang: number;
  pendapatanMitra: number;
  pendapatanOwner: number;
  feeLink: number;
  feeCabang: number;
  komisiMitra: number;
  totalPendapatanLink: number;
  totalPendapatanCabang: number;
}

export interface CalculatePendapatanResponse {
  result: PendapatanResult;
  breakdown: {
    hargaPokok: number;
    hargaJual: number;
    shareHarga: number;
    jumlahTerjual: number;
    feeLinkPercent: number;
    feeCabangPercent: number;
    komisiMitraPercent: number;
  };
}

/**
 * Calculates financial distribution for voucher sales
 * 
 * Formula:
 * - Fee Link = fee_link_percent × HP
 * - Fee Cabang = fee_cabang_percent × HP  
 * - Komisi Mitra = komisi_mitra_percent × HP
 * - Pendapatan Link = (HJ - HP - SH) + Fee Link
 * - Pendapatan Cabang = SH + Fee Cabang
 * - Pendapatan Mitra = Komisi Mitra
 * - Pendapatan Owner = HP - (Fee Link + Fee Cabang + Komisi Mitra)
 */
export function calculatePendapatan(params: CalculatePendapatanRequest): PendapatanResult {
  const {
    jumlahTerjual,
    hargaPokok,
    hargaJual,
    shareHarga,
    feeLinkPercent,
    feeCabangPercent,
    komisiMitraPercent
  } = params;

  // Calculate per-unit fees
  const feeLink = (feeLinkPercent / 100) * hargaPokok;
  const feeCabang = (feeCabangPercent / 100) * hargaPokok;
  const komisiMitra = (komisiMitraPercent / 100) * hargaPokok;

  // Calculate per-unit pendapatan
  const pendapatanLinkPerUnit = (hargaJual - hargaPokok - shareHarga) + feeLink;
  const pendapatanCabangPerUnit = shareHarga + feeCabang;
  const pendapatanMitraPerUnit = komisiMitra;
  const pendapatanOwnerPerUnit = hargaPokok - (feeLink + feeCabang + komisiMitra);

  // Calculate total pendapatan (per-unit × quantity)
  const totalPendapatanLink = pendapatanLinkPerUnit * jumlahTerjual;
  const totalPendapatanCabang = pendapatanCabangPerUnit * jumlahTerjual;
  const totalPendapatanMitra = pendapatanMitraPerUnit * jumlahTerjual;
  const totalPendapatanOwner = pendapatanOwnerPerUnit * jumlahTerjual;

  // Calculate total fees (for database storage)
  const totalFeeLink = feeLink * jumlahTerjual;
  const totalFeeCabang = feeCabang * jumlahTerjual;
  const totalKomisiMitra = komisiMitra * jumlahTerjual;

  return {
    pendapatanLink: Math.round(totalPendapatanLink),
    pendapatanCabang: Math.round(totalPendapatanCabang),
    pendapatanMitra: Math.round(totalPendapatanMitra),
    pendapatanOwner: Math.round(totalPendapatanOwner),
    feeLink: Math.round(totalFeeLink),
    feeCabang: Math.round(totalFeeCabang),
    komisiMitra: Math.round(totalKomisiMitra),
    totalPendapatanLink: Math.round(totalPendapatanLink),
    totalPendapatanCabang: Math.round(totalPendapatanCabang),
  };
}

// API endpoint for calculating pendapatan preview without saving
export const calculatePendapatanPreview = api<CalculatePendapatanRequest, CalculatePendapatanResponse>(
  { expose: true, method: "POST", path: "/voucher/calculate-pendapatan" },
  async (req) => {
    // Validate input parameters
    if (req.jumlahTerjual <= 0) {
      throw new Error("Jumlah terjual must be greater than 0");
    }
    if (req.hargaPokok <= 0) {
      throw new Error("Harga pokok must be greater than 0");
    }
    if (req.hargaJual <= 0) {
      throw new Error("Harga jual must be greater than 0");
    }
    if (req.shareHarga < 0) {
      throw new Error("Share harga cannot be negative");
    }
    if (req.feeLinkPercent < 0 || req.feeLinkPercent > 100) {
      throw new Error("Fee link percent must be between 0 and 100");
    }
    if (req.feeCabangPercent < 0 || req.feeCabangPercent > 100) {
      throw new Error("Fee cabang percent must be between 0 and 100");
    }
    if (req.komisiMitraPercent < 0 || req.komisiMitraPercent > 100) {
      throw new Error("Komisi mitra percent must be between 0 and 100");
    }

    // Validate business logic
    if (req.hargaJual <= req.hargaPokok) {
      throw new Error("Harga jual must be greater than harga pokok");
    }
    if (req.shareHarga > req.hargaJual) {
      throw new Error("Share harga cannot be greater than harga jual");
    }

    const totalPercentage = req.feeLinkPercent + req.feeCabangPercent + req.komisiMitraPercent;
    if (totalPercentage > 100) {
      throw new Error("Total of all percentages cannot exceed 100%");
    }

    const result = calculatePendapatan(req);

    return {
      result,
      breakdown: {
        hargaPokok: req.hargaPokok,
        hargaJual: req.hargaJual,
        shareHarga: req.shareHarga,
        jumlahTerjual: req.jumlahTerjual,
        feeLinkPercent: req.feeLinkPercent,
        feeCabangPercent: req.feeCabangPercent,
        komisiMitraPercent: req.komisiMitraPercent,
      },
    };
  }
);
