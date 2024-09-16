/*
  Warnings:

  - You are about to drop the column `dni_foto_delante` on the `usuario` table. All the data in the column will be lost.
  - You are about to drop the column `dni_foto_detras` on the `usuario` table. All the data in the column will be lost.
  - You are about to drop the column `textextract` on the `usuario` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "usuario" DROP COLUMN "dni_foto_delante",
DROP COLUMN "dni_foto_detras",
DROP COLUMN "textextract";
