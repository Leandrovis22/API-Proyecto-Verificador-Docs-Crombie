const express = require('express');
const cors = require('cors');
const app = express();
const routes = require('./routes/routes');
const authRouter = require('./routes/authRouter');

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', routes);
app.use('/auth', authRouter);

app.listen(3000, () => {
  console.log('Servidor corriendo en el puerto 3000');
});