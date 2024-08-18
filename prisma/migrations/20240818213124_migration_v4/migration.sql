-- CreateTable
CREATE TABLE "Login" (
    "id" SERIAL NOT NULL,
    "dni" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "pass" TEXT NOT NULL,

    CONSTRAINT "Login_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Form" (
    "id" SERIAL NOT NULL,
    "dni_ref" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "cuil" TEXT NOT NULL,
    "json_dni" JSONB NOT NULL,
    "id_login" INTEGER NOT NULL,
    "documento" TEXT NOT NULL,

    CONSTRAINT "Form_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Login_dni_key" ON "Login"("dni");

-- CreateIndex
CREATE UNIQUE INDEX "Login_correo_key" ON "Login"("correo");

-- CreateIndex
CREATE INDEX "Form_id_login_idx" ON "Form"("id_login");

-- AddForeignKey
ALTER TABLE "Form" ADD CONSTRAINT "Form_id_login_fkey" FOREIGN KEY ("id_login") REFERENCES "Login"("id") ON DELETE CASCADE ON UPDATE CASCADE;
