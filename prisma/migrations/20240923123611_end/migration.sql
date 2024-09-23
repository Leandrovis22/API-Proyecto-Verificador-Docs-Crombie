/*
  Warnings:

  - You are about to drop the column `mail` on the `Usuario` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[correo]` on the table `Usuario` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `correo` to the `Usuario` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Usuario_mail_key";

-- AlterTable
ALTER TABLE "Usuario" DROP COLUMN "mail",
ADD COLUMN     "correo" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_correo_key" ON "Usuario"("correo");
