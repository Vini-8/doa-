const db = require('../database/connection');

function validarNome(nome) {
  const n = (nome || '').trim();
  if (n.length < 2 || n.length > 60) return null;
  return n;
}

async function listar(req, res, next) {
  try {
    const [rows] = await db.query('SELECT id, nome FROM categorias ORDER BY nome');
    res.json(rows);
  } catch (err) { next(err); }
}

async function criar(req, res, next) {
  try {
    const nome = validarNome(req.body.nome);
    if (!nome) return res.status(400).json({ erro: 'Nome deve ter entre 2 e 60 caracteres.' });

    const [r] = await db.query('INSERT INTO categorias (nome) VALUES (?)', [nome]);
    res.status(201).json({ id: r.insertId, nome });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ erro: 'Categoria já existe.' });
    next(err);
  }
}

async function atualizar(req, res, next) {
  try {
    const nome = validarNome(req.body.nome);
    if (!nome) return res.status(400).json({ erro: 'Nome deve ter entre 2 e 60 caracteres.' });

    const [r] = await db.query('UPDATE categorias SET nome = ? WHERE id = ?', [nome, req.params.id]);
    if (r.affectedRows === 0) return res.status(404).json({ erro: 'Categoria não encontrada.' });
    res.json({ id: Number(req.params.id), nome });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ erro: 'Categoria já existe.' });
    next(err);
  }
}

async function excluir(req, res, next) {
  try {
    const [uso] = await db.query('SELECT COUNT(*) AS total FROM doacoes WHERE categoria_id = ?', [req.params.id]);
    if (uso[0].total > 0) {
      return res.status(409).json({ erro: 'Categoria em uso por doações e não pode ser excluída.' });
    }
    const [r] = await db.query('DELETE FROM categorias WHERE id = ?', [req.params.id]);
    if (r.affectedRows === 0) return res.status(404).json({ erro: 'Categoria não encontrada.' });
    res.json({ mensagem: 'Categoria excluída.' });
  } catch (err) { next(err); }
}

module.exports = { listar, criar, atualizar, excluir };
