function rotaNaoEncontrada(req, res) {
  res.status(404).json({ erro: 'Rota não encontrada.' });
}

// eslint-disable-next-line no-unused-vars
function tratarErros(err, req, res, next) {
  // JSON malformado enviado pelo cliente
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ erro: 'JSON inválido no corpo da requisição.' });
  }
  console.error(err);
  res.status(500).json({ erro: 'Erro interno do servidor.' });
}

module.exports = { rotaNaoEncontrada, tratarErros };
