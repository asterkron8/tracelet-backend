const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Conectar a la Base de Datos (MongoDB)
mongoose.connect('mongodb://localhost:27017/traceletDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("MongoDB Conectado"))
  .catch(err => console.log(err));

// Middlewares
app.use(cors());
app.use(express.json());

// Definir Rutas
app.use('/api/auth', require('./routes/auth'));
app.use('/api', require('./routes/api'));

// Iniciar el Servidor
const PORT = 5000;
app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));