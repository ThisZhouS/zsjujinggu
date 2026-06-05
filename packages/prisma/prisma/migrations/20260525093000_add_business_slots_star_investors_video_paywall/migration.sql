-- Add enums safely for environments that have not been updated by db push.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'BusinessDataSlot') THEN
    CREATE TYPE "BusinessDataSlot" AS ENUM ('PRIMARY', 'SECONDARY');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ArticleTopicType') THEN
    CREATE TYPE "ArticleTopicType" AS ENUM ('GENERAL', 'INVESTOR', 'EXECUTIVE');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AutomationProvider') THEN
    CREATE TYPE "AutomationProvider" AS ENUM ('OPENCLAW', 'HARNESS');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AdMediaType') THEN
    CREATE TYPE "AdMediaType" AS ENUM ('IMAGE', 'VIDEO');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'VideoAccessLevel') THEN
    CREATE TYPE "VideoAccessLevel" AS ENUM ('PUBLIC', 'USER', 'VIDEO', 'VIP');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'StarInvestorType') THEN
    CREATE TYPE "StarInvestorType" AS ENUM ('BUFFETT', 'CATHERINE_WOOD');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'StarHoldingChangeType') THEN
    CREATE TYPE "StarHoldingChangeType" AS ENUM ('INCREASE', 'DECREASE', 'KEEP', 'UNKNOWN');
  END IF;
END $$;

ALTER TYPE "AdPosition" ADD VALUE IF NOT EXISTS 'HOME_VIDEO_HERO';

-- User and permission fields.
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "canUploadArticles" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "canAccessVideos" BOOLEAN NOT NULL DEFAULT false;

-- Investor/holding business data slots.
ALTER TABLE "investors" ADD COLUMN IF NOT EXISTS "category" VARCHAR(20) NOT NULL DEFAULT 'personal';
ALTER TABLE "holdings" ADD COLUMN IF NOT EXISTS "dataSlot" "BusinessDataSlot" NOT NULL DEFAULT 'PRIMARY';
ALTER TABLE "executive_trades" ADD COLUMN IF NOT EXISTS "dataSlot" "BusinessDataSlot" NOT NULL DEFAULT 'PRIMARY';
ALTER TABLE "dividends" ADD COLUMN IF NOT EXISTS "dataSlot" "BusinessDataSlot" NOT NULL DEFAULT 'PRIMARY';

DROP INDEX IF EXISTS "holdings_investorId_stockCode_reportDate_key";
DROP INDEX IF EXISTS "dividends_stockCode_dividendYear_key";

CREATE INDEX IF NOT EXISTS "idx_investors_category_tracked" ON "investors"("category", "isTracked");
CREATE INDEX IF NOT EXISTS "holdings_investorId_dataSlot_idx" ON "holdings"("investorId", "dataSlot");
CREATE INDEX IF NOT EXISTS "holdings_stockCode_dataSlot_idx" ON "holdings"("stockCode", "dataSlot");
CREATE INDEX IF NOT EXISTS "holdings_reportDate_dataSlot_idx" ON "holdings"("reportDate", "dataSlot");
CREATE INDEX IF NOT EXISTS "idx_holdings_slot_investor_stock_report" ON "holdings"("dataSlot", "investorId", "stockCode", "reportDate");
CREATE INDEX IF NOT EXISTS "idx_holdings_slot_report_investor_stock" ON "holdings"("dataSlot", "reportDate", "investorId", "stockCode");
CREATE UNIQUE INDEX IF NOT EXISTS "holdings_investorId_stockCode_reportDate_dataSlot_key" ON "holdings"("investorId", "stockCode", "reportDate", "dataSlot");
CREATE INDEX IF NOT EXISTS "executive_trades_stockCode_dataSlot_idx" ON "executive_trades"("stockCode", "dataSlot");
CREATE INDEX IF NOT EXISTS "executive_trades_executiveName_dataSlot_idx" ON "executive_trades"("executiveName", "dataSlot");
CREATE INDEX IF NOT EXISTS "executive_trades_reportDate_dataSlot_idx" ON "executive_trades"("reportDate", "dataSlot");
CREATE INDEX IF NOT EXISTS "dividends_dividendYear_dataSlot_idx" ON "dividends"("dividendYear", "dataSlot");
CREATE UNIQUE INDEX IF NOT EXISTS "dividends_stockCode_dividendYear_dataSlot_key" ON "dividends"("stockCode", "dividendYear", "dataSlot");

