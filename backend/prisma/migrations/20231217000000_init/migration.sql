-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('admin', 'editor', 'viewer');

-- CreateEnum
CREATE TYPE "WidgetType" AS ENUM ('carousel', 'banner', 'popup', 'grid', 'slider', 'custom');

-- CreateEnum
CREATE TYPE "FeedFormat" AS ENUM ('google', 'facebook', 'custom');

-- CreateEnum
CREATE TYPE "FeedStatus" AS ENUM ('active', 'error', 'pending', 'syncing');

-- CreateEnum
CREATE TYPE "StockStatus" AS ENUM ('in_stock', 'out_of_stock', 'preorder');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'viewer',
    "first_name" TEXT,
    "last_name" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "domain" TEXT,
    "api_key" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "logo_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "widget_configs" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "type" "WidgetType" NOT NULL,
    "name" TEXT NOT NULL,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "placement" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "template_id" TEXT,
    "custom_data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "widget_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_templates" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "html_template" TEXT NOT NULL,
    "css_styles" TEXT,
    "data_schema" JSONB NOT NULL DEFAULT '{}',
    "default_data" JSONB NOT NULL DEFAULT '{}',
    "is_global" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "themes" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "primary_color" TEXT NOT NULL DEFAULT '#000000',
    "secondary_color" TEXT NOT NULL DEFAULT '#ffffff',
    "background_color" TEXT NOT NULL DEFAULT '#ffffff',
    "text_color" TEXT NOT NULL DEFAULT '#333333',
    "font_family" TEXT NOT NULL DEFAULT 'inherit',
    "border_radius" TEXT NOT NULL DEFAULT '8px',
    "css_variables" JSONB NOT NULL DEFAULT '{}',
    "custom_css" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "themes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "xml_feeds" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "format" "FeedFormat" NOT NULL DEFAULT 'google',
    "sync_interval" INTEGER NOT NULL DEFAULT 60,
    "last_sync_at" TIMESTAMP(3),
    "next_sync_at" TIMESTAMP(3),
    "status" "FeedStatus" NOT NULL DEFAULT 'pending',
    "error_message" TEXT,
    "product_count" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "xml_feeds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "feed_id" TEXT NOT NULL,
    "external_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "sale_price" DECIMAL(10,2),
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "image_url" TEXT,
    "product_url" TEXT,
    "category" TEXT,
    "brand" TEXT,
    "stock_status" "StockStatus" NOT NULL DEFAULT 'in_stock',
    "attributes" JSONB NOT NULL DEFAULT '{}',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feed_cache" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "payload" JSONB NOT NULL DEFAULT '[]',
    "checksum" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feed_cache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "old_values" JSONB,
    "new_values" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ab_tests" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "variant_a" JSONB NOT NULL,
    "variant_b" JSONB NOT NULL,
    "traffic_split" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "start_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end_date" TIMESTAMP(3),
    "impressions_a" INTEGER NOT NULL DEFAULT 0,
    "impressions_b" INTEGER NOT NULL DEFAULT 0,
    "clicks_a" INTEGER NOT NULL DEFAULT 0,
    "clicks_b" INTEGER NOT NULL DEFAULT 0,
    "conversions_a" INTEGER NOT NULL DEFAULT 0,
    "conversions_b" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ab_tests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_token_idx" ON "refresh_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "customers_slug_key" ON "customers"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "customers_api_key_key" ON "customers"("api_key");

-- CreateIndex
CREATE INDEX "customers_slug_idx" ON "customers"("slug");

-- CreateIndex
CREATE INDEX "customers_api_key_idx" ON "customers"("api_key");

-- CreateIndex
CREATE INDEX "widget_configs_customer_id_idx" ON "widget_configs"("customer_id");

-- CreateIndex
CREATE INDEX "widget_configs_type_idx" ON "widget_configs"("type");

-- CreateIndex
CREATE INDEX "widget_configs_template_id_idx" ON "widget_configs"("template_id");

-- CreateIndex
CREATE INDEX "custom_templates_customer_id_idx" ON "custom_templates"("customer_id");

-- CreateIndex
CREATE INDEX "custom_templates_is_global_idx" ON "custom_templates"("is_global");

-- CreateIndex
CREATE INDEX "themes_customer_id_idx" ON "themes"("customer_id");

-- CreateIndex
CREATE INDEX "xml_feeds_customer_id_idx" ON "xml_feeds"("customer_id");

-- CreateIndex
CREATE INDEX "xml_feeds_status_idx" ON "xml_feeds"("status");

-- CreateIndex
CREATE INDEX "products_customer_id_idx" ON "products"("customer_id");

-- CreateIndex
CREATE INDEX "products_feed_id_idx" ON "products"("feed_id");

-- CreateIndex
CREATE INDEX "products_category_idx" ON "products"("category");

-- CreateIndex
CREATE INDEX "products_brand_idx" ON "products"("brand");

-- CreateIndex
CREATE UNIQUE INDEX "products_customer_id_external_id_key" ON "products"("customer_id", "external_id");

-- CreateIndex
CREATE UNIQUE INDEX "feed_cache_customer_id_key" ON "feed_cache"("customer_id");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "ab_tests_customer_id_idx" ON "ab_tests"("customer_id");

-- CreateIndex
CREATE INDEX "ab_tests_is_active_idx" ON "ab_tests"("is_active");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "widget_configs" ADD CONSTRAINT "widget_configs_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "widget_configs" ADD CONSTRAINT "widget_configs_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "custom_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_templates" ADD CONSTRAINT "custom_templates_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "themes" ADD CONSTRAINT "themes_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "xml_feeds" ADD CONSTRAINT "xml_feeds_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_feed_id_fkey" FOREIGN KEY ("feed_id") REFERENCES "xml_feeds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feed_cache" ADD CONSTRAINT "feed_cache_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ab_tests" ADD CONSTRAINT "ab_tests_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
