const express = require('express');
const app = express();
const routes = require('./routes/routes');

app.use(express.json());

// Usar las rutas
app.use('/api', routes);

app.listen(3000, () => {
  console.log('Servidor corriendo en el puerto 3000');
});
