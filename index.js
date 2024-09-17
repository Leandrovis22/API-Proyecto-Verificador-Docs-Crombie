const express = require('express');
const app = express();
const routes = require('./routes/routes');
const authRouter = require('./routes/authRouter')

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Usar las rutas
app.use('/api', routes);
app.use('/auth', authRouter);

app.listen(3000, () => {
  console.log('Servidor corriendo en el puerto 3000');
});
