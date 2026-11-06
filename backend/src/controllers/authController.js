const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database/connection');

const PERFIS_PUBLICOS = ['doador', 'instituicao']; // admin nunca pode ser criado pelo cadastro
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function cadastrar(req, res, next) {
  try {
    const { nome, email, senha, telefone, perfil } = req.body;

    if (!nome || !email || !senha || !perfil) {
      return res.status(400).json({ erro: 'Informe nome, email, senha e perfil.' });
    }
    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ erro: 'Email inválido.' });
    }
    if (senha.length < 6) {
      return res.status(400).json({ erro: 'A senha deve ter pelo menos 6 caracteres.' });
    }
    if (!PERFIS_PUBLICOS.includes(perfil)) {
      return res.status(400).json({ erro: 'Perfil deve ser "doador" ou "instituicao".' });
    }

    const emailNorm = email.trim().toLowerCase();
    const [existe] = await db.query('SELECT id FROM usuarios WHERE email = ?', [emailNorm]);
    if (existe.length > 0) {
      return res.status(409).json({ erro: 'Este email já está cadastrado.' });
    }

    const senhaHash = await bcrypt.hash(senha, 10);
    // Instituições precisam ser aprovadas pelo admin; doadores entram ativos
    const status = perfil === 'instituicao' ? 'pendente' : 'ativo';

    const [resultado] = await db.query(
      `INSERT INTO usuarios (nome, email, senha_hash, telefone, perfil_id, status)
       VALUES (?, ?, ?, ?, (SELECT id FROM perfis WHERE nome = ?), ?)`,
      [nome.trim(), emailNorm, senhaHash, telefone || null, perfil, status]
    );

    const mensagem =
      status === 'pendente'
        ? 'Cadastro realizado. Aguarde a aprovação do administrador para acessar.'
        : 'Cadastro realizado com sucesso.';

    res.status(201).json({ mensagem, id: resultado.insertId, status });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, senha } = req.body;
    if (!email || !senha) {
      return res.status(400).json({ erro: 'Informe email e senha.' });
    }

    const [rows] = await db.query(
      `SELECT u.id, u.nome, u.email, u.senha_hash, u.status, p.nome AS perfil
       FROM usuarios u JOIN perfis p ON p.id = u.perfil_id
       WHERE u.email = ?`,
      [email.trim().toLowerCase()]
    );
    const usuario = rows[0];

    // Mesma mensagem para email ou senha errados (não revela qual deles falhou)
    const senhaOk = usuario && (await bcrypt.compare(senha, usuario.senha_hash));
    if (!senhaOk) {
      return res.status(401).json({ erro: 'Email ou senha incorretos.' });
    }

    if (usuario.status === 'pendente') {
      return res.status(403).json({ erro: 'Seu cadastro ainda aguarda aprovação.' });
    }
    if (usuario.status === 'bloqueado') {
      return res.status(403).json({ erro: 'Seu acesso foi bloqueado.' });
    }

    const token = jwt.sign(
      { id: usuario.id, perfil: usuario.perfil },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '2h' }
    );

    res.json({
      token,
      usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, perfil: usuario.perfil }
    });
  } catch (err) {
    next(err);
  }
}

async function perfilLogado(req, res, next) {
  try {
    const [rows] = await db.query(
      `SELECT u.id, u.nome, u.email, u.telefone, u.status, p.nome AS perfil
       FROM usuarios u JOIN perfis p ON p.id = u.perfil_id
       WHERE u.id = ?`,
      [req.usuario.id]
    );
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

module.exports = { cadastrar, login, perfilLogado };
