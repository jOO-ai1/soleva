-- Add language preference to users table
ALTER TABLE "users" ADD COLUMN "preferredLanguage" TEXT NOT NULL DEFAULT 'en';

-- Add check constraint to ensure only valid languages
ALTER TABLE "users" ADD CONSTRAINT "users_preferredLanguage_check" 
  CHECK ("preferredLanguage" IN ('en', 'ar'));

-- Update existing users to have default language preference
UPDATE "users" SET "preferredLanguage" = 'en' WHERE "preferredLanguage" IS NULL;

-- Create index for faster language-based queries
CREATE INDEX "idx_users_preferredLanguage" ON "users"("preferredLanguage");
