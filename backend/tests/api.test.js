// Testes automatizados da API (Node 18+). Requisitos: servidor rodando e admin criado (npm run seed:admin).
// Executar: npm test   (usa http://localhost:3000 ou a variável BASE_URL)
require('dotenv').config();
const { test, before } = require('node:test');
const assert = require('node:assert');

const BASE = (process.env.BASE_URL || 'http://localhost:3000') + '/api';
const sufixo = Date.now();
const tokens = {};
const ids = {};

async function chamar(metodo, caminho, { token, corpo } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = 'Bearer ' + token;
  const r = await fetch(BASE + caminho, { method: metodo, headers, body: corpo ? JSON.stringify(corpo) : undefined });
  return { status: r.status, dados: await r.json() };
}

function dataEm(dias) { return new Date(Date.now() + dias * 86400000).toISOString().slice(0, 10); }
const doacaoValida = () => ({ titulo: 'Pães do dia', quantidade: 10, unidade: 'un', data_validade: dataEm(5), local_retirada: 'Rua A, 1', categoria_id: 2 });

async function criarUsuario(chave, perfil) {
  const email = `${chave}${sufixo}@teste.com`;
  const r = await chamar('POST', '/auth/cadastro', { corpo: { nome: chave, email, senha: '123456', perfil, telefone: '(51) 90000-0000' } });
  assert.equal(r.status, 201);
  ids[chave] = r.dados.id;
  return email;
}

before(async () => {
  const admin = await chamar('POST', '/auth/login', { corpo: { email: process.env.ADMIN_EMAIL, senha: process.env.ADMIN_SENHA } });
  assert.equal(admin.status, 200, 'Login do admin falhou: rode npm run seed:admin e confira o .env');
  tokens.admin = admin.dados.token;

  const emails = {
    doador1: await criarUsuario('doador1', 'doador'),
    doador2: await criarUsuario('doador2', 'doador'),
    ongA: await criarUsuario('ongA', 'instituicao'),
    ongB: await criarUsuario('ongB', 'instituicao')
  };
  for (const ong of ['ongA', 'ongB']) {
    const r = await chamar('PATCH', `/usuarios/${ids[ong]}/status`, { token: tokens.admin, corpo: { status: 'ativo' } });
    assert.equal(r.status, 200);
  }
  for (const [chave, email] of Object.entries(emails)) {
    const r = await chamar('POST', '/auth/login', { corpo: { email, senha: '123456' } });
    assert.equal(r.status, 200);
    tokens[chave] = r.dados.token;
  }
});

test('autenticação: instituição pendente não faz login', async () => {
  const email = await criarUsuario('pendente', 'instituicao');
  const r = await chamar('POST', '/auth/login', { corpo: { email, senha: '123456' } });
  assert.equal(r.status, 403);
});

test('autenticação: senha errada, token ausente e token inválido', async () => {
  assert.equal((await chamar('POST', '/auth/login', { corpo: { email: 'x@y.com', senha: 'errada' } })).status, 401);
  assert.equal((await chamar('GET', '/auth/me')).status, 401);
  assert.equal((await chamar('GET', '/auth/me', { token: 'abc.def.ghi' })).status, 401);
});

test('cadastro: não permite criar admin nem senha curta', async () => {
  const base = { nome: 'X', email: `x${sufixo}@teste.com`, senha: '123456' };
  assert.equal((await chamar('POST', '/auth/cadastro', { corpo: { ...base, perfil: 'admin' } })).status, 400);
  assert.equal((await chamar('POST', '/auth/cadastro', { corpo: { ...base, senha: '123', perfil: 'doador' } })).status, 400);
});

test('permissões: apenas doador cadastra doação', async () => {
  assert.equal((await chamar('POST', '/doacoes', { token: tokens.ongA, corpo: doacaoValida() })).status, 403);
  assert.equal((await chamar('POST', '/doacoes', { token: tokens.admin, corpo: doacaoValida() })).status, 403);
  assert.equal((await chamar('POST', '/doacoes', { corpo: doacaoValida() })).status, 401);
});

