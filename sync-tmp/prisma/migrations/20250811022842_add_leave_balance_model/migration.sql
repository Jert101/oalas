-- AlterTable
ALTER TABLE `users` MODIFY `profilePicture` VARCHAR(191) NULL DEFAULT '/ckcm.png';

-- CreateTable
CREATE TABLE `calendar_periods` (
    `calendar_period_id` INTEGER NOT NULL AUTO_INCREMENT,
    `academicYear` VARCHAR(191) NOT NULL,
    `term` ENUM('ACADEMIC', 'SUMMER') NOT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `isCurrent` BOOLEAN NOT NULL DEFAULT false,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`calendar_period_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `leave_applications` (
    `leave_application_id` INTEGER NOT NULL AUTO_INCREMENT,
    `users_id` VARCHAR(191) NOT NULL,
    `calendar_period_id` INTEGER NULL,
    `leaveType` VARCHAR(191) NOT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `reason` TEXT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'DENIED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `appliedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `reviewedAt` DATETIME(3) NULL,
    `reviewedBy` VARCHAR(191) NULL,
    `comments` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`leave_application_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `leave_limits` (
    `leave_limit_id` INTEGER NOT NULL AUTO_INCREMENT,
    `status_id` INTEGER NOT NULL,
    `termType` ENUM('ACADEMIC', 'SUMMER') NOT NULL,
    `leaveType` ENUM('VACATION', 'SICK', 'MATERNITY', 'PATERNITY', 'EMERGENCY') NOT NULL,
    `daysAllowed` INTEGER NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `leave_limits_status_id_termType_leaveType_key`(`status_id`, `termType`, `leaveType`),
    PRIMARY KEY (`leave_limit_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `leave_balances` (
    `leave_balance_id` INTEGER NOT NULL AUTO_INCREMENT,
    `users_id` VARCHAR(191) NOT NULL,
    `calendar_period_id` INTEGER NOT NULL,
    `status_id` INTEGER NOT NULL,
    `termType` ENUM('ACADEMIC', 'SUMMER') NOT NULL,
    `leaveType` ENUM('VACATION', 'SICK', 'MATERNITY', 'PATERNITY', 'EMERGENCY') NOT NULL,
    `allowedDays` INTEGER NOT NULL,
    `usedDays` INTEGER NOT NULL DEFAULT 0,
    `remainingDays` INTEGER NOT NULL,
    `lastCalculated` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `leave_balances_users_id_calendar_period_id_termType_leaveTyp_key`(`users_id`, `calendar_period_id`, `termType`, `leaveType`),
    PRIMARY KEY (`leave_balance_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `probations` (
    `probation_id` INTEGER NOT NULL AUTO_INCREMENT,
    `users_id` VARCHAR(191) NOT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `probationDays` INTEGER NOT NULL,
    `status` ENUM('ACTIVE', 'COMPLETED') NOT NULL DEFAULT 'ACTIVE',
    `completionDate` DATETIME(3) NULL,
    `isEmailSent` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `probations_users_id_key`(`users_id`),
    PRIMARY KEY (`probation_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `leave_applications` ADD CONSTRAINT `leave_applications_users_id_fkey` FOREIGN KEY (`users_id`) REFERENCES `users`(`users_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leave_applications` ADD CONSTRAINT `leave_applications_calendar_period_id_fkey` FOREIGN KEY (`calendar_period_id`) REFERENCES `calendar_periods`(`calendar_period_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leave_applications` ADD CONSTRAINT `leave_applications_reviewedBy_fkey` FOREIGN KEY (`reviewedBy`) REFERENCES `users`(`users_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leave_limits` ADD CONSTRAINT `leave_limits_status_id_fkey` FOREIGN KEY (`status_id`) REFERENCES `statuses`(`status_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leave_balances` ADD CONSTRAINT `leave_balances_users_id_fkey` FOREIGN KEY (`users_id`) REFERENCES `users`(`users_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leave_balances` ADD CONSTRAINT `leave_balances_calendar_period_id_fkey` FOREIGN KEY (`calendar_period_id`) REFERENCES `calendar_periods`(`calendar_period_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leave_balances` ADD CONSTRAINT `leave_balances_status_id_fkey` FOREIGN KEY (`status_id`) REFERENCES `statuses`(`status_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `probations` ADD CONSTRAINT `probations_users_id_fkey` FOREIGN KEY (`users_id`) REFERENCES `users`(`users_id`) ON DELETE RESTRICT ON UPDATE CASCADE;
