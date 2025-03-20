-- CreateTable
CREATE TABLE "token_data" (
    "db_id" SERIAL NOT NULL,
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "current_price" DECIMAL(18,8),
    "market_cap" DECIMAL(36,2),
    "market_cap_rank" DECIMAL(65,30),
    "fully_diluted_valuation" DECIMAL(36,2),
    "total_volume" DECIMAL(36,2),
    "high_24h" DECIMAL(18,8),
    "low_24h" DECIMAL(18,8),
    "price_change_24h" DECIMAL(18,8),
    "price_change_percentage_24h" DECIMAL(10,2),
    "market_cap_change_24h" DECIMAL(36,2),
    "market_cap_change_percentage_24h" DECIMAL(10,2),
    "circulating_supply" DECIMAL(36,8),
    "total_supply" DECIMAL(36,8),
    "max_supply" DECIMAL(36,8),
    "ath" DECIMAL(18,8),
    "ath_change_percentage" DECIMAL(10,2),
    "ath_date" TIMESTAMP(3),
    "atl" DECIMAL(18,8),
    "atl_change_percentage" DECIMAL(10,2),
    "atl_date" TIMESTAMP(3),
    "roi" JSONB,
    "last_updated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "token_data_pkey" PRIMARY KEY ("db_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "token_data_id_key" ON "token_data"("id");
