/*
  Warnings:

  - You are about to drop the `usuario` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "usuario";

-- CreateTable
CREATE TABLE "Usuarios" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "dni" BIGINT NOT NULL,
    "cuil" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "telefono" BIGINT NOT NULL,
    "fecha_nacimiento" TEXT NOT NULL,
    "dni_foto_delante" TEXT NOT NULL,
    "dni_foto_detras" TEXT NOT NULL,
    "textextract" JSONB NOT NULL,

    CONSTRAINT "Usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tiqueteria" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estado" VARCHAR(50) NOT NULL DEFAULT 'pendiente',
    "monto_prestamo" DOUBLE PRECISION NOT NULL,
    "numero_ticket" INTEGER NOT NULL,

    CONSTRAINT "Tiqueteria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Personas" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "apellido" VARCHAR(100) NOT NULL,
    "dni" BIGINT NOT NULL,
    "cuil" VARCHAR(20) NOT NULL,
    "fecha_nac" TIMESTAMP(3) NOT NULL,
    "foto_dni_frente" VARCHAR(255) NOT NULL,
    "foto_dni_atras" VARCHAR(255) NOT NULL,
    "tiqueteria_id" INTEGER NOT NULL,

    CONSTRAINT "Personas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuarios_dni_key" ON "Usuarios"("dni");

-- CreateIndex
CREATE UNIQUE INDEX "Usuarios_correo_key" ON "Usuarios"("correo");

-- CreateIndex
CREATE UNIQUE INDEX "Tiqueteria_usuario_id_numero_ticket_key" ON "Tiqueteria"("usuario_id", "numero_ticket");

-- CreateIndex
CREATE UNIQUE INDEX "Personas_dni_key" ON "Personas"("dni");

-- AddForeignKey
ALTER TABLE "Tiqueteria" ADD CONSTRAINT "Tiqueteria_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "Usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Personas" ADD CONSTRAINT "Personas_tiqueteria_id_fkey" FOREIGN KEY ("tiqueteria_id") REFERENCES "Tiqueteria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
