-- CreateTable
CREATE TABLE `users` (
    `users_id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NULL,
    `name` VARCHAR(191) NOT NULL,
    `firstName` VARCHAR(191) NULL,
    `lastName` VARCHAR(191) NULL,
    `middleName` VARCHAR(191) NULL,
    `suffix` VARCHAR(191) NULL,
    `profilePicture` VARCHAR(191) NULL DEFAULT 'ckcm.png',
    `role` ENUM('ADMIN', 'NON_TEACHING_PERSONNEL', 'DEAN_PROGRAM_HEAD', 'FINANCE_DEPARTMENT', 'TEACHER') NOT NULL DEFAULT 'TEACHER',
    `department` ENUM('GUIDANCE_OFFICE', 'MAINTENANCE_OFFICE', 'REGISTRAR_OFFICE', 'FINANCE_OFFICE', 'BACHELOR_OF_ARTS_IN_ENGLISH_LITERATURE', 'BACHELOR_OF_SCIENCE_IN_BUSINESS_ADMINISTRATION', 'BACHELOR_OF_SCIENCE_IN_COMPUTER_SCIENCE', 'BACHELOR_OF_SCIENCE_IN_CRIMINOLOGY', 'BACHELOR_OF_SCIENCE_IN_EDUCATION', 'BACHELOR_OF_SCIENCE_IN_SOCIAL_WORK') NULL,
    `isDepartmentHead` BOOLEAN NOT NULL DEFAULT false,
    `status` ENUM('PROBATION', 'REGULAR') NOT NULL DEFAULT 'PROBATION',
    `isEmailVerified` BOOLEAN NOT NULL DEFAULT false,
    `emailVerifiedAt` DATETIME(3) NULL,
    `resetToken` VARCHAR(191) NULL,
    `resetTokenExpiry` DATETIME(3) NULL,
    `loginAttempts` INTEGER NOT NULL DEFAULT 0,
    `lockUntil` DATETIME(3) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    UNIQUE INDEX `users_resetToken_key`(`resetToken`),
    PRIMARY KEY (`users_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `accounts` (
    `accounts_id` VARCHAR(191) NOT NULL,
    `users_id` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `provider` VARCHAR(191) NOT NULL,
    `providerAccountId` VARCHAR(191) NOT NULL,
    `refresh_token` TEXT NULL,
    `access_token` TEXT NULL,
    `expires_at` INTEGER NULL,
    `token_type` VARCHAR(191) NULL,
    `scope` VARCHAR(191) NULL,
    `id_token` TEXT NULL,
    `session_state` VARCHAR(191) NULL,

    UNIQUE INDEX `accounts_provider_providerAccountId_key`(`provider`, `providerAccountId`),
    PRIMARY KEY (`accounts_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sessions` (
    `sessions_id` VARCHAR(191) NOT NULL,
    `sessionToken` VARCHAR(191) NOT NULL,
    `users_id` VARCHAR(191) NOT NULL,
    `expires` DATETIME(3) NOT NULL,

    UNIQUE INDEX `sessions_sessionToken_key`(`sessionToken`),
    PRIMARY KEY (`sessions_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `verification_tokens` (
    `verification_tokens_id` VARCHAR(191) NOT NULL,
    `identifier` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `expires` DATETIME(3) NOT NULL,

    UNIQUE INDEX `verification_tokens_token_key`(`token`),
    UNIQUE INDEX `verification_tokens_identifier_token_key`(`identifier`, `token`),
    PRIMARY KEY (`verification_tokens_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `accounts` ADD CONSTRAINT `accounts_users_id_fkey` FOREIGN KEY (`users_id`) REFERENCES `users`(`users_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sessions` ADD CONSTRAINT `sessions_users_id_fkey` FOREIGN KEY (`users_id`) REFERENCES `users`(`users_id`) ON DELETE CASCADE ON UPDATE CASCADE;
