// Tela de doações: CRUD, reservas e filtros (DOM + Fetch). A API valida tudo novamente.
exigirLogin();
montarCabecalho();

const usuario = pegarUsuario();
const msg = document.getElementById('msg');
const lista = document.getElementById('lista');
const form = document.getElementById('form-doacao');
let editandoId = null;

const campos = ['titulo', 'categoria_id', 'quantidade', 'unidade', 'data_validade', 'local_retirada', 'descricao'];

// ---------- Categorias ----------
async function carregarCategorias() {
  const categorias = await requisicao('/categorias');
  ['categoria_id', 'f-categoria'].forEach((id) => {
    const select = document.getElementById(id);
    categorias.forEach((c) => {
      const op = document.createElement('option');
      op.value = c.id;
      op.textContent = c.nome;
      select.appendChild(op);
    });
  });
}

// ---------- Listagem (READ) ----------
async function carregarDoacoes() {
  const params = new URLSearchParams();
  const busca = document.getElementById('f-busca').value.trim();
  const categoria = document.getElementById('f-categoria').value;
  const status = document.getElementById('f-status').value;
  if (busca) params.set('busca', busca);
  if (categoria) params.set('categoria_id', categoria);
  if (status) params.set('status', status);

  try {
    const doacoes = await requisicao('/doacoes?' + params.toString());
    desenharLista(doacoes);
  } catch (erro) {
    mostrarMensagem(msg, erro.message, 'erro');
  }
}

function criarBotao(texto, classe, acao) {
  const b = document.createElement('button');
  b.textContent = texto;
  if (classe) b.className = classe;
  b.addEventListener('click', acao);
  return b;
}

function linha(texto) {
  const p = document.createElement('p');
  p.textContent = texto;
  return p;
}

function desenharLista(doacoes) {
  lista.innerHTML = '';
  if (doacoes.length === 0) {
    const vazio = document.createElement('div');
    vazio.className = 'card vazio';
    vazio.textContent = 'Nenhuma doação encontrada.';
    lista.appendChild(vazio);
    return;
  }

  doacoes.forEach((d) => {
    const card = document.createElement('div');
    card.className = 'card doacao';

    const titulo = document.createElement('h3');
    titulo.textContent = d.titulo;
    const badge = document.createElement('span');
    badge.className = 'badge ' + d.status;
    badge.textContent = d.status;
    titulo.appendChild(badge);
    card.appendChild(titulo);

    card.appendChild(linha(`${d.categoria} • ${d.quantidade} ${d.unidade} • Validade: ${formatarData(d.data_validade)}`));
    card.appendChild(linha(`Retirada: ${d.local_retirada}`));
    if (d.descricao) card.appendChild(linha(d.descricao));
    card.appendChild(linha(`Doador: ${d.doador_nome}` + (d.instituicao_nome ? ` • Reservada por: ${d.instituicao_nome}` : '')));

    const acoes = document.createElement('div');
    acoes.className = 'acoes';

    if (usuario.perfil === 'doador') {
      if (d.status === 'disponivel') {
        acoes.appendChild(criarBotao('Editar', 'secundario', () => iniciarEdicao(d)));
        acoes.appendChild(criarBotao('Excluir', 'perigo', () => excluir(d.id)));
      }
      if (d.status === 'reservada') acoes.appendChild(criarBotao('Marcar como concluída', '', () => acao(`/doacoes/${d.id}/concluir`, 'PATCH')));
    }
    if (usuario.perfil === 'instituicao') {
      if (d.status === 'disponivel') acoes.appendChild(criarBotao('Reservar', '', () => acao(`/doacoes/${d.id}/reserva`, 'POST')));
      if (d.status === 'reservada') acoes.appendChild(criarBotao('Cancelar reserva', 'perigo', () => acao(`/doacoes/${d.id}/reserva`, 'DELETE')));
    }
    if (usuario.perfil === 'admin') acoes.appendChild(criarBotao('Excluir (moderação)', 'perigo', () => excluir(d.id)));

    if (acoes.children.length) card.appendChild(acoes);
    lista.appendChild(card);
  });
}

// ---------- Ações (reservar, cancelar, concluir) ----------
async function acao(caminho, metodo) {
  try {
    const dados = await requisicao(caminho, { method: metodo });
    mostrarMensagem(msg, dados.mensagem, 'ok');
  } catch (erro) {
    mostrarMensagem(msg, erro.message, 'erro');
  }
  carregarDoacoes();
}

// ---------- DELETE ----------
async function excluir(id) {
  if (!confirm('Tem certeza que deseja excluir esta doação?')) return;
  await acao(`/doacoes/${id}`, 'DELETE');
}

// ---------- CREATE / UPDATE ----------
function lerFormulario() {
  const dados = {};
  campos.forEach((c) => { dados[c] = document.getElementById(c).value; });
  return dados;
}

function iniciarEdicao(d) {
  editandoId = d.id;
  campos.forEach((c) => { document.getElementById(c).value = d[c] ?? ''; });
  document.getElementById('titulo-form').textContent = 'Editar doação';
  document.getElementById('btn-salvar').textContent = 'Salvar alterações';
  document.getElementById('btn-cancelar-edicao').style.display = 'inline-block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function limparFormulario() {
  editandoId = null;
  form.reset();
  document.getElementById('titulo-form').textContent = 'Nova doação';
  document.getElementById('btn-salvar').textContent = 'Cadastrar doação';
  document.getElementById('btn-cancelar-edicao').style.display = 'none';
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    const url = editandoId ? `/doacoes/${editandoId}` : '/doacoes';
    const metodo = editandoId ? 'PUT' : 'POST';
    const dados = await requisicao(url, { method: metodo, body: JSON.stringify(lerFormulario()) });
    mostrarMensagem(msg, dados.mensagem, 'ok');
    limparFormulario();
    carregarDoacoes();
  } catch (erro) {
    mostrarMensagem(msg, erro.message, 'erro');
  }
});

document.getElementById('btn-cancelar-edicao').addEventListener('click', limparFormulario);
document.getElementById('btn-filtrar').addEventListener('click', carregarDoacoes);

// ---------- Início ----------
if (usuario.perfil === 'doador') document.getElementById('card-form').style.display = 'block';
carregarCategorias().then(carregarDoacoes);
