import { api, APIError } from "encore.dev/api";
import { authDB } from "../auth/db";

export interface AddDepositRequest {
  kategori: "Link" | "Cabang" | "Mitra Cabang";
  userId: number;
  jumlah: number;
  keterangan?: string;
}

export interface AddDepositResponse {
  success: boolean;
  message: string;
  depositId: number;
}

interface UserInfo {
  id: number;
  role: string;
  full_name: string;
}

// Records a deposit and resets the corresponding revenue amounts.
export const addDeposit = api<AddDepositRequest, AddDepositResponse>(
  { expose: true, method: "POST", path: "/voucher/add-deposit" },
  async (req) => {
    // Validate required fields
    if (!req.kategori) {
      throw APIError.invalidArgument("Kategori is required");
    }
    if (!req.userId) {
      throw APIError.invalidArgument("User selection is required");
    }
    if (req.jumlah <= 0) {
      throw APIError.invalidArgument("Jumlah must be greater than 0");
    }

    // Validate kategori
    const validKategori = ["Link", "Cabang", "Mitra Cabang"];
    if (!validKategori.includes(req.kategori)) {
      throw APIError.invalidArgument("Invalid kategori");
    }

    // Verify user exists and has correct role
    const user = await authDB.queryRow<UserInfo>`
      SELECT id, role, full_name FROM users WHERE id = ${req.userId}
    `;
    if (!user) {
      throw APIError.notFound("User not found");
    }
    if (user.role !== req.kategori) {
      throw APIError.invalidArgument(`Selected user is not a ${req.kategori}`);
    }

    // Start transaction to ensure data consistency
    await authDB.exec`BEGIN`;

    try {
      let linkId = null;
      let cabangId = null;
      let mitraId = null;

      // Set the appropriate ID based on kategori
      if (req.kategori === "Link") {
        linkId = req.userId;
      } else if (req.kategori === "Cabang") {
        cabangId = req.userId;
      } else if (req.kategori === "Mitra Cabang") {
        mitraId = req.userId;
      }

      // Insert deposit record
      const depositResult = await authDB.queryRow<{ id: number }>`
        INSERT INTO deposit (link_id, cabang_id, mitra_id, jumlah, kategori, keterangan)
        VALUES (${linkId}, ${cabangId}, ${mitraId}, ${req.jumlah}, ${req.kategori}, ${req.keterangan || null})
        RETURNING id
      `;

      if (!depositResult) {
        throw APIError.internal("Failed to create deposit record");
      }

      // Reset pendapatan based on kategori
      if (req.kategori === "Link") {
        // Reset Link pendapatan and fees
        await authDB.exec`
          UPDATE voucher_sales 
          SET total_pendapatan_link = 0, fee_link = 0
          WHERE link_id = ${req.userId}
        `;
      } else if (req.kategori === "Cabang") {
        // Reset Cabang pendapatan and fees
        await authDB.exec`
          UPDATE voucher_sales 
          SET total_pendapatan_cabang = 0, fee_cabang = 0
          WHERE cabang_id = ${req.userId}
        `;
      } else if (req.kategori === "Mitra Cabang") {
        // Reset Mitra komisi
        await authDB.exec`
          UPDATE voucher_sales 
          SET komisi_mitra = 0
          WHERE mitra_cabang_id = ${req.userId}
        `;
      }

      // Commit transaction
      await authDB.exec`COMMIT`;

      return {
        success: true,
        message: `Successfully recorded deposit of ${new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
          minimumFractionDigits: 0,
        }).format(req.jumlah)} from ${user.full_name} (${req.kategori}). Revenue amounts have been reset.`,
        depositId: depositResult.id,
      };
    } catch (error) {
      // Rollback transaction on error
      await authDB.exec`ROLLBACK`;
      throw error;
    }
  }
);
