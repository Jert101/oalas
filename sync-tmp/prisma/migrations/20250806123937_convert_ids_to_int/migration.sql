/*
  Warnings:

  - The primary key for the `departments` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `department_id` on the `departments` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - The primary key for the `roles` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `role_id` on the `roles` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - The primary key for the `statuses` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `status_id` on the `statuses` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - You are about to alter the column `department_id` on the `users` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - You are about to alter the column `role_id` on the `users` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - You are about to alter the column `status_id` on the `users` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.

*/
-- DropForeignKey
ALTER TABLE `users` DROP FOREIGN KEY `users_department_id_fkey`;

-- DropForeignKey
ALTER TABLE `users` DROP FOREIGN KEY `users_role_id_fkey`;

-- DropForeignKey
ALTER TABLE `users` DROP FOREIGN KEY `users_status_id_fkey`;

-- DropIndex
DROP INDEX `users_department_id_fkey` ON `users`;

-- DropIndex
DROP INDEX `users_role_id_fkey` ON `users`;

-- DropIndex
DROP INDEX `users_status_id_fkey` ON `users`;

-- AlterTable
ALTER TABLE `departments` DROP PRIMARY KEY,
    MODIFY `department_id` INTEGER NOT NULL AUTO_INCREMENT,
    ADD PRIMARY KEY (`department_id`);

-- AlterTable
ALTER TABLE `roles` DROP PRIMARY KEY,
    MODIFY `role_id` INTEGER NOT NULL AUTO_INCREMENT,
    ADD PRIMARY KEY (`role_id`);

-- AlterTable
ALTER TABLE `statuses` DROP PRIMARY KEY,
    MODIFY `status_id` INTEGER NOT NULL AUTO_INCREMENT,
    ADD PRIMARY KEY (`status_id`);

-- AlterTable
ALTER TABLE `users` MODIFY `department_id` INTEGER NULL,
    MODIFY `role_id` INTEGER NULL,
    MODIFY `status_id` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `roles`(`role_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_department_id_fkey` FOREIGN KEY (`department_id`) REFERENCES `departments`(`department_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_status_id_fkey` FOREIGN KEY (`status_id`) REFERENCES `statuses`(`status_id`) ON DELETE SET NULL ON UPDATE CASCADE;
