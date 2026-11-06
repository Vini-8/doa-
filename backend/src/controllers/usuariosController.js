const db = require('../database/connection');

const STATUS_VALIDOS = ['pendente', 'ativo', 'bloqueado'];

// Lista usuários (admin). Filtros opcionais: ?status=pendente&perfil=instituicao
async function listar(req, res, next) {
  try {
    const { status, perfil } = req.query;
    const filtros = [];
    const valores = [];

    if (status) { filtros.push('u.status = ?'); valores.push(status); }
    if (perfil) { filtros.push('p.nome = ?');   valores.push(perfil); }

    const where = filtros.length ? 'WHERE ' + filtros.join(' AND ') : '';
    const [rows] = await db.query(
      `SELECT u.id, u.nome, u.email, u.telefone, u.status, u.criado_em, p.nome AS perfil
       FROM usuarios u JOIN perfis p ON p.id = u.perfil_id
       ${where}
       ORDER BY u.criado_em DESC`,
      valores
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

// Aprova, bloqueia ou reativa um usuário (admin)
async function atualizarStatus(req, res, next) {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;

    if (!STATUS_VALIDOS.includes(status)) {
      return res.status(400).json({ erro: 'Status deve ser: ' + STATUS_VALIDOS.join(', ') });
    }
    if (id === req.usuario.id) {
      return res.status(400).json({ erro: 'Você não pode alterar o seu próprio status.' });
    }

    const [resultado] = await db.query('UPDATE usuarios SET status = ? WHERE id = ?', [status, id]);
    if (resultado.affectedRows === 0) {
      return res.status(404).json({ erro: 'Usuário não encontrado.' });
    }
    res.json({ mensagem: 'Status atualizado.', id, status });
  } catch (err) {
    next(err);
  }
}

module.exports = { listar, atualizarStatus };
