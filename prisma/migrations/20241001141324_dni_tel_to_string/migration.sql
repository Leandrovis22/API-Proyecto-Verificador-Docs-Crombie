-- AlterTable
ALTER TABLE "Tiqueteria" ADD COLUMN     "msqError" TEXT;

-- AlterTable
ALTER TABLE "Usuario" ALTER COLUMN "dni" SET DATA TYPE TEXT,
ALTER COLUMN "telefono" SET DATA TYPE TEXT;
