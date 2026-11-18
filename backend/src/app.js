require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const usuariosRoutes = require('./routes/usuariosRoutes');
const doacoesRoutes = require('./routes/doacoesRoutes');
const categoriasRoutes = require('./routes/categoriasRoutes');
const { rotaNaoEncontrada, tratarErros } = require('./middlewares/errorHandler');

const app = express();
app.disable('x-powered-by');

app.use(cors());
app.use(express.json());

// O front-end é servido pelo próprio Express (mesma origem da API)
app.use(express.static(path.join(__dirname, '../../frontend')));
app.get('/', (req, res) => res.redirect('/pages/index.html'));

app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/doacoes', doacoesRoutes);
app.use('/api/categorias', categoriasRoutes);

app.use('/api', rotaNaoEncontrada);
// Qualquer outro caminho (não-API) mostra a página 404 do front-end
app.use((req, res) => res.status(404).sendFile(path.join(__dirname, '../../frontend/pages/404.html')));

app.use(tratarErros);

module.exports = app;
