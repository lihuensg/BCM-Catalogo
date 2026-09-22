-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "SaleMode" AS ENUM ('IN_STOCK', 'MADE_TO_ORDER');

-- CreateEnum
CREATE TYPE "Availability" AS ENUM ('AVAILABLE', 'LOW_STOCK', 'OUT_OF_STOCK', 'CHECK_AVAILABILITY', 'MADE_TO_ORDER');

-- CreateEnum
CREATE TYPE "AttributeDataType" AS ENUM ('TEXT', 'NUMBER', 'BOOLEAN', 'OPTION');

-- CreateEnum
CREATE TYPE "BannerPlacement" AS ENUM ('HOME_HERO', 'HOME_SECONDARY', 'CATALOG_TOP');

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(160) NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "passwordHash" VARCHAR(512) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(160) NOT NULL,
    "slug" VARCHAR(180) NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "parentId" UUID,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Brand" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(160) NOT NULL,
    "slug" VARCHAR(180) NOT NULL,
    "description" TEXT,
    "logoUrl" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Brand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(200) NOT NULL,
    "slug" VARCHAR(220) NOT NULL,
    "sku" VARCHAR(100),
    "shortDescription" VARCHAR(500) NOT NULL,
    "fullDescription" TEXT,
    "categoryId" UUID NOT NULL,
    "brandId" UUID,
    "price" DECIMAL(18,2),
    "compareAtPrice" DECIMAL(18,2),
    "showPrice" BOOLEAN NOT NULL DEFAULT false,
    "saleMode" "SaleMode" NOT NULL DEFAULT 'IN_STOCK',
    "availability" "Availability" NOT NULL DEFAULT 'CHECK_AVAILABILITY',
    "active" BOOLEAN NOT NULL DEFAULT false,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "onSale" BOOLEAN NOT NULL DEFAULT false,
    "newArrival" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "publishedAt" TIMESTAMPTZ(3),
    "seoTitle" VARCHAR(200),
    "seoDescription" VARCHAR(500),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductImage" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "productId" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "altText" VARCHAR(300) NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttributeDefinition" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(160) NOT NULL,
    "slug" VARCHAR(180) NOT NULL,
    "dataType" "AttributeDataType" NOT NULL,
    "unit" VARCHAR(40),
    "filterable" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AttributeDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttributeOption" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "attributeId" UUID NOT NULL,
    "dataType" "AttributeDataType" NOT NULL DEFAULT 'OPTION',
    "label" VARCHAR(160) NOT NULL,
    "value" VARCHAR(160) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AttributeOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategoryAttribute" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "categoryId" UUID NOT NULL,
    "attributeId" UUID NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CategoryAttribute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductAttributeValue" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "productId" UUID NOT NULL,
    "categoryId" UUID NOT NULL,
    "attributeId" UUID NOT NULL,
    "dataType" "AttributeDataType" NOT NULL,
    "textValue" TEXT,
    "numberValue" DECIMAL(24,6),
    "booleanValue" BOOLEAN,
    "optionId" UUID,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductAttributeValue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Banner" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" VARCHAR(200),
    "subtitle" VARCHAR(500),
    "imageUrl" TEXT NOT NULL,
    "mobileImageUrl" TEXT,
    "ctaText" VARCHAR(100),
    "ctaHref" TEXT,
    "placement" "BannerPlacement" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "startsAt" TIMESTAMPTZ(3),
    "endsAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Banner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteSettings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "singleton" BOOLEAN NOT NULL DEFAULT true,
    "siteName" VARCHAR(160) NOT NULL,
    "whatsappNumber" VARCHAR(15),
    "whatsappMessageTemplate" TEXT,
    "instagramUrl" TEXT,
    "heroTitle" VARCHAR(200),
    "heroSubtitle" VARCHAR(500),
    "defaultSeoTitle" VARCHAR(200) NOT NULL,
    "defaultSeoDescription" VARCHAR(500) NOT NULL,
    "defaultOgImageUrl" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE INDEX "Category_parentId_active_sortOrder_idx" ON "Category"("parentId", "active", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Brand_slug_key" ON "Brand"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");

-- CreateIndex
CREATE INDEX "Product_categoryId_active_sortOrder_id_idx" ON "Product"("categoryId", "active", "sortOrder", "id");

-- CreateIndex
CREATE INDEX "Product_brandId_active_sortOrder_id_idx" ON "Product"("brandId", "active", "sortOrder", "id");

-- CreateIndex
CREATE INDEX "Product_active_sortOrder_id_idx" ON "Product"("active", "sortOrder", "id");

-- CreateIndex
CREATE INDEX "Product_active_availability_idx" ON "Product"("active", "availability");

