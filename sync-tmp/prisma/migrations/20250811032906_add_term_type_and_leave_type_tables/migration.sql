/*
  Warnings:

  - You are about to drop the column `term` on the `calendar_periods` table. All the data in the column will be lost.
  - You are about to drop the column `leaveType` on the `leave_applications` table. All the data in the column will be lost.
  - You are about to drop the column `leaveType` on the `leave_balances` table. All the data in the column will be lost.
  - You are about to drop the column `termType` on the `leave_balances` table. All the data in the column will be lost.
  - You are about to drop the column `leaveType` on the `leave_limits` table. All the data in the column will be lost.
  - You are about to drop the column `termType` on the `leave_limits` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[users_id,calendar_period_id,term_type_id,leave_type_id]` on the table `leave_balances` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[status_id,term_type_id,leave_type_id]` on the table `leave_limits` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `term_type_id` to the `calendar_periods` table without a default value. This is not possible if the table is not empty.
  - Added the required column `leave_type_id` to the `leave_applications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `leave_type_id` to the `leave_balances` table without a default value. This is not possible if the table is not empty.
  - Added the required column `term_type_id` to the `leave_balances` table without a default value. This is not possible if the table is not empty.
  - Added the required column `leave_type_id` to the `leave_limits` table without a default value. This is not possible if the table is not empty.
  - Added the required column `term_type_id` to the `leave_limits` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `leave_balances` DROP FOREIGN KEY `leave_balances_users_id_fkey`;

-- DropForeignKey
ALTER TABLE `leave_limits` DROP FOREIGN KEY `leave_limits_status_id_fkey`;

-- DropIndex
DROP INDEX `leave_balances_users_id_calendar_period_id_termType_leaveTyp_key` ON `leave_balances`;

-- DropIndex
DROP INDEX `leave_limits_status_id_termType_leaveType_key` ON `leave_limits`;

-- AlterTable
ALTER TABLE `calendar_periods` DROP COLUMN `term`,
    ADD COLUMN `term_type_id` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `leave_applications` DROP COLUMN `leaveType`,
    ADD COLUMN `leave_type_id` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `leave_balances` DROP COLUMN `leaveType`,
    DROP COLUMN `termType`,
    ADD COLUMN `leave_type_id` INTEGER NOT NULL,
    ADD COLUMN `term_type_id` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `leave_limits` DROP COLUMN `leaveType`,
    DROP COLUMN `termType`,
    ADD COLUMN `leave_type_id` INTEGER NOT NULL,
    ADD COLUMN `term_type_id` INTEGER NOT NULL;

-- CreateTable
CREATE TABLE `term_types` (
    `term_type_id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `term_types_name_key`(`name`),
    PRIMARY KEY (`term_type_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `leave_types` (
    `leave_type_id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `leave_types_name_key`(`name`),
    PRIMARY KEY (`leave_type_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `calendar_periods_term_type_id_fkey` ON `calendar_periods`(`term_type_id`);

-- CreateIndex
CREATE INDEX `leave_applications_leave_type_id_fkey` ON `leave_applications`(`leave_type_id`);

-- CreateIndex
CREATE INDEX `leave_balances_leave_type_id_fkey` ON `leave_balances`(`leave_type_id`);

-- CreateIndex
CREATE INDEX `leave_balances_term_type_id_fkey` ON `leave_balances`(`term_type_id`);

-- CreateIndex
CREATE INDEX `leave_balances_users_id_fkey` ON `leave_balances`(`users_id`);

-- CreateIndex
CREATE UNIQUE INDEX `leave_balances_users_id_calendar_period_id_term_type_id_leav_key` ON `leave_balances`(`users_id`, `calendar_period_id`, `term_type_id`, `leave_type_id`);

-- CreateIndex
CREATE INDEX `leave_limits_leave_type_id_fkey` ON `leave_limits`(`leave_type_id`);

-- CreateIndex
CREATE INDEX `leave_limits_term_type_id_fkey` ON `leave_limits`(`term_type_id`);

-- CreateIndex
CREATE INDEX `leave_limits_status_id_fkey` ON `leave_limits`(`status_id`);

-- CreateIndex
CREATE UNIQUE INDEX `leave_limits_status_id_term_type_id_leave_type_id_key` ON `leave_limits`(`status_id`, `term_type_id`, `leave_type_id`);

-- AddForeignKey
ALTER TABLE `calendar_periods` ADD CONSTRAINT `calendar_periods_term_type_id_fkey` FOREIGN KEY (`term_type_id`) REFERENCES `term_types`(`term_type_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leave_applications` ADD CONSTRAINT `leave_applications_calendar_period_id_fkey` FOREIGN KEY (`calendar_period_id`) REFERENCES `calendar_periods`(`calendar_period_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leave_applications` ADD CONSTRAINT `leave_applications_leave_type_id_fkey` FOREIGN KEY (`leave_type_id`) REFERENCES `leave_types`(`leave_type_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leave_limits` ADD CONSTRAINT `leave_limits_term_type_id_fkey` FOREIGN KEY (`term_type_id`) REFERENCES `term_types`(`term_type_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leave_limits` ADD CONSTRAINT `leave_limits_leave_type_id_fkey` FOREIGN KEY (`leave_type_id`) REFERENCES `leave_types`(`leave_type_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leave_balances` ADD CONSTRAINT `leave_balances_term_type_id_fkey` FOREIGN KEY (`term_type_id`) REFERENCES `term_types`(`term_type_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leave_balances` ADD CONSTRAINT `leave_balances_leave_type_id_fkey` FOREIGN KEY (`leave_type_id`) REFERENCES `leave_types`(`leave_type_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leave_balances` ADD CONSTRAINT `leave_balances_users_id_fkey` FOREIGN KEY (`users_id`) REFERENCES `users`(`users_id`) ON DELETE RESTRICT ON UPDATE CASCADE;
