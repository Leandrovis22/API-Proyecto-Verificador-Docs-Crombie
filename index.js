const express = require('express');
const cors = require('cors');
const app = express();
const routes = require('./routes/routes');
const authRouter = require('./routes/authRouter');

// Configuración de CORS
app.use(cors({
  origin: '*', // Permite cualquier origen
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Métodos permitidos
  allowedHeaders: ['Content-Type', 'Authorization'], // Headers permitidos
  maxAge: 86400, // Cache preflight request por 24 horas
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Usar las rutas
app.use('/api', routes);
app.use('/auth', authRouter);

app.listen(3000, () => {
  console.log('Servidor corriendo en el puerto 3000');
});