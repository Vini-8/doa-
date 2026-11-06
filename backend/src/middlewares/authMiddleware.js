const jwt = require('jsonwebtoken');
const db = require('../database/connection');

// Valida o token JWT enviado no header "Authorization: Bearer <token>"
async function autenticar(req, res, next) {
  const header = req.headers.authorization || '';
  const [tipo, token] = header.split(' ');

  if (tipo !== 'Bearer' || !token) {
    return res.status(401).json({ erro: 'Token não informado.' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // Confere no banco se o usuário continua ativo (ex.: não foi bloqueado depois do login)
    const [rows] = await db.query(
      `SELECT u.id, u.status, p.nome AS perfil
       FROM usuarios u JOIN perfis p ON p.id = u.perfil_id
       WHERE u.id = ?`,
      [payload.id]
    );
    const usuario = rows[0];

    if (!usuario || usuario.status !== 'ativo') {
      return res.status(403).json({ erro: 'Usuário inativo ou inexistente.' });
    }

    req.usuario = { id: usuario.id, perfil: usuario.perfil };
    next();
  } catch (err) {
    return res.status(401).json({ erro: 'Token inválido ou expirado.' });
  }
}

module.exports = autenticar;
