/*
  Warnings:

  - Added the required column `verificacion_log` to the `usuario` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "usuario" ADD COLUMN     "verificacion_log" JSONB NOT NULL;
