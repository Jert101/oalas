ALTER TABLE `account_setup_requests`
  ADD COLUMN `display_name` VARCHAR(191) NULL AFTER `email`,
  ADD COLUMN `picture` VARCHAR(512) NULL AFTER `display_name`,
  ADD COLUMN `gender` VARCHAR(32) NULL AFTER `picture`;










