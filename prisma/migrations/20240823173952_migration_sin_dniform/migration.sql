/*
  Warnings:

  - You are about to drop the `dniform` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `textextract` to the `usuario` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "dniform" DROP CONSTRAINT "dniform_id_usuario_fkey";

-- AlterTable
ALTER TABLE "usuario" ADD COLUMN     "textextract" JSONB NOT NULL;

-- DropTable
DROP TABLE "dniform";
