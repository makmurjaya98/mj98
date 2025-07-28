import { api } from "encore.dev/api";
import { calculatePendapatan } from "./calculate_pendapatan";

export interface TestCalculatePendapatanResponse {
  testCase: {
    hargaPokok: number;
    hargaJual: number;
    shareHarga: number;
    feeLinkPercent: number;
    feeCabangPercent: number;
    komisiMitraPercent: number;
    jumlahTerjual: number;
  };
  expectedResult: {
    pendapatanLink: number;
    pendapatanCabang: number;
    pendapatanMitra: number;
    pendapatanOwner: number;
  };
  actualResult: {
    pendapatanLink: number;
    pendapatanCabang: number;
    pendapatanMitra: number;
    pendapatanOwner: number;
  };
  testPassed: boolean;
  calculations: {
    feeLink: number;
    feeCabang: number;
    komisiMitra: number;
    pendapatanLinkBreakdown: string;
    pendapatanCabangBreakdown: string;
    pendapatanMitraBreakdown: string;
    pendapatanOwnerBreakdown: string;
  };
}

// Test endpoint for calculate pendapatan function with the specified test case
export const testCalculatePendapatan = api<void, TestCalculatePendapatanResponse>(
  { expose: true, method: "GET", path: "/voucher/test-calculate-pendapatan" },
  async () => {
    // Test case as specified in requirements
    const testCase = {
      hargaPokok: 10000,
      hargaJual: 20000,
      shareHarga: 4000,
      feeLinkPercent: 5,
      feeCabangPercent: 10,
      komisiMitraPercent: 5,
      jumlahTerjual: 1, // Testing with 1 unit for clarity
    };

    // Expected results as specified in requirements
    const expectedResult = {
      pendapatanLink: 6500,
      pendapatanCabang: 5000,
      pendapatanMitra: 500,
      pendapatanOwner: 8000,
    };

    // Calculate actual result
    const actualResult = calculatePendapatan({
      jumlahTerjual: testCase.jumlahTerjual,
      hargaPokok: testCase.hargaPokok,
      hargaJual: testCase.hargaJual,
      shareHarga: testCase.shareHarga,
      feeLinkPercent: testCase.feeLinkPercent,
      feeCabangPercent: testCase.feeCabangPercent,
      komisiMitraPercent: testCase.komisiMitraPercent,
    });

    // Check if test passed
    const testPassed = 
      actualResult.pendapatanLink === expectedResult.pendapatanLink &&
      actualResult.pendapatanCabang === expectedResult.pendapatanCabang &&
      actualResult.pendapatanMitra === expectedResult.pendapatanMitra &&
      actualResult.pendapatanOwner === expectedResult.pendapatanOwner;

    // Calculate breakdown for debugging
    const feeLink = (testCase.feeLinkPercent / 100) * testCase.hargaPokok;
    const feeCabang = (testCase.feeCabangPercent / 100) * testCase.hargaPokok;
    const komisiMitra = (testCase.komisiMitraPercent / 100) * testCase.hargaPokok;

    return {
      testCase,
      expectedResult,
      actualResult: {
        pendapatanLink: actualResult.pendapatanLink,
        pendapatanCabang: actualResult.pendapatanCabang,
        pendapatanMitra: actualResult.pendapatanMitra,
        pendapatanOwner: actualResult.pendapatanOwner,
      },
      testPassed,
      calculations: {
        feeLink,
        feeCabang,
        komisiMitra,
        pendapatanLinkBreakdown: `(${testCase.hargaJual} - ${testCase.hargaPokok} - ${testCase.shareHarga}) + ${feeLink} = ${actualResult.pendapatanLink}`,
        pendapatanCabangBreakdown: `${testCase.shareHarga} + ${feeCabang} = ${actualResult.pendapatanCabang}`,
        pendapatanMitraBreakdown: `${komisiMitra} = ${actualResult.pendapatanMitra}`,
        pendapatanOwnerBreakdown: `${testCase.hargaPokok} - (${feeLink} + ${feeCabang} + ${komisiMitra}) = ${actualResult.pendapatanOwner}`,
      },
    };
  }
);
