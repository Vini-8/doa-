// Comunicação com a API via Fetch + utilidades de sessão (token JWT no localStorage)
const API = '/api';

function salvarSessao(token, usuario) {
  localStorage.setItem('token', token);
  localStorage.setItem('usuario', JSON.stringify(usuario));
}
function pegarToken() { return localStorage.getItem('token'); }
function pegarUsuario() { return JSON.parse(localStorage.getItem('usuario') || 'null'); }
function sair() {
  localStorage.clear();
  window.location.href = '/pages/login.html';
}

// Faz a requisição, envia o token (se existir) e lança erro com a mensagem da API
async function requisicao(caminho, opcoes = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = pegarToken();
  if (token) headers.Authorization = 'Bearer ' + token;

  const resposta = await fetch(API + caminho, { ...opcoes, headers });
  const dados = await resposta.json();

  if (resposta.status === 401 && token) { sair(); }
  if (!resposta.ok) throw new Error(dados.erro || 'Erro na requisição.');
  return dados;
}

function mostrarMensagem(elemento, texto, tipo) {
  elemento.textContent = texto;
  elemento.className = 'msg ' + tipo;
}

// ---- Utilidades compartilhadas pelas páginas internas ----
function exigirLogin() {
  if (!pegarToken() || !pegarUsuario()) window.location.href = '/pages/login.html';
}

function formatarData(texto) {            // "2026-11-20" -> "20/11/2026"
  if (!texto) return '';
  const [ano, mes, dia] = texto.slice(0, 10).split('-');
  return `${dia}/${mes}/${ano}`;
}

function montarCabecalho() {
  const u = pegarUsuario();
  document.getElementById('saudacao').textContent = `${u.nome} (${u.perfil})`;
  document.getElementById('btn-sair').addEventListener('click', (e) => { e.preventDefault(); sair(); });
}
