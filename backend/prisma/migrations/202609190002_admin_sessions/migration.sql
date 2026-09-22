CREATE TABLE "AdminSession" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tokenHash" CHAR(64) NOT NULL,
  "adminId" UUID NOT NULL,
  "expiresAt" TIMESTAMPTZ(3) NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdminSession_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AdminSession_tokenHash_check" CHECK ("tokenHash" ~ '^[0-9a-f]{64}$'),
  CONSTRAINT "AdminSession_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE RESTRICT
);
CREATE UNIQUE INDEX "AdminSession_tokenHash_key" ON "AdminSession"("tokenHash");
CREATE INDEX "AdminSession_adminId_idx" ON "AdminSession"("adminId");
CREATE INDEX "AdminSession_expiresAt_idx" ON "AdminSession"("expiresAt");

-- Stage 02 explicitly permits startsAt = endsAt. Preserve all other checks.
ALTER TABLE "Banner" DROP CONSTRAINT "Banner_valid_interval";
ALTER TABLE "Banner" ADD CONSTRAINT "Banner_valid_interval" CHECK ("startsAt" IS NULL OR "endsAt" IS NULL OR "startsAt" <= "endsAt");