test('validações: vencida, quantidade zero, categoria inválida, data inválida', async () => {
  const t = tokens.doador1;
  assert.equal((await chamar('POST', '/doacoes', { token: t, corpo: { ...doacaoValida(), data_validade: dataEm(-1) } })).status, 400);
  assert.equal((await chamar('POST', '/doacoes', { token: t, corpo: { ...doacaoValida(), quantidade: 0 } })).status, 400);
  assert.equal((await chamar('POST', '/doacoes', { token: t, corpo: { ...doacaoValida(), categoria_id: 9999 } })).status, 400);
  assert.equal((await chamar('POST', '/doacoes', { token: t, corpo: { ...doacaoValida(), data_validade: '31/12/2030' } })).status, 400);
});

test('CRUD completo + regras de edição e propriedade', async () => {
  const criada = await chamar('POST', '/doacoes', { token: tokens.doador1, corpo: doacaoValida() });
  assert.equal(criada.status, 201);
  const id = criada.dados.id;

  const lida = await chamar('GET', `/doacoes/${id}`, { token: tokens.doador1 });
  assert.equal(lida.status, 200);
  assert.equal(lida.dados.titulo, 'Pães do dia');

  assert.equal((await chamar('PUT', `/doacoes/${id}`, { token: tokens.doador1, corpo: { ...doacaoValida(), quantidade: 99 } })).status, 200);
  assert.equal((await chamar('GET', `/doacoes/${id}`, { token: tokens.doador1 })).dados.quantidade, 99);

  assert.equal((await chamar('PUT', `/doacoes/${id}`, { token: tokens.doador2, corpo: doacaoValida() })).status, 403);
  assert.equal((await chamar('DELETE', `/doacoes/${id}`, { token: tokens.doador2 })).status, 403);
  assert.equal((await chamar('DELETE', `/doacoes/${id}`, { token: tokens.ongA })).status, 403);
  assert.equal((await chamar('DELETE', `/doacoes/${id}`, { token: tokens.doador1 })).status, 200);
  assert.equal((await chamar('GET', `/doacoes/${id}`, { token: tokens.doador1 })).status, 404);
});

test('visibilidade: doador vê só as suas; instituição vê só disponíveis', async () => {
  const minha = await chamar('POST', '/doacoes', { token: tokens.doador2, corpo: { ...doacaoValida(), titulo: 'Doação do doador2' } });
  const id = minha.dados.id;
  assert.equal((await chamar('GET', `/doacoes/${id}`, { token: tokens.doador1 })).status, 404);
  const lista1 = await chamar('GET', '/doacoes', { token: tokens.doador1 });
  assert.ok(lista1.dados.every((d) => d.doador_id === ids.doador1));
  assert.equal((await chamar('GET', `/doacoes/${id}`, { token: tokens.ongA })).status, 200);
  assert.equal((await chamar('DELETE', `/doacoes/${id}`, { token: tokens.admin })).status, 200);
});

