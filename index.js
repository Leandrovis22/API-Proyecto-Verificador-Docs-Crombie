const express = require('express');
const app = express();
const routes = require('./routes/routes');
const authRouter = require('./routes/authRouter')

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  res.append('Access-Control-Allow-Origin', ['*']);
  res.append('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.append('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Usar las rutas
app.use('/api', routes);
app.use('/auth', authRouter);

app.listen(3000, () => {
  console.log('Servidor corriendo en el puerto 3000');
});