-- CreateIndex
CREATE INDEX "Product_active_publishedAt_id_idx" ON "Product"("active", "publishedAt", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Product_id_categoryId_key" ON "Product"("id", "categoryId");

-- CreateIndex
CREATE INDEX "ProductImage_productId_sortOrder_id_idx" ON "ProductImage"("productId", "sortOrder", "id");

-- CreateIndex
CREATE UNIQUE INDEX "AttributeDefinition_slug_key" ON "AttributeDefinition"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "AttributeDefinition_id_dataType_key" ON "AttributeDefinition"("id", "dataType");

-- CreateIndex
CREATE UNIQUE INDEX "AttributeOption_attributeId_value_key" ON "AttributeOption"("attributeId", "value");

-- CreateIndex
CREATE UNIQUE INDEX "AttributeOption_id_attributeId_key" ON "AttributeOption"("id", "attributeId");

-- CreateIndex
CREATE INDEX "CategoryAttribute_attributeId_idx" ON "CategoryAttribute"("attributeId");

-- CreateIndex
CREATE UNIQUE INDEX "CategoryAttribute_categoryId_attributeId_key" ON "CategoryAttribute"("categoryId", "attributeId");

-- CreateIndex
CREATE INDEX "ProductAttributeValue_categoryId_attributeId_idx" ON "ProductAttributeValue"("categoryId", "attributeId");

-- CreateIndex
CREATE INDEX "ProductAttributeValue_attributeId_numberValue_idx" ON "ProductAttributeValue"("attributeId", "numberValue");

-- CreateIndex
CREATE INDEX "ProductAttributeValue_attributeId_optionId_idx" ON "ProductAttributeValue"("attributeId", "optionId");

-- CreateIndex
CREATE INDEX "ProductAttributeValue_optionId_attributeId_idx" ON "ProductAttributeValue"("optionId", "attributeId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductAttributeValue_productId_attributeId_key" ON "ProductAttributeValue"("productId", "attributeId");

-- CreateIndex
CREATE INDEX "Banner_placement_active_sortOrder_idx" ON "Banner"("placement", "active", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "SiteSettings_singleton_key" ON "SiteSettings"("singleton");

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "AttributeOption" ADD CONSTRAINT "AttributeOption_attributeId_dataType_fkey" FOREIGN KEY ("attributeId", "dataType") REFERENCES "AttributeDefinition"("id", "dataType") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "CategoryAttribute" ADD CONSTRAINT "CategoryAttribute_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "CategoryAttribute" ADD CONSTRAINT "CategoryAttribute_attributeId_fkey" FOREIGN KEY ("attributeId") REFERENCES "AttributeDefinition"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "ProductAttributeValue" ADD CONSTRAINT "ProductAttributeValue_productId_categoryId_fkey" FOREIGN KEY ("productId", "categoryId") REFERENCES "Product"("id", "categoryId") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "ProductAttributeValue" ADD CONSTRAINT "ProductAttributeValue_categoryId_attributeId_fkey" FOREIGN KEY ("categoryId", "attributeId") REFERENCES "CategoryAttribute"("categoryId", "attributeId") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "ProductAttributeValue" ADD CONSTRAINT "ProductAttributeValue_attributeId_dataType_fkey" FOREIGN KEY ("attributeId", "dataType") REFERENCES "AttributeDefinition"("id", "dataType") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "ProductAttributeValue" ADD CONSTRAINT "ProductAttributeValue_optionId_attributeId_fkey" FOREIGN KEY ("optionId", "attributeId") REFERENCES "AttributeOption"("id", "attributeId") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- Hand-written PostgreSQL invariants (not expressible as Prisma CHECK declarations).
-- Keep these when generating subsequent migrations; do not replace this file with db push.
ALTER TABLE "Category" ADD CONSTRAINT "Category_not_own_parent" CHECK ("parentId" IS NULL OR "parentId" <> "id");
ALTER TABLE "Product" ADD CONSTRAINT "Product_valid_prices" CHECK (
  ("price" IS NULL OR ("price" >= 0 AND "price" <> 'NaN'::numeric)) AND
  ("compareAtPrice" IS NULL OR ("price" IS NOT NULL AND "compareAtPrice" > "price" AND "compareAtPrice" <> 'NaN'::numeric))
);
ALTER TABLE "Product" ADD CONSTRAINT "Product_sale_availability" CHECK (
  ("saleMode" = 'IN_STOCK' AND "availability" <> 'MADE_TO_ORDER') OR
  ("saleMode" = 'MADE_TO_ORDER' AND "availability" IN ('MADE_TO_ORDER', 'CHECK_AVAILABILITY', 'OUT_OF_STOCK'))
);
ALTER TABLE "Product" ADD CONSTRAINT "Product_active_published" CHECK (NOT "active" OR "publishedAt" IS NOT NULL);
ALTER TABLE "Product" ADD CONSTRAINT "Product_nonempty_content" CHECK (
  length(btrim("name")) > 0 AND length(btrim("shortDescription")) > 0 AND
  ("sku" IS NULL OR (length(btrim("sku")) > 0 AND "sku" = btrim("sku")))
);
ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_nonempty" CHECK (length(btrim("url")) > 0 AND length(btrim("altText")) > 0);
CREATE UNIQUE INDEX "ProductImage_one_primary" ON "ProductImage" ("productId") WHERE "isPrimary" = true;
ALTER TABLE "AttributeOption" ADD CONSTRAINT "AttributeOption_option_type" CHECK ("dataType" = 'OPTION');
ALTER TABLE "AttributeOption" ADD CONSTRAINT "AttributeOption_nonempty" CHECK (length(btrim("label")) > 0 AND length(btrim("value")) > 0);
ALTER TABLE "ProductAttributeValue" ADD CONSTRAINT "ProductAttributeValue_typed_value" CHECK (
  num_nonnulls("textValue", "numberValue", "booleanValue", "optionId") = 1 AND
  CASE "dataType"
    WHEN 'TEXT' THEN "textValue" IS NOT NULL AND length(btrim("textValue")) > 0
    WHEN 'NUMBER' THEN "numberValue" IS NOT NULL AND "numberValue" <> 'NaN'::numeric
    WHEN 'BOOLEAN' THEN "booleanValue" IS NOT NULL
    WHEN 'OPTION' THEN "optionId" IS NOT NULL
  END
);
ALTER TABLE "SiteSettings" ADD CONSTRAINT "SiteSettings_singleton_true" CHECK ("singleton" = true);
ALTER TABLE "SiteSettings" ADD CONSTRAINT "SiteSettings_whatsapp_number" CHECK ("whatsappNumber" IS NULL OR "whatsappNumber" ~ '^[1-9][0-9]{6,14}$');
ALTER TABLE "SiteSettings" ADD CONSTRAINT "SiteSettings_whatsapp_pair" CHECK (("whatsappNumber" IS NULL) = ("whatsappMessageTemplate" IS NULL));
ALTER TABLE "SiteSettings" ADD CONSTRAINT "SiteSettings_required_content" CHECK (
  length(btrim("siteName")) > 0 AND length(btrim("defaultSeoTitle")) > 0 AND length(btrim("defaultSeoDescription")) > 0
);
ALTER TABLE "Banner" ADD CONSTRAINT "Banner_valid_interval" CHECK ("startsAt" IS NULL OR "endsAt" IS NULL OR "endsAt" > "startsAt");
ALTER TABLE "Banner" ADD CONSTRAINT "Banner_cta_pair" CHECK (("ctaText" IS NULL) = ("ctaHref" IS NULL));
ALTER TABLE "Banner" ADD CONSTRAINT "Banner_nonempty_image" CHECK (length(btrim("imageUrl")) > 0);
ALTER TABLE "AdminUser" ADD CONSTRAINT "AdminUser_normalized_email" CHECK ("email" = lower(btrim("email")) AND position('@' IN "email") > 1);
ALTER TABLE "AdminUser" ADD CONSTRAINT "AdminUser_password_hash" CHECK (
  "passwordHash" ~ '^[$](argon2id|2[aby]|scrypt)[$]' AND length("passwordHash") >= 50
);
ALTER TABLE "AdminUser" ADD CONSTRAINT "AdminUser_nonempty_name" CHECK (length(btrim("name")) > 0);

-- No standalone indexes on every boolean. Small merchandising subsets are indexed.
CREATE INDEX "Product_featured_listing" ON "Product" ("sortOrder", "id") WHERE "active" AND "featured";
CREATE INDEX "Product_sale_listing" ON "Product" ("sortOrder", "id") WHERE "active" AND "onSale";
CREATE INDEX "Product_new_listing" ON "Product" ("sortOrder", "id") WHERE "active" AND "newArrival";

-- Common shape constraints.
ALTER TABLE "Category" ADD CONSTRAINT "Category_slug_format" CHECK ("slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
ALTER TABLE "Brand" ADD CONSTRAINT "Brand_slug_format" CHECK ("slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
ALTER TABLE "Product" ADD CONSTRAINT "Product_slug_format" CHECK ("slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
ALTER TABLE "AttributeDefinition" ADD CONSTRAINT "AttributeDefinition_slug_format" CHECK ("slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
ALTER TABLE "Category" ADD CONSTRAINT "Category_nonempty_name" CHECK (length(btrim("name")) > 0);
ALTER TABLE "Brand" ADD CONSTRAINT "Brand_nonempty_name" CHECK (length(btrim("name")) > 0);
ALTER TABLE "AttributeDefinition" ADD CONSTRAINT "AttributeDefinition_nonempty_name" CHECK (length(btrim("name")) > 0);
ALTER TABLE "Category" ADD CONSTRAINT "Category_sort_nonnegative" CHECK ("sortOrder" >= 0);
ALTER TABLE "Product" ADD CONSTRAINT "Product_sort_nonnegative" CHECK ("sortOrder" >= 0);
ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_sort_nonnegative" CHECK ("sortOrder" >= 0);
ALTER TABLE "AttributeOption" ADD CONSTRAINT "AttributeOption_sort_nonnegative" CHECK ("sortOrder" >= 0);
ALTER TABLE "CategoryAttribute" ADD CONSTRAINT "CategoryAttribute_sort_nonnegative" CHECK ("sortOrder" >= 0);
ALTER TABLE "Banner" ADD CONSTRAINT "Banner_sort_nonnegative" CHECK ("sortOrder" >= 0);
