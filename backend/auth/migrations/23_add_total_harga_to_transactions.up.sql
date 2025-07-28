-- Add total_harga column to customer_transactions to store the total value of each transaction
ALTER TABLE customer_transactions ADD COLUMN total_harga DECIMAL(15, 2) NOT NULL DEFAULT 0;

-- Add an index for better query performance on the new column
CREATE INDEX idx_customer_transactions_total_harga ON customer_transactions(total_harga);
