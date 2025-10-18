/*
  Warnings:

  - You are about to drop the column `leaveType` on the `leave_applications` table. All the data in the column will be lost.
  - You are about to drop the column `leaveType` on the `leave_balances` table. All the data in the column will be lost.
  - You are about to drop the column `leaveType` on the `leave_limits` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[users_id,calendar_period_id,termType,leave_type_id]` on the table `leave_balances` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[status_id,termType,leave_type_id]` on the table `leave_limits` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `leave_type_id` to the `leave_applications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `leave_type_id` to the `leave_balances` table without a default value. This is not possible if the table is not empty.
  - Added the required column `leave_type_id` to the `leave_limits` table without a default value. This is not possible if the table is not empty.

*/

-- Step 1: Create the leave_types table first
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

-- Step 2: Insert the leave types including Travel Order
INSERT INTO `leave_types` (`name`, `description`) VALUES 
('VACATION', 'Vacation Leave'),
('SICK', 'Sick Leave'),
('MATERNITY', 'Maternity Leave'),
('PATERNITY', 'Paternity Leave'),
('EMERGENCY', 'Emergency Leave'),
('TRAVEL_ORDER', 'Travel Order');

-- Step 3: Add the leave_type_id column with a temporary default value
ALTER TABLE `leave_limits` ADD COLUMN `leave_type_id` INTEGER DEFAULT 1;
ALTER TABLE `leave_balances` ADD COLUMN `leave_type_id` INTEGER DEFAULT 1;
ALTER TABLE `leave_applications` ADD COLUMN `leave_type_id` INTEGER DEFAULT 1;

-- Step 4: Update existing records to map enum values to table IDs
UPDATE `leave_limits` SET `leave_type_id` = (SELECT `leave_type_id` FROM `leave_types` WHERE `name` = `leave_limits`.`leaveType`);
UPDATE `leave_balances` SET `leave_type_id` = (SELECT `leave_type_id` FROM `leave_types` WHERE `name` = `leave_balances`.`leaveType`);
UPDATE `leave_applications` SET `leave_type_id` = (SELECT `leave_type_id` FROM `leave_types` WHERE `name` = `leave_applications`.`leaveType`);

-- Step 5: Drop foreign keys first
ALTER TABLE `leave_balances` DROP FOREIGN KEY `leave_balances_users_id_fkey`;
ALTER TABLE `leave_limits` DROP FOREIGN KEY `leave_limits_status_id_fkey`;

-- Step 6: Drop old indexes
DROP INDEX `leave_balances_users_id_calendar_period_id_termType_leaveTyp_key` ON `leave_balances`;
DROP INDEX `leave_limits_status_id_termType_leaveType_key` ON `leave_limits`;

-- Step 7: Drop the old enum columns
ALTER TABLE `leave_applications` DROP COLUMN `leaveType`;
ALTER TABLE `leave_balances` DROP COLUMN `leaveType`;
ALTER TABLE `leave_limits` DROP COLUMN `leaveType`;

-- Step 8: Make leave_type_id NOT NULL
ALTER TABLE `leave_limits` MODIFY `leave_type_id` INTEGER NOT NULL;
ALTER TABLE `leave_balances` MODIFY `leave_type_id` INTEGER NOT NULL;
ALTER TABLE `leave_applications` MODIFY `leave_type_id` INTEGER NOT NULL;

-- Step 9: Create new indexes
CREATE INDEX `leave_applications_leave_type_id_fkey` ON `leave_applications`(`leave_type_id`);
CREATE INDEX `leave_balances_leave_type_id_fkey` ON `leave_balances`(`leave_type_id`);
CREATE UNIQUE INDEX `leave_balances_users_id_calendar_period_id_termType_leave_ty_key` ON `leave_balances`(`users_id`, `calendar_period_id`, `termType`, `leave_type_id`);
CREATE INDEX `leave_limits_leave_type_id_fkey` ON `leave_limits`(`leave_type_id`);
CREATE UNIQUE INDEX `leave_limits_status_id_termType_leave_type_id_key` ON `leave_limits`(`status_id`, `termType`, `leave_type_id`);

-- Step 10: Add foreign key constraints
ALTER TABLE `leave_applications` ADD CONSTRAINT `leave_applications_leave_type_id_fkey` FOREIGN KEY (`leave_type_id`) REFERENCES `leave_types`(`leave_type_id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `leave_applications` ADD CONSTRAINT `leave_applications_reviewedBy_fkey` FOREIGN KEY (`reviewedBy`) REFERENCES `users`(`users_id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `leave_limits` ADD CONSTRAINT `leave_limits_leave_type_id_fkey` FOREIGN KEY (`leave_type_id`) REFERENCES `leave_types`(`leave_type_id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `leave_limits` ADD CONSTRAINT `leave_limits_status_id_fkey` FOREIGN KEY (`status_id`) REFERENCES `statuses`(`status_id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `leave_balances` ADD CONSTRAINT `leave_balances_leave_type_id_fkey` FOREIGN KEY (`leave_type_id`) REFERENCES `leave_types`(`leave_type_id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `leave_balances` ADD CONSTRAINT `leave_balances_users_id_fkey` FOREIGN KEY (`users_id`) REFERENCES `users`(`users_id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `leave_balances` ADD CONSTRAINT `leave_balances_calendar_period_id_fkey` FOREIGN KEY (`calendar_period_id`) REFERENCES `calendar_periods`(`calendar_period_id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `leave_balances` ADD CONSTRAINT `leave_balances_status_id_fkey` FOREIGN KEY (`status_id`) REFERENCES `statuses`(`status_id`) ON DELETE RESTRICT ON UPDATE CASCADE;
