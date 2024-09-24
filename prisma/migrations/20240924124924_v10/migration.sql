-- DropForeignKey
ALTER TABLE "Dni" DROP CONSTRAINT "Dni_tiqueteriaId_fkey";

-- DropForeignKey
ALTER TABLE "Tiqueteria" DROP CONSTRAINT "Tiqueteria_usuarioId_fkey";

-- AddForeignKey
ALTER TABLE "Tiqueteria" ADD CONSTRAINT "Tiqueteria_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dni" ADD CONSTRAINT "Dni_tiqueteriaId_fkey" FOREIGN KEY ("tiqueteriaId") REFERENCES "Tiqueteria"("id") ON DELETE CASCADE ON UPDATE CASCADE;
