-- Make paymentMethodId nullable in manual_payments table
ALTER TABLE manual_payments 
ALTER COLUMN "paymentMethodId" DROP NOT NULL;

-- Add a comment to explain why it's nullable
COMMENT ON COLUMN manual_payments."paymentMethodId" IS 'Optional reference to payment settings. Can be null for manual payment methods.';