CREATE TABLE IF NOT EXISTS "business_data_source_state" (
  "id" INTEGER NOT NULL,
  "activeSlot" "BusinessDataSlot" NOT NULL DEFAULT 'PRIMARY',
  "latestFullSyncDate" VARCHAR(20),
  "latestDailySyncDate" VARCHAR(20),
  "lastPreparedSlot" "BusinessDataSlot",
  "lastSwitchAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "business_data_source_state_pkey" PRIMARY KEY ("id")
);

-- Article news fields and automation ingest idempotency.
ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "createdByUserId" BIGINT;
ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "topicType" "ArticleTopicType" NOT NULL DEFAULT 'GENERAL';
ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "relatedInvestorId" BIGINT;
ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "relatedStockCode" VARCHAR(10);
ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "relatedExecutiveName" VARCHAR(100);
ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "automationProvider" "AutomationProvider";
ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "automationExternalId" VARCHAR(191);
ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "sourceUrl" VARCHAR(500);
ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "sourceMetadata" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'articles_createdByUserId_fkey') THEN
    ALTER TABLE "articles"
      ADD CONSTRAINT "articles_createdByUserId_fkey"
      FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "articles_createdByUserId_idx" ON "articles"("createdByUserId");
CREATE INDEX IF NOT EXISTS "idx_articles_topic_investor_date" ON "articles"("topicType", "relatedInvestorId", "publishDate");
CREATE INDEX IF NOT EXISTS "idx_articles_topic_stock_date" ON "articles"("topicType", "relatedStockCode", "publishDate");
CREATE INDEX IF NOT EXISTS "idx_articles_topic_exec_name_date" ON "articles"("topicType", "relatedExecutiveName", "publishDate");
CREATE UNIQUE INDEX IF NOT EXISTS "uq_articles_automation_provider_external" ON "articles"("automationProvider", "automationExternalId");

-- Ads and videos.
ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "mediaType" "AdMediaType" NOT NULL DEFAULT 'IMAGE';
ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "videoUrl" VARCHAR(500);

