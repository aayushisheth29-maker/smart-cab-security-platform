-- Add missing columns to share_links so backend INSERT works
-- The backend uses these column names, your existing table doesn't have all of them

-- 1. Add booking_id as text (backend sends strings like "4")
ALTER TABLE share_links ADD COLUMN IF NOT EXISTS booking_id TEXT;

-- 2. Add car_model (backend sends selected car type like "SmartMini")
ALTER TABLE share_links ADD COLUMN IF NOT EXISTS car_model TEXT;

-- 3. Add updated_at (backend tracks when link was last updated)
ALTER TABLE share_links ADD COLUMN IF NOT EXISTS updated_at TEXT;

-- 4. Add last_ping_at (backend tracks when GPS last pinged)
ALTER TABLE share_links ADD COLUMN IF NOT EXISTS last_ping_at TEXT;

-- 5. Verify all columns now exist
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'share_links'
ORDER BY ordinal_position;
