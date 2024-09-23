/*
  Warnings:

  - You are about to drop the column `msqError` on the `Tiqueteria` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Tiqueteria" DROP COLUMN "msqError",
ADD COLUMN     "resultado" JSONB;
