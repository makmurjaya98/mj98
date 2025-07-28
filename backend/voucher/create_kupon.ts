import { api, APIError } from "encore.dev/api";
import { authDB } from "../auth/db";

export interface CreateKuponRequest {
  nama: string;
  deskripsi?: string;
  targetRole: "Mitra Cabang" | "Cabang" | "Link";
  minimalPenjualan: number;
  periodeMulai: string;
  periodeBerakhir: string;
  jumlahPemenang: number;
  hadiah: Array<{ posisi: number; hadiah: string }>;
}

export interface CreateKuponResponse {
  success: boolean;
  message: string;
  kuponId: number;
}

// Creates a new gift coupon with performance-based rewards.
export const createKupon = api<CreateKuponRequest, CreateKuponResponse>(
  { expose: true, method: "POST", path: "/voucher/create-kupon" },
  async (req) => {
    // Validate required fields
    if (!req.nama.trim()) {
      throw APIError.invalidArgument("Nama kupon is required");
    }
    if (!req.targetRole) {
      throw APIError.invalidArgument("Target role is required");
    }
    if (req.minimalPenjualan <= 0) {
      throw APIError.invalidArgument("Minimal penjualan must be greater than 0");
    }
    if (!req.periodeMulai || !req.periodeBerakhir) {
      throw APIError.invalidArgument("Periode mulai and berakhir are required");
    }
    if (req.jumlahPemenang <= 0) {
      throw APIError.invalidArgument("Jumlah pemenang must be greater than 0");
    }
    if (!req.hadiah || req.hadiah.length === 0) {
      throw APIError.invalidArgument("Hadiah list is required");
    }

    // Validate target role
    const validRoles = ["Mitra Cabang", "Cabang", "Link"];
    if (!validRoles.includes(req.targetRole)) {
      throw APIError.invalidArgument("Invalid target role");
    }

    // Validate dates
    const startDate = new Date(req.periodeMulai);
    const endDate = new Date(req.periodeBerakhir);
    const today = new Date();
    
    if (startDate >= endDate) {
      throw APIError.invalidArgument("Periode berakhir must be after periode mulai");
    }
    if (endDate < today) {
      throw APIError.invalidArgument("Periode berakhir cannot be in the past");
    }

    // Validate hadiah array
    if (req.hadiah.length !== req.jumlahPemenang) {
      throw APIError.invalidArgument("Number of hadiah must match jumlah pemenang");
    }

    // Validate hadiah positions
    const positions = req.hadiah.map(h => h.posisi).sort((a, b) => a - b);
    for (let i = 0; i < positions.length; i++) {
      if (positions[i] !== i + 1) {
        throw APIError.invalidArgument("Hadiah positions must be consecutive starting from 1");
      }
    }

    try {
      // Insert kupon hadiah
      const kuponResult = await authDB.queryRow<{ id: number }>`
        INSERT INTO kupon_hadiah (
          nama, deskripsi, target_role, minimal_penjualan, 
          periode_mulai, periode_berakhir, jumlah_pemenang, hadiah
        )
        VALUES (
          ${req.nama}, ${req.deskripsi || null}, ${req.targetRole}, ${req.minimalPenjualan},
          ${req.periodeMulai}, ${req.periodeBerakhir}, ${req.jumlahPemenang}, ${JSON.stringify(req.hadiah)}
        )
        RETURNING id
      `;

      if (!kuponResult) {
        throw APIError.internal("Failed to create kupon hadiah");
      }

      return {
        success: true,
        message: `Successfully created kupon hadiah "${req.nama}" for ${req.targetRole} with ${req.jumlahPemenang} winners`,
        kuponId: kuponResult.id,
      };
    } catch (error) {
      throw error;
    }
  }
);
