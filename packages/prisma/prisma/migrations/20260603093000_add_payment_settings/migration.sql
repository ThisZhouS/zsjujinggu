CREATE TABLE "payment_settings" (
    "id" BIGSERIAL NOT NULL,
    "paymentType" "PaymentType" NOT NULL,
    "qrCodeUrl" VARCHAR(500),
    "accountName" VARCHAR(100),
    "instructions" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_settings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "payment_settings_paymentType_key" ON "payment_settings"("paymentType");
CREATE INDEX "payment_settings_isActive_idx" ON "payment_settings"("isActive");
