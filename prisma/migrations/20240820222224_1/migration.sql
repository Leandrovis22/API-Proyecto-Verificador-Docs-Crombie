-- CreateTable
CREATE TABLE "usuario" (
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

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dniform" (
    "id" SERIAL NOT NULL,
    "dni_form" BIGINT NOT NULL,
    "cuil" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "fecha_nacimiento" TEXT NOT NULL,
    "dni_foto_delante" TEXT NOT NULL,
    "dni_foto_detras" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "id_usuario" INTEGER NOT NULL,

    CONSTRAINT "dniform_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuario_dni_key" ON "usuario"("dni");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_correo_key" ON "usuario"("correo");

-- AddForeignKey
ALTER TABLE "dniform" ADD CONSTRAINT "dniform_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
