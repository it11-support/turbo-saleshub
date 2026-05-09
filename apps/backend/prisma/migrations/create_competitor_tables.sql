-- CreateTable
CREATE TABLE `competitors` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,

    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE INDEX `competitors_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `visit_competitors` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

    `visit_id` BIGINT UNSIGNED NOT NULL,
    `competitor_id` BIGINT UNSIGNED NOT NULL,

    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    INDEX `visit_competitors_visit_id_idx`(`visit_id`),
    INDEX `visit_competitors_competitor_id_idx`(`competitor_id`),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `competitor_products` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

    `visit_competitor_id` BIGINT UNSIGNED NOT NULL,

    `product_name` VARCHAR(255) NOT NULL,
    `brand` VARCHAR(255) NULL,
    `price` DECIMAL(15,2) NULL,
    `unit` VARCHAR(100) NULL,

    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    INDEX `competitor_products_visit_competitor_id_idx`(`visit_competitor_id`),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `visit_competitors`
ADD CONSTRAINT `visit_competitors_visit_id_fkey`
FOREIGN KEY (`visit_id`)
REFERENCES `visits`(`id`)
ON DELETE CASCADE
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visit_competitors`
ADD CONSTRAINT `visit_competitors_competitor_id_fkey`
FOREIGN KEY (`competitor_id`)
REFERENCES `competitors`(`id`)
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `competitor_products`
ADD CONSTRAINT `competitor_products_visit_competitor_id_fkey`
FOREIGN KEY (`visit_competitor_id`)
REFERENCES `visit_competitors`(`id`)
ON DELETE CASCADE
ON UPDATE CASCADE;


ALTER TABLE `competitor_products`
ADD COLUMN `is_promo` TINYINT(1) DEFAULT 0 AFTER `price`,
ADD COLUMN `notes` TEXT NULL AFTER `unit`,
ADD COLUMN `stock_status` ENUM('AVAILABLE','LOW', 'OUT_OF_STOCK') DEFAULT 'AVAILABLE' AFTER `is_promo`;

ALTER TABLE `competitor_products`
ADD COLUMN `monthly_usage` DECIMAL(15,2) NULL
AFTER `price`;
