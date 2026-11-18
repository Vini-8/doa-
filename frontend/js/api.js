// Comunicação com a API via Fetch + utilidades de sessão (token JWT no localStorage)
const API = '/api';

function salvarSessao(token, usuario) {
  localStorage.setItem('token', token);
  localStorage.setItem('usuario', JSON.stringify(usuario));
}
function pegarToken() { return localStorage.getItem('token'); }
function pegarUsuario() { return JSON.parse(localStorage.getItem('usuario') || 'null'); }
function sair(motivo) {
  localStorage.clear();
  window.location.href = '/pages/login.html' + (motivo ? '?aviso=' + motivo : '');
}

// Faz a requisição, envia o token (se existir) e lança erro com a mensagem da API.
// Tratamento de erros: servidor fora do ar, resposta sem JSON, sessão expirada e conta bloqueada.
async function requisicao(caminho, opcoes = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = pegarToken();
  if (token) headers.Authorization = 'Bearer ' + token;

  let resposta;
  try {
    resposta = await fetch(API + caminho, { ...opcoes, headers });
  } catch (e) {
    throw new Error('Não foi possível conectar ao servidor. Verifique se ele está em execução.');
  }

  let dados = {};
  try { dados = await resposta.json(); } catch (e) { /* resposta sem corpo JSON */ }

  if (token && resposta.status === 401) sair('expirada');
  if (token && resposta.status === 403 && /inativo/i.test(dados.erro || '')) sair('bloqueada');
  if (!resposta.ok) throw new Error(dados.erro || `Erro ${resposta.status} na requisição.`);
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
