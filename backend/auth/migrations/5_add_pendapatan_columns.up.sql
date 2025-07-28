-- Add pendapatan columns to voucher_sales table
ALTER TABLE voucher_sales ADD COLUMN fee_link DECIMAL(15,2) DEFAULT 0;
ALTER TABLE voucher_sales ADD COLUMN fee_cabang DECIMAL(15,2) DEFAULT 0;
ALTER TABLE voucher_sales ADD COLUMN komisi_mitra DECIMAL(15,2) DEFAULT 0;
ALTER TABLE voucher_sales ADD COLUMN pendapatan_owner DECIMAL(15,2) DEFAULT 0;
ALTER TABLE voucher_sales ADD COLUMN total_pendapatan_link DECIMAL(15,2) DEFAULT 0;
ALTER TABLE voucher_sales ADD COLUMN total_pendapatan_cabang DECIMAL(15,2) DEFAULT 0;

-- Add indexes for better performance
CREATE INDEX idx_voucher_sales_fee_link ON voucher_sales(fee_link);
CREATE INDEX idx_voucher_sales_fee_cabang ON voucher_sales(fee_cabang);
CREATE INDEX idx_voucher_sales_komisi_mitra ON voucher_sales(komisi_mitra);
CREATE INDEX idx_voucher_sales_pendapatan_owner ON voucher_sales(pendapatan_owner);
