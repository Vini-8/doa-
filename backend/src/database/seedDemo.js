// Dados de demonstração (apenas para desenvolvimento/apresentação). Uso: npm run seed:demo
// Cria 2 doadores, 2 instituições (ativas) e algumas doações. Senha de todos: demo123
require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./connection');

const SENHA = 'demo123';
const usuarios = [
  ['Padaria Pão Quente', 'doador@demo.com', '(51) 99999-1111', 'doador'],
  ['Mercado Bom Preço', 'mercado@demo.com', '(51) 99999-2222', 'doador'],
  ['ONG Mesa Cheia', 'instituicao@demo.com', '(51) 98888-1111', 'instituicao'],
  ['Abrigo Esperança', 'abrigo@demo.com', '(51) 98888-2222', 'instituicao']
];

function diasAFrente(n) {
  return new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);
}

async function main() {
  const hash = await bcrypt.hash(SENHA, 10);
  for (const [nome, email, telefone, perfil] of usuarios) {
    await db.query(
      `INSERT IGNORE INTO usuarios (nome, email, senha_hash, telefone, perfil_id, status)
       VALUES (?, ?, ?, ?, (SELECT id FROM perfis WHERE nome = ?), 'ativo')`,
      [nome, email, hash, telefone, perfil]
    );
  }

  const [[padaria]] = await db.query("SELECT id FROM usuarios WHERE email = 'doador@demo.com'");
  const [[mercado]] = await db.query("SELECT id FROM usuarios WHERE email = 'mercado@demo.com'");
  const [[existe]] = await db.query('SELECT COUNT(*) AS total FROM doacoes WHERE doador_id IN (?, ?)', [padaria.id, mercado.id]);

  if (existe.total === 0) {
    const doacoes = [
      ['Pães franceses do dia', 'Sobras do dia, ainda frescos', 30, 'un', diasAFrente(1), 'Av. Central, 120', 2, padaria.id],
      ['Bolos de fubá', null, 8, 'un', diasAFrente(3), 'Av. Central, 120', 2, padaria.id],
      ['Caixa de bananas', 'Maduras, ótimas para consumo imediato', 12, 'kg', diasAFrente(2), 'Rua das Flores, 45', 1, mercado.id],
      ['Arroz 5kg (embalagem avariada)', 'Produto íntegro, só a embalagem amassou', 15, 'un', diasAFrente(60), 'Rua das Flores, 45', 3, mercado.id],
      ['Iogurtes próximos da validade', null, 40, 'un', diasAFrente(4), 'Rua das Flores, 45', 4, mercado.id]
    ];
    for (const d of doacoes) {
      await db.query(
        `INSERT INTO doacoes (titulo, descricao, quantidade, unidade, data_validade, local_retirada, categoria_id, doador_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, d);
    }
  }
  console.log('Dados de demonstração prontos. Logins: doador@demo.com, mercado@demo.com, instituicao@demo.com, abrigo@demo.com (senha: ' + SENHA + ')');
  await db.end();
}

main().catch((err) => { console.error(err.message); process.exit(1); });
