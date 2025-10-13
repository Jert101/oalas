CREATE TABLE IF NOT EXISTS `account_setup_requests` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `email` VARCHAR(191) NOT NULL,
  `school_id` VARCHAR(191) NOT NULL,
  `department_id` INT NOT NULL,
  `role_id` INT NOT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'pending',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `account_setup_requests_email_idx` (`email`),
  INDEX `account_setup_requests_status_idx` (`status`),
  INDEX `account_setup_requests_created_at_idx` (`created_at`),
  CONSTRAINT `account_setup_requests_department_id_fkey`
    FOREIGN KEY (`department_id`) REFERENCES `departments`(`department_id`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `account_setup_requests_role_id_fkey`
    FOREIGN KEY (`role_id`) REFERENCES `roles`(`role_id`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;










