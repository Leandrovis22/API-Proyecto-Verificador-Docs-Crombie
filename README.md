# Instrucciones

**Instalar dependencias:** npm i

**Migrar la base de datos:** npx prisma migrate dev

**Generar el cliente de Prisma:** npx prisma generate

**Configurar variables de entorno:** Crear un archivo .env con las siguientes variables:

AWS_REGION="tu-region"
AWS_ACCESS_KEY_ID="tu-access-key-id"
AWS_SECRET_ACCESS_KEY="tu-secret-access-key"
AWS_BUCKET_NAME="tu-bucket-name"
JWT_SECRET="tu-jwt-secret"

**Iniciar el servidor:** nodemon index.js

**Pruebas con Postman:** Instalar Postman. Importar los requests desde "API CROMBIE.postman_collection". Probar los requests.

# Overview del proyecto

# Registro de Usuarios

- **Registra nuevos usuarios:** Guarda los datos del usuario recien creado, sube imágenes del DNI a AWS S3 y devuelve un token JWT.

# Inicio de Sesión

- **Verifica credenciales:** Genera y retorna un token JWT para acceso a rutas protegidas.

# Actualización de Usuarios

- **Gestión completa de usuarios:** Permite obtener, actualizar (cada campo opcionalmente) y eliminar usuarios, incluyendo la obtención y eliminación de imágenes en S3.

# Acceso a Imágenes del DNI

- **URLs firmadas:** Genera URLs firmadas para acceder a las imágenes del DNI almacenadas en AWS S3.

# Tecnologías Utilizadas

- **Backend:** Node.js con Express.js
- **ORM:** Prisma ORM
- **Seguridad:** bcryptjs, jsonwebtoken

# Almacenamiento

- **Servicio:** AWS S3
- **Paquetes:** 
  - `@aws-sdk/client-s3`
  - `@aws-sdk/s3-request-presigner`

# Middleware

- **Archivos:** Multer
- **Autenticación:** JWT Middleware