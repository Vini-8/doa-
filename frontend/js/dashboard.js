exigirLogin();
montarCabecalho();

const usuario = pegarUsuario();
const msg = document.getElementById('msg');

const descricoes = {
  admin: 'Você pode aprovar instituições, bloquear usuários e moderar doações.',
  doador: 'Publique alimentos disponíveis e acompanhe as reservas na aba Doações.',
  instituicao: 'Consulte as doações disponíveis e reserve na aba Doações.'
};
document.getElementById('descricao').textContent = descricoes[usuario.perfil];

async function carregarResumo() {
  try {
    const r = await requisicao('/doacoes/resumo');
    document.getElementById('r-disponivel').textContent = r.disponivel;
    document.getElementById('r-reservada').textContent = r.reservada;
    document.getElementById('r-concluida').textContent = r.concluida;
  } catch (erro) { /* o resumo é informativo; falha silenciosa */ }
}

async function carregarUsuarios() {
  const tbody = document.getElementById('tabela-usuarios');
  try {
    const lista = await requisicao('/usuarios');
    tbody.innerHTML = '';
    lista.forEach((u) => {
      const tr = document.createElement('tr');
      [u.nome, u.email, u.perfil, u.status].forEach((texto) => {
        const td = document.createElement('td');
        td.textContent = texto;
        tr.appendChild(td);
      });
      const tdAcao = document.createElement('td');
      if (u.perfil !== 'admin') {
        const btn = document.createElement('button');
        btn.className = 'secundario';
        const novo = u.status === 'ativo' ? 'bloqueado' : 'ativo';
        btn.textContent = u.status === 'ativo' ? 'Bloquear' : (u.status === 'pendente' ? 'Aprovar' : 'Reativar');
        btn.addEventListener('click', () => alterarStatus(u.id, novo));
        tdAcao.appendChild(btn);
      }
      tr.appendChild(tdAcao);
      tbody.appendChild(tr);
    });
  } catch (erro) {
    mostrarMensagem(msg, erro.message, 'erro');
  }
}

async function alterarStatus(id, status) {
  try {
    await requisicao(`/usuarios/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
    carregarUsuarios();
  } catch (erro) {
    mostrarMensagem(msg, erro.message, 'erro');
  }
}

carregarResumo();
if (usuario.perfil === 'admin') {
  document.getElementById('area-admin').style.display = 'block';
  carregarUsuarios();
}
