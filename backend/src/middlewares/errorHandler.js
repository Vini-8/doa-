function rotaNaoEncontrada(req, res) {
  res.status(404).json({ erro: 'Rota não encontrada.' });
}

// eslint-disable-next-line no-unused-vars
function tratarErros(err, req, res, next) {
  console.error(err);
  res.status(500).json({ erro: 'Erro interno do servidor.' });
}

module.exports = { rotaNaoEncontrada, tratarErros };