CREATE TABLE IF NOT EXISTS "videos" (
  "id" BIGSERIAL NOT NULL,
  "title" VARCHAR(200) NOT NULL,
  "summary" VARCHAR(1000),
  "description" TEXT,
  "coverUrl" VARCHAR(500),
  "videoUrl" VARCHAR(500) NOT NULL,
  "durationSec" INTEGER,
  "accessLevel" "VideoAccessLevel" NOT NULL DEFAULT 'PUBLIC',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "isFeatured" BOOLEAN NOT NULL DEFAULT false,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "videos_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "idx_videos_active_sort" ON "videos"("isActive", "sortOrder");
CREATE INDEX IF NOT EXISTS "idx_videos_access_active" ON "videos"("accessLevel", "isActive");
CREATE INDEX IF NOT EXISTS "idx_videos_featured_active" ON "videos"("isFeatured", "isActive");

-- TradingKey star investor snapshots, holdings, and trades.
CREATE TABLE IF NOT EXISTS "star_investor_snapshots" (
  "id" BIGSERIAL NOT NULL,
  "investorType" "StarInvestorType" NOT NULL,
  "investorName" VARCHAR(100) NOT NULL,
  "organizationName" VARCHAR(200),
  "description" TEXT,
  "logoUrl" VARCHAR(500),
  "period" VARCHAR(20) NOT NULL,
  "reportDate" DATE,
  "holdingStockCount" INTEGER,
  "holdingValue" DECIMAL(24,2),
  "tradeProportion" DECIMAL(14,8),
  "topTenPercent" DECIMAL(14,8),
  "topIncreaseCode" VARCHAR(30),
  "topIncreaseName" VARCHAR(100),
  "topDecreaseCode" VARCHAR(30),
  "topDecreaseName" VARCHAR(100),
  "sourceUrl" VARCHAR(500) NOT NULL,
  "scrapedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "rawPayload" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "star_investor_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "star_investor_holdings" (
  "id" BIGSERIAL NOT NULL,
  "investorType" "StarInvestorType" NOT NULL,
  "investorName" VARCHAR(100) NOT NULL,
  "period" VARCHAR(20) NOT NULL,
  "sourceReportDate" DATE,
  "stockCode" VARCHAR(30) NOT NULL,
  "stockName" VARCHAR(200) NOT NULL,
  "instrumentCode" VARCHAR(50) NOT NULL DEFAULT '',
  "iconUrl" VARCHAR(500),
  "route" VARCHAR(200),
  "typeRoute" VARCHAR(50),
  "industry" VARCHAR(100),
  "holdingType" "StarHoldingChangeType" NOT NULL DEFAULT 'UNKNOWN',
  "tradePrice" DECIMAL(18,4),
  "tradeQuantity" BIGINT,
  "previousHoldingQuantity" BIGINT,
  "holdingQuantity" BIGINT,
  "reportDate" DATE,
  "reportMarketValue" DECIMAL(24,2),
  "changeRate" DECIMAL(14,8),
  "proportion" DECIMAL(14,8),
  "latestPrice" DECIMAL(18,4),
  "latestMarketValue" DECIMAL(24,2),
  "sourceUrl" VARCHAR(500) NOT NULL,
  "scrapedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "star_investor_holdings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "star_investor_trades" (
  "id" BIGSERIAL NOT NULL,
  "investorType" "StarInvestorType" NOT NULL,
  "investorName" VARCHAR(100) NOT NULL,
  "period" VARCHAR(20) NOT NULL,
  "sourceKey" VARCHAR(191) NOT NULL,
  "sourceReportDate" DATE,
  "stockCode" VARCHAR(30) NOT NULL,
  "stockName" VARCHAR(200) NOT NULL,
  "instrumentCode" VARCHAR(50) NOT NULL DEFAULT '',
  "iconUrl" VARCHAR(500),
  "route" VARCHAR(200),
  "typeRoute" VARCHAR(50),
  "industry" VARCHAR(100),
  "holdingType" "StarHoldingChangeType" NOT NULL DEFAULT 'UNKNOWN',
  "tradePrice" DECIMAL(18,4),
  "tradeQuantity" BIGINT,
  "holdingQuantity" BIGINT,
  "reportDate" DATE,
  "reportMarketValue" DECIMAL(24,2),
  "changeRate" DECIMAL(14,8),
  "proportion" DECIMAL(14,8),
  "latestPrice" DECIMAL(18,4),
  "sourceUrl" VARCHAR(500) NOT NULL,
  "scrapedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "star_investor_trades_pkey" PRIMARY KEY ("id")
);

UPDATE "star_investor_holdings" SET "instrumentCode" = '' WHERE "instrumentCode" IS NULL;
UPDATE "star_investor_trades" SET "instrumentCode" = '' WHERE "instrumentCode" IS NULL;
ALTER TABLE "star_investor_holdings" ALTER COLUMN "instrumentCode" SET DEFAULT '';
ALTER TABLE "star_investor_holdings" ALTER COLUMN "instrumentCode" SET NOT NULL;
ALTER TABLE "star_investor_trades" ALTER COLUMN "instrumentCode" SET DEFAULT '';
ALTER TABLE "star_investor_trades" ALTER COLUMN "instrumentCode" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "star_investor_snapshots_investorType_period_key" ON "star_investor_snapshots"("investorType", "period");
CREATE INDEX IF NOT EXISTS "star_investor_snapshots_investorType_scrapedAt_idx" ON "star_investor_snapshots"("investorType", "scrapedAt");
CREATE UNIQUE INDEX IF NOT EXISTS "star_investor_holdings_investorType_period_stockCode_instrumentCode_key" ON "star_investor_holdings"("investorType", "period", "stockCode", "instrumentCode");
CREATE INDEX IF NOT EXISTS "star_investor_holdings_investorType_period_idx" ON "star_investor_holdings"("investorType", "period");
CREATE INDEX IF NOT EXISTS "star_investor_holdings_investorType_holdingType_idx" ON "star_investor_holdings"("investorType", "holdingType");
CREATE INDEX IF NOT EXISTS "star_investor_holdings_stockCode_idx" ON "star_investor_holdings"("stockCode");
CREATE UNIQUE INDEX IF NOT EXISTS "star_investor_trades_sourceKey_key" ON "star_investor_trades"("sourceKey");
CREATE INDEX IF NOT EXISTS "star_investor_trades_investorType_period_idx" ON "star_investor_trades"("investorType", "period");
CREATE INDEX IF NOT EXISTS "star_investor_trades_investorType_period_stockCode_idx" ON "star_investor_trades"("investorType", "period", "stockCode");
CREATE INDEX IF NOT EXISTS "star_investor_trades_reportDate_idx" ON "star_investor_trades"("reportDate");
