const express = require('express');
const app = express();
const routes = require('./routes/routes');

app.use(express.json());

// Usar las rutas
app.use('/api', routes);

app.listen(8080, () => {
  console.log('Servidor corriendo en el puerto 8080');
});
