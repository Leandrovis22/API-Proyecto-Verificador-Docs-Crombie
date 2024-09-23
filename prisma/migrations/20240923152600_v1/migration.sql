-- CreateTable
CREATE TABLE "Usuario" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "dni" BIGINT NOT NULL,
    "cuil" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "telefono" BIGINT NOT NULL,
    "rol" TEXT NOT NULL DEFAULT 'usuario',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tiqueteria" (
    "id" SERIAL NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estado" TEXT NOT NULL DEFAULT 'pendiente',
    "monto" DOUBLE PRECISION NOT NULL DEFAULT 0.00,
    "resultado" JSONB,

    CONSTRAINT "Tiqueteria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dni" (
    "id" SERIAL NOT NULL,
    "fotoFrente" TEXT NOT NULL,
    "fotoDetras" TEXT NOT NULL,
    "resTextract" JSONB NOT NULL,
    "tiqueteriaId" INTEGER NOT NULL,

    CONSTRAINT "Dni_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_dni_key" ON "Usuario"("dni");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_cuil_key" ON "Usuario"("cuil");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_correo_key" ON "Usuario"("correo");

-- CreateIndex
CREATE UNIQUE INDEX "Dni_tiqueteriaId_key" ON "Dni"("tiqueteriaId");

-- AddForeignKey
ALTER TABLE "Tiqueteria" ADD CONSTRAINT "Tiqueteria_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dni" ADD CONSTRAINT "Dni_tiqueteriaId_fkey" FOREIGN KEY ("tiqueteriaId") REFERENCES "Tiqueteria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
