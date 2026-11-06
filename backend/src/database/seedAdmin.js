// Cria (ou atualiza a senha de) o usuário administrador a partir do .env
require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./connection');

async function main() {
  const { ADMIN_NOME, ADMIN_EMAIL, ADMIN_SENHA } = process.env;
  if (!ADMIN_EMAIL || !ADMIN_SENHA) {
    console.error('Defina ADMIN_EMAIL e ADMIN_SENHA no .env');
    process.exit(1);
  }
  const hash = await bcrypt.hash(ADMIN_SENHA, 10);
  await db.query(
    `INSERT INTO usuarios (nome, email, senha_hash, perfil_id, status)
     VALUES (?, ?, ?, (SELECT id FROM perfis WHERE nome = 'admin'), 'ativo')
     ON DUPLICATE KEY UPDATE senha_hash = VALUES(senha_hash)`,
    [ADMIN_NOME || 'Administrador', ADMIN_EMAIL.toLowerCase(), hash]
  );
  console.log('Administrador pronto:', ADMIN_EMAIL);
  await db.end();
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
