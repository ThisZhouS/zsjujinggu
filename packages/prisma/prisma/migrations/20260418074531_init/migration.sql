-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "Market" AS ENUM ('A', 'HK', 'US');

-- CreateEnum
CREATE TYPE "ArticleCategory" AS ENUM ('BUFFETT', 'WOOD', 'GENERAL');

-- CreateEnum
CREATE TYPE "TradeType" AS ENUM ('INCREASE', 'DECREASE', 'SAME');

-- CreateEnum
CREATE TYPE "PriceAlertType" AS ENUM ('ABOVE', 'BELOW');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('PRICE_ALERT', 'SYSTEM', 'VIP_EXPIRED', 'ORDER_PAID', 'ORDER_REFUNDED');

-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('RUNNING', 'SUCCESS', 'FAILED');

-- CreateEnum
CREATE TYPE "ApiPlan" AS ENUM ('FREE', 'BASIC', 'PRO', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PAID', 'REFUNDED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('WECHAT', 'ALIPAY');

-- CreateEnum
CREATE TYPE "MemberPlan" AS ENUM ('VIP_MONTHLY', 'VIP_YEARLY', 'LIFETIME');

-- CreateEnum
CREATE TYPE "AdPosition" AS ENUM ('HOME_TOP', 'HOME_SIDEBAR', 'ARTICLE_BOTTOM', 'MOBILE_BANNER');

-- CreateTable
CREATE TABLE "users" (
    "id" BIGSERIAL NOT NULL,
    "phone" TEXT NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "username" TEXT,
    "nickname" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "vipExpiresAt" TIMESTAMP(3),
    "avatar" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investors" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "avatar" TEXT,
    "bio" TEXT,
    "totalMarketValue" DECIMAL(20,2),
    "stockCount" INTEGER,
    "isTracked" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "investors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "holdings" (
    "id" BIGSERIAL NOT NULL,
    "investorId" BIGINT NOT NULL,
    "stockCode" VARCHAR(10) NOT NULL,
    "stockName" VARCHAR(100) NOT NULL,
    "holdCount" BIGINT NOT NULL,
    "holdRatio" DECIMAL(5,2),
    "actualCost" DECIMAL(20,2),
    "reportDate" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "holdings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stocks" (
    "id" BIGSERIAL NOT NULL,
    "code" VARCHAR(10) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "industry" VARCHAR(50),
    "market" "Market" NOT NULL DEFAULT 'A',
    "listingDate" DATE,
    "currentPrice" DECIMAL(10,2),
    "totalMarketCap" DECIMAL(20,2),
    "priceUpdatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kline_daily" (
    "id" BIGSERIAL NOT NULL,
    "stockCode" VARCHAR(10) NOT NULL,
    "tradeDate" DATE NOT NULL,
    "open" DECIMAL(10,2) NOT NULL,
    "high" DECIMAL(10,2) NOT NULL,
    "low" DECIMAL(10,2) NOT NULL,
    "close" DECIMAL(10,2) NOT NULL,
    "volume" BIGINT NOT NULL,
    "amount" DECIMAL(20,2) NOT NULL,
    "changePct" DECIMAL(10,4),
    "turnover" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kline_daily_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "articles" (
    "id" BIGSERIAL NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "content" TEXT NOT NULL,
    "summary" VARCHAR(500),
    "coverImage" VARCHAR(500),
    "author" VARCHAR(50),
    "category" "ArticleCategory",
    "publishDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "executive_trades" (
    "id" BIGSERIAL NOT NULL,
    "stockCode" VARCHAR(10) NOT NULL,
    "stockName" VARCHAR(100) NOT NULL,
    "executiveName" VARCHAR(50) NOT NULL,
    "executivePosition" VARCHAR(50) NOT NULL,
    "tradeType" "TradeType" NOT NULL,
    "tradeCount" BIGINT NOT NULL,
    "tradePrice" DECIMAL(10,2),
    "tradeAmount" DECIMAL(20,2),
    "tradeDate" DATE NOT NULL,
    "reportDate" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "executive_trades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dividends" (
    "id" BIGSERIAL NOT NULL,
    "stockCode" VARCHAR(10) NOT NULL,
    "stockName" VARCHAR(100) NOT NULL,
    "dividendYear" INTEGER NOT NULL,
    "dividendDate" DATE,
    "cashDividend" DECIMAL(10,4),
    "bonusShare" DECIMAL(10,2),
    "transferShare" DECIMAL(10,2),
    "totalDividend" DECIMAL(20,2),
    "dividendYield" DECIMAL(10,4),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dividends_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_favorites" (
    "id" BIGSERIAL NOT NULL,
    "userId" BIGINT NOT NULL,
    "investorId" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_favorites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "watchlists" (
    "id" BIGSERIAL NOT NULL,
    "userId" BIGINT NOT NULL,
    "stockCode" VARCHAR(10) NOT NULL,
    "stockName" VARCHAR(100) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "watchlists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_alerts" (
    "id" BIGSERIAL NOT NULL,
    "userId" BIGINT NOT NULL,
    "stockCode" VARCHAR(10) NOT NULL,
    "stockName" VARCHAR(100) NOT NULL,
    "alertType" "PriceAlertType" NOT NULL,
    "targetPrice" DECIMAL(10,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "triggeredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "price_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" BIGSERIAL NOT NULL,
    "userId" BIGINT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "content" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "relatedId" BIGINT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_logs" (
    "id" BIGSERIAL NOT NULL,
    "taskName" VARCHAR(50) NOT NULL,
    "status" "SyncStatus" NOT NULL,
    "message" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "recordCount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sync_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" BIGSERIAL NOT NULL,
    "userId" BIGINT NOT NULL,
    "keyHash" VARCHAR(255) NOT NULL,
    "plan" "ApiPlan" NOT NULL DEFAULT 'FREE',
    "quota" INTEGER NOT NULL DEFAULT 1000,
    "used" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_usage_logs" (
    "id" BIGSERIAL NOT NULL,
    "apiKeyId" BIGINT NOT NULL,
    "endpoint" VARCHAR(200) NOT NULL,
    "method" VARCHAR(10) NOT NULL,
    "statusCode" INTEGER NOT NULL,
    "responseTime" INTEGER NOT NULL,
    "ip" VARCHAR(50),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_usage_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" BIGSERIAL NOT NULL,
    "orderNo" VARCHAR(50) NOT NULL,
    "userId" BIGINT NOT NULL,
    "plan" "MemberPlan" NOT NULL DEFAULT 'VIP_MONTHLY',
    "amount" DECIMAL(10,2) NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "paymentType" "PaymentType" NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "member_logs" (
    "id" BIGSERIAL NOT NULL,
    "userId" BIGINT NOT NULL,
    "plan" "MemberPlan" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "orderNo" VARCHAR(50) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "member_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ads" (
    "id" BIGSERIAL NOT NULL,
    "position" "AdPosition" NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "content" VARCHAR(500) NOT NULL,
    "imageUrl" VARCHAR(500),
    "linkUrl" VARCHAR(500) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_logs" (
    "id" BIGSERIAL NOT NULL,
    "adId" BIGINT NOT NULL,
    "userId" BIGINT,
    "ip" VARCHAR(50),
    "userAgent" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ad_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "investors_name_key" ON "investors"("name");

-- CreateIndex
CREATE INDEX "holdings_investorId_idx" ON "holdings"("investorId");

-- CreateIndex
CREATE INDEX "holdings_stockCode_idx" ON "holdings"("stockCode");

-- CreateIndex
CREATE INDEX "holdings_reportDate_idx" ON "holdings"("reportDate");

-- CreateIndex
CREATE UNIQUE INDEX "holdings_investorId_stockCode_reportDate_key" ON "holdings"("investorId", "stockCode", "reportDate");

-- CreateIndex
CREATE UNIQUE INDEX "stocks_code_key" ON "stocks"("code");

-- CreateIndex
CREATE INDEX "stocks_code_idx" ON "stocks"("code");

-- CreateIndex
CREATE INDEX "stocks_industry_idx" ON "stocks"("industry");

-- CreateIndex
CREATE INDEX "kline_daily_stockCode_idx" ON "kline_daily"("stockCode");

-- CreateIndex
CREATE INDEX "kline_daily_tradeDate_idx" ON "kline_daily"("tradeDate");

-- CreateIndex
CREATE UNIQUE INDEX "kline_daily_stockCode_tradeDate_key" ON "kline_daily"("stockCode", "tradeDate");

-- CreateIndex
CREATE INDEX "articles_category_idx" ON "articles"("category");

-- CreateIndex
CREATE INDEX "articles_publishDate_idx" ON "articles"("publishDate");

-- CreateIndex
CREATE INDEX "executive_trades_stockCode_idx" ON "executive_trades"("stockCode");

-- CreateIndex
CREATE INDEX "executive_trades_executiveName_idx" ON "executive_trades"("executiveName");

-- CreateIndex
CREATE INDEX "executive_trades_reportDate_idx" ON "executive_trades"("reportDate");

-- CreateIndex
CREATE INDEX "dividends_dividendYear_idx" ON "dividends"("dividendYear");

-- CreateIndex
CREATE UNIQUE INDEX "dividends_stockCode_dividendYear_key" ON "dividends"("stockCode", "dividendYear");

-- CreateIndex
CREATE INDEX "user_favorites_userId_idx" ON "user_favorites"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_favorites_userId_investorId_key" ON "user_favorites"("userId", "investorId");

-- CreateIndex
CREATE INDEX "watchlists_userId_idx" ON "watchlists"("userId");

-- CreateIndex
CREATE INDEX "watchlists_stockCode_idx" ON "watchlists"("stockCode");

-- CreateIndex
CREATE UNIQUE INDEX "watchlists_userId_stockCode_key" ON "watchlists"("userId", "stockCode");

-- CreateIndex
CREATE INDEX "price_alerts_userId_idx" ON "price_alerts"("userId");

-- CreateIndex
CREATE INDEX "price_alerts_stockCode_idx" ON "price_alerts"("stockCode");

-- CreateIndex
CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");

-- CreateIndex
CREATE INDEX "notifications_isRead_idx" ON "notifications"("isRead");

-- CreateIndex
CREATE INDEX "sync_logs_taskName_idx" ON "sync_logs"("taskName");

-- CreateIndex
CREATE INDEX "sync_logs_status_idx" ON "sync_logs"("status");

-- CreateIndex
CREATE INDEX "sync_logs_startTime_idx" ON "sync_logs"("startTime");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_keyHash_key" ON "api_keys"("keyHash");

-- CreateIndex
CREATE INDEX "api_keys_userId_idx" ON "api_keys"("userId");

-- CreateIndex
CREATE INDEX "api_usage_logs_apiKeyId_idx" ON "api_usage_logs"("apiKeyId");

-- CreateIndex
CREATE INDEX "api_usage_logs_createdAt_idx" ON "api_usage_logs"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "orders_orderNo_key" ON "orders"("orderNo");

-- CreateIndex
CREATE INDEX "orders_userId_idx" ON "orders"("userId");

-- CreateIndex
CREATE INDEX "orders_orderNo_idx" ON "orders"("orderNo");

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "orders"("status");

-- CreateIndex
CREATE INDEX "member_logs_userId_idx" ON "member_logs"("userId");

-- CreateIndex
CREATE INDEX "member_logs_expiresAt_idx" ON "member_logs"("expiresAt");

-- CreateIndex
CREATE INDEX "ads_position_idx" ON "ads"("position");

-- CreateIndex
CREATE INDEX "ads_isActive_idx" ON "ads"("isActive");

-- CreateIndex
CREATE INDEX "ad_logs_adId_idx" ON "ad_logs"("adId");

-- CreateIndex
CREATE INDEX "ad_logs_createdAt_idx" ON "ad_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "holdings" ADD CONSTRAINT "holdings_investorId_fkey" FOREIGN KEY ("investorId") REFERENCES "investors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "holdings" ADD CONSTRAINT "holdings_stockCode_fkey" FOREIGN KEY ("stockCode") REFERENCES "stocks"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kline_daily" ADD CONSTRAINT "kline_daily_stockCode_fkey" FOREIGN KEY ("stockCode") REFERENCES "stocks"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "executive_trades" ADD CONSTRAINT "executive_trades_stockCode_fkey" FOREIGN KEY ("stockCode") REFERENCES "stocks"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dividends" ADD CONSTRAINT "dividends_stockCode_fkey" FOREIGN KEY ("stockCode") REFERENCES "stocks"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_favorites" ADD CONSTRAINT "user_favorites_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_favorites" ADD CONSTRAINT "user_favorites_investorId_fkey" FOREIGN KEY ("investorId") REFERENCES "investors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "watchlists" ADD CONSTRAINT "watchlists_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "watchlists" ADD CONSTRAINT "watchlists_stockCode_fkey" FOREIGN KEY ("stockCode") REFERENCES "stocks"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_alerts" ADD CONSTRAINT "price_alerts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_usage_logs" ADD CONSTRAINT "api_usage_logs_apiKeyId_fkey" FOREIGN KEY ("apiKeyId") REFERENCES "api_keys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_logs" ADD CONSTRAINT "member_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_logs" ADD CONSTRAINT "ad_logs_adId_fkey" FOREIGN KEY ("adId") REFERENCES "ads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
