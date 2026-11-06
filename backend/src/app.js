require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const usuariosRoutes = require('./routes/usuariosRoutes');
const { rotaNaoEncontrada, tratarErros } = require('./middlewares/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());

// O front-end é servido pelo próprio Express (mesma origem da API)
app.use(express.static(path.join(__dirname, '../../frontend')));
app.get('/', (req, res) => res.redirect('/pages/index.html'));

app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuariosRoutes);

app.use('/api', rotaNaoEncontrada);
app.use(tratarErros);

module.exports = app;
