-- DropForeignKey
ALTER TABLE `attendance` DROP FOREIGN KEY `attendance_member_id_fkey`;

-- DropForeignKey
ALTER TABLE `memberships` DROP FOREIGN KEY `memberships_member_id_fkey`;

-- DropForeignKey
ALTER TABLE `payments` DROP FOREIGN KEY `payments_member_id_fkey`;

-- AlterTable
ALTER TABLE `attendance` ADD COLUMN `is_reversed` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `reversal_reason` TEXT NULL,
    ADD COLUMN `reversed_at` DATETIME(3) NULL,
    ADD COLUMN `reversed_by_id` VARCHAR(36) NULL,
    ADD COLUMN `staff_id` VARCHAR(36) NULL;

-- AlterTable
ALTER TABLE `payments` ADD COLUMN `is_reversed` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `reversal_reason` TEXT NULL,
    ADD COLUMN `reversed_at` DATETIME(3) NULL,
    ADD COLUMN `reversed_by_id` VARCHAR(36) NULL,
    ADD COLUMN `staff_id` VARCHAR(36) NULL;

-- CreateIndex
CREATE INDEX `attendance_staff_id_idx` ON `attendance`(`staff_id`);

-- CreateIndex
CREATE INDEX `payments_staff_id_idx` ON `payments`(`staff_id`);

-- AddForeignKey
ALTER TABLE `memberships` ADD CONSTRAINT `memberships_member_id_fkey` FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_member_id_fkey` FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_staff_id_fkey` FOREIGN KEY (`staff_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_reversed_by_id_fkey` FOREIGN KEY (`reversed_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendance` ADD CONSTRAINT `attendance_member_id_fkey` FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendance` ADD CONSTRAINT `attendance_staff_id_fkey` FOREIGN KEY (`staff_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendance` ADD CONSTRAINT `attendance_reversed_by_id_fkey` FOREIGN KEY (`reversed_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
