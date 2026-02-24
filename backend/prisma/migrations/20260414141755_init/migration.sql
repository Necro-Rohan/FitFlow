-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(36) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `username` VARCHAR(100) NOT NULL,
    `role` ENUM('OWNER', 'STAFF', 'TRAINER') NOT NULL DEFAULT 'STAFF',
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `members` (
    `id` VARCHAR(36) NOT NULL,
    `full_name` VARCHAR(200) NOT NULL,
    `phone` VARCHAR(15) NOT NULL,
    `qr_code` VARCHAR(100) NOT NULL,
    `status` ENUM('ACTIVE', 'EXPIRED', 'PAUSED') NOT NULL DEFAULT 'ACTIVE',
    `managed_by_id` VARCHAR(36) NULL,
    `assigned_trainer_id` VARCHAR(36) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `sync_updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `members_phone_key`(`phone`),
    UNIQUE INDEX `members_qr_code_key`(`qr_code`),
    INDEX `members_qr_code_idx`(`qr_code`),
    INDEX `members_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `memberships` (
    `id` VARCHAR(36) NOT NULL,
    `member_id` VARCHAR(36) NOT NULL,
    `plan_name` VARCHAR(100) NOT NULL,
    `start_date` DATE NOT NULL,
    `end_date` DATE NOT NULL,
    `type` ENUM('SUBSCRIPTION', 'CLASS_PACK', 'PT') NOT NULL,
    `remaining_classes` INTEGER NULL,
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `memberships_member_id_idx`(`member_id`),
    INDEX `memberships_end_date_idx`(`end_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payments` (
    `id` VARCHAR(36) NOT NULL,
    `member_id` VARCHAR(36) NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `method` ENUM('UPI', 'CASH', 'CARD') NOT NULL,
    `sync_status` ENUM('PENDING', 'SYNCED') NOT NULL DEFAULT 'PENDING',
    `invoice_number` VARCHAR(50) NULL,
    `transaction_date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `payments_member_id_idx`(`member_id`),
    INDEX `payments_sync_status_idx`(`sync_status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `attendance` (
    `id` VARCHAR(36) NOT NULL,
    `member_id` VARCHAR(36) NOT NULL,
    `check_in` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `sync_status` ENUM('PENDING', 'SYNCED') NOT NULL DEFAULT 'PENDING',

    INDEX `attendance_member_id_idx`(`member_id`),
    INDEX `attendance_sync_status_idx`(`sync_status`),
    INDEX `attendance_check_in_idx`(`check_in`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `leads` (
    `id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `phone` VARCHAR(15) NOT NULL,
    `status` ENUM('NEW', 'FOLLOW_UP', 'CONVERTED', 'CLOSED') NOT NULL DEFAULT 'NEW',
    `notes` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `leads_status_idx`(`status`),
    INDEX `leads_phone_idx`(`phone`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_logs` (
    `id` VARCHAR(36) NOT NULL,
    `user_id` VARCHAR(36) NOT NULL,
    `action` VARCHAR(100) NOT NULL,
    `metadata` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `audit_logs_user_id_idx`(`user_id`),
    INDEX `audit_logs_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `members` ADD CONSTRAINT `members_managed_by_id_fkey` FOREIGN KEY (`managed_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `members` ADD CONSTRAINT `members_assigned_trainer_id_fkey` FOREIGN KEY (`assigned_trainer_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `memberships` ADD CONSTRAINT `memberships_member_id_fkey` FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_member_id_fkey` FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendance` ADD CONSTRAINT `attendance_member_id_fkey` FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
