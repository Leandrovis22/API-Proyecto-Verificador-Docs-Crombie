-- CreateTable
CREATE TABLE `Login` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `dni` VARCHAR(191) NOT NULL,
    `correo` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `pass` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Login_dni_key`(`dni`),
    UNIQUE INDEX `Login_correo_key`(`correo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Form` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `dni_ref` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `cuil` VARCHAR(191) NOT NULL,
    `json_dni` JSON NOT NULL,
    `id_login` INTEGER NOT NULL,
    `documento` VARCHAR(191) NOT NULL,

    INDEX `Form_id_login_idx`(`id_login`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Form` ADD CONSTRAINT `Form_id_login_fkey` FOREIGN KEY (`id_login`) REFERENCES `Login`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