test('reserva: conflito, contatos, cancelamento, conclusão e cancelamento pelo doador', async () => {
  const { dados } = await chamar('POST', '/doacoes', { token: tokens.doador1, corpo: doacaoValida() });
  const id = dados.id;

  assert.equal((await chamar('POST', `/doacoes/${id}/reserva`, { token: tokens.doador1 })).status, 403);
  // antes da reserva, o telefone do doador não é exposto
  assert.equal((await chamar('GET', `/doacoes/${id}`, { token: tokens.ongA })).dados.doador_telefone, undefined);

  assert.equal((await chamar('POST', `/doacoes/${id}/reserva`, { token: tokens.ongA })).status, 201);
  assert.equal((await chamar('POST', `/doacoes/${id}/reserva`, { token: tokens.ongB })).status, 409);
  assert.equal((await chamar('GET', `/doacoes/${id}`, { token: tokens.ongB })).status, 404);

  // depois da reserva, os dois lados veem o contato um do outro
  assert.ok((await chamar('GET', `/doacoes/${id}`, { token: tokens.ongA })).dados.doador_telefone);
  assert.ok((await chamar('GET', `/doacoes/${id}`, { token: tokens.doador1 })).dados.instituicao_telefone);

  assert.equal((await chamar('PUT', `/doacoes/${id}`, { token: tokens.doador1, corpo: doacaoValida() })).status, 409);
  assert.equal((await chamar('DELETE', `/doacoes/${id}`, { token: tokens.doador1 })).status, 409);
  assert.equal((await chamar('DELETE', `/doacoes/${id}/reserva`, { token: tokens.ongB })).status, 403);

  assert.equal((await chamar('DELETE', `/doacoes/${id}/reserva`, { token: tokens.ongA })).status, 200);
  assert.equal((await chamar('POST', `/doacoes/${id}/reserva`, { token: tokens.ongB })).status, 201);

  assert.equal((await chamar('PATCH', `/doacoes/${id}/concluir`, { token: tokens.doador2 })).status, 403);
  assert.equal((await chamar('PATCH', `/doacoes/${id}/concluir`, { token: tokens.doador1 })).status, 200);
  assert.equal((await chamar('PATCH', `/doacoes/${id}/concluir`, { token: tokens.doador1 })).status, 409);
  assert.equal((await chamar('PATCH', `/doacoes/${id}/cancelar`, { token: tokens.doador1 })).status, 409);

  // doação reservada cancelada pelo doador libera a reserva
  const outra = (await chamar('POST', '/doacoes', { token: tokens.doador1, corpo: doacaoValida() })).dados.id;
  await chamar('POST', `/doacoes/${outra}/reserva`, { token: tokens.ongA });
  assert.equal((await chamar('PATCH', `/doacoes/${outra}/cancelar`, { token: tokens.doador2 })).status, 403);
  assert.equal((await chamar('PATCH', `/doacoes/${outra}/cancelar`, { token: tokens.doador1 })).status, 200);
  assert.equal((await chamar('GET', `/doacoes/${outra}`, { token: tokens.doador1 })).dados.status, 'cancelada');
});

test('administração: apenas admin acessa usuários e categorias', async () => {
  assert.equal((await chamar('GET', '/usuarios', { token: tokens.doador1 })).status, 403);
  assert.equal((await chamar('GET', '/usuarios', { token: tokens.admin })).status, 200);
  assert.equal((await chamar('POST', '/categorias', { token: tokens.doador1, corpo: { nome: 'X' } })).status, 403);
  const nome = 'Categoria ' + sufixo;
  const nova = await chamar('POST', '/categorias', { token: tokens.admin, corpo: { nome } });
  assert.equal(nova.status, 201);
  assert.equal((await chamar('POST', '/categorias', { token: tokens.admin, corpo: { nome } })).status, 409);
  assert.equal((await chamar('DELETE', `/categorias/${nova.dados.id}`, { token: tokens.admin })).status, 200);
});

test('usuário bloqueado perde acesso imediatamente, mesmo com token válido', async () => {
  const r = await chamar('PATCH', `/usuarios/${ids.doador2}/status`, { token: tokens.admin, corpo: { status: 'bloqueado' } });
  assert.equal(r.status, 200);
  assert.equal((await chamar('GET', '/auth/me', { token: tokens.doador2 })).status, 403);
});

test('erros: rota inexistente, ID inválido e JSON malformado', async () => {
  assert.equal((await chamar('GET', '/nada')).status, 404);
  assert.equal((await chamar('GET', '/doacoes/abc', { token: tokens.doador1 })).status, 400);
  const r = await fetch(BASE + '/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{quebrado' });
  assert.equal(r.status, 400);
});
