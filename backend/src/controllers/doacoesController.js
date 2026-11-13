const db = require('../database/connection');

const DATA_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const STATUS_VALIDOS = ['disponivel', 'reservada', 'concluida', 'cancelada'];

const SELECT_DOACAO = `
  SELECT d.id, d.titulo, d.descricao, d.quantidade, d.unidade, d.data_validade,
         d.local_retirada, d.status, d.criado_em, d.doador_id,
         u.nome AS doador_nome, c.id AS categoria_id, c.nome AS categoria,
         r.instituicao_id, i.nome AS instituicao_nome
  FROM doacoes d
  JOIN usuarios u ON u.id = d.doador_id
  JOIN categorias c ON c.id = d.categoria_id
  LEFT JOIN reservas r ON r.doacao_id = d.id
  LEFT JOIN usuarios i ON i.id = r.instituicao_id`;

// O que cada perfil pode enxergar (regra aplicada na consulta SQL, não no front-end)
function visibilidade(usuario) {
  if (usuario.perfil === 'doador') return { sql: 'd.doador_id = ?', params: [usuario.id] };
  if (usuario.perfil === 'instituicao') {
    return {
      sql: "((d.status = 'disponivel' AND d.data_validade >= CURDATE()) OR r.instituicao_id = ?)",
      params: [usuario.id]
    };
  }
  return { sql: '1 = 1', params: [] }; // admin vê tudo
}

// Validações do corpo da requisição (criar e editar)
async function validarDoacao(b) {
  const titulo = (b.titulo || '').trim();
  if (titulo.length < 3 || titulo.length > 120) return 'Título deve ter entre 3 e 120 caracteres.';

  const quantidade = Number(b.quantidade);
  if (!Number.isFinite(quantidade) || quantidade <= 0) return 'Quantidade deve ser maior que zero.';
  if (quantidade > 99999999.99) return 'Quantidade muito alta.';

  if (!(b.unidade || '').trim()) return 'Informe a unidade (kg, un, L...).';
  if (!(b.local_retirada || '').trim()) return 'Informe o local de retirada.';

  if (!DATA_REGEX.test(b.data_validade || '') || isNaN(new Date(b.data_validade))) {
    return 'Data de validade inválida (use AAAA-MM-DD).';
  }
  const [[v]] = await db.query('SELECT ? < CURDATE() AS vencida', [b.data_validade]);
  if (v.vencida) return 'Não é possível cadastrar alimento com validade vencida.';

  const [cat] = await db.query('SELECT id FROM categorias WHERE id = ?', [b.categoria_id]);
  if (cat.length === 0) return 'Categoria inválida.';

  return null;
}

async function buscarPorId(id) {
  const [rows] = await db.query('SELECT id, doador_id, status FROM doacoes WHERE id = ?', [id]);
  return rows[0];
}

// ---------- CRUD ----------

async function listar(req, res, next) {
  try {
    const vis = visibilidade(req.usuario);
    const filtros = [vis.sql];
    const valores = [...vis.params];
    const { categoria_id, status, busca } = req.query;

    if (categoria_id) { filtros.push('d.categoria_id = ?'); valores.push(categoria_id); }
    if (status) {
      if (!STATUS_VALIDOS.includes(status)) return res.status(400).json({ erro: 'Status inválido.' });
      filtros.push('d.status = ?'); valores.push(status);
    }
    if (busca) { filtros.push('d.titulo LIKE ?'); valores.push('%' + busca.trim() + '%'); }

    const [rows] = await db.query(
      `${SELECT_DOACAO} WHERE ${filtros.join(' AND ')} ORDER BY d.data_validade ASC, d.id DESC`,
      valores
    );
    res.json(rows);
  } catch (err) { next(err); }
}

async function obter(req, res, next) {
  try {
    const vis = visibilidade(req.usuario);
    const [rows] = await db.query(
      `${SELECT_DOACAO} WHERE d.id = ? AND ${vis.sql}`,
      [req.params.id, ...vis.params]
    );
    if (rows.length === 0) return res.status(404).json({ erro: 'Doação não encontrada.' });
    res.json(rows[0]);
  } catch (err) { next(err); }
}

async function criar(req, res, next) {
  try {
    const erro = await validarDoacao(req.body);
    if (erro) return res.status(400).json({ erro });

    const b = req.body;
    const [r] = await db.query(
      `INSERT INTO doacoes (titulo, descricao, quantidade, unidade, data_validade,
                            local_retirada, categoria_id, doador_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [b.titulo.trim(), (b.descricao || '').trim() || null, Number(b.quantidade), b.unidade.trim(),
       b.data_validade, b.local_retirada.trim(), b.categoria_id, req.usuario.id]
    );
    res.status(201).json({ mensagem: 'Doação cadastrada.', id: r.insertId });
  } catch (err) { next(err); }
}

async function atualizar(req, res, next) {
  try {
    const doacao = await buscarPorId(req.params.id);
    if (!doacao) return res.status(404).json({ erro: 'Doação não encontrada.' });
    if (doacao.doador_id !== req.usuario.id) {
      return res.status(403).json({ erro: 'Você só pode editar as suas próprias doações.' });
    }
    if (doacao.status !== 'disponivel') {
      return res.status(409).json({ erro: 'Só é possível editar doações disponíveis.' });
    }

    const erro = await validarDoacao(req.body);
    if (erro) return res.status(400).json({ erro });

    const b = req.body;
    await db.query(
      `UPDATE doacoes SET titulo = ?, descricao = ?, quantidade = ?, unidade = ?,
              data_validade = ?, local_retirada = ?, categoria_id = ?
       WHERE id = ?`,
      [b.titulo.trim(), (b.descricao || '').trim() || null, Number(b.quantidade), b.unidade.trim(),
       b.data_validade, b.local_retirada.trim(), b.categoria_id, doacao.id]
    );
    res.json({ mensagem: 'Doação atualizada.' });
  } catch (err) { next(err); }
}

async function excluir(req, res, next) {
  try {
    const doacao = await buscarPorId(req.params.id);
    if (!doacao) return res.status(404).json({ erro: 'Doação não encontrada.' });

    if (req.usuario.perfil === 'doador') {
      if (doacao.doador_id !== req.usuario.id) {
        return res.status(403).json({ erro: 'Você só pode excluir as suas próprias doações.' });
      }
      if (doacao.status !== 'disponivel') {
        return res.status(409).json({ erro: 'Só é possível excluir doações disponíveis.' });
      }
    }
    // admin pode excluir qualquer doação (moderação); a reserva some junto (ON DELETE CASCADE)
    await db.query('DELETE FROM doacoes WHERE id = ?', [doacao.id]);
    res.json({ mensagem: 'Doação excluída.' });
  } catch (err) { next(err); }
}

// ---------- Regras de negócio: reserva e conclusão ----------

async function reservar(req, res, next) {
  const conexao = await db.getConnection();
  try {
    await conexao.beginTransaction();

    // FOR UPDATE trava a linha: duas instituições não conseguem reservar a mesma doação ao mesmo tempo
    const [rows] = await conexao.query(
      `SELECT id, status, data_validade < CURDATE() AS vencida
       FROM doacoes WHERE id = ? FOR UPDATE`,
      [req.params.id]
    );
    const doacao = rows[0];

    if (!doacao) {
      await conexao.rollback();
      return res.status(404).json({ erro: 'Doação não encontrada.' });
    }
    if (doacao.vencida) {
      await conexao.rollback();
      return res.status(409).json({ erro: 'Esta doação está com a validade vencida.' });
    }
    if (doacao.status !== 'disponivel') {
      await conexao.rollback();
      return res.status(409).json({ erro: 'Esta doação não está mais disponível.' });
    }

    await conexao.query('INSERT INTO reservas (doacao_id, instituicao_id) VALUES (?, ?)',
      [doacao.id, req.usuario.id]);
    await conexao.query("UPDATE doacoes SET status = 'reservada' WHERE id = ?", [doacao.id]);
    await conexao.commit();

    res.status(201).json({ mensagem: 'Doação reservada com sucesso.' });
  } catch (err) {
    await conexao.rollback();
    next(err);
  } finally {
    conexao.release();
  }
}

async function cancelarReserva(req, res, next) {
  const conexao = await db.getConnection();
  try {
    await conexao.beginTransaction();

    const [rows] = await conexao.query(
      `SELECT d.id, d.status, r.instituicao_id
       FROM doacoes d LEFT JOIN reservas r ON r.doacao_id = d.id
       WHERE d.id = ? FOR UPDATE`,
      [req.params.id]
    );
    const doacao = rows[0];

    if (!doacao) {
      await conexao.rollback();
      return res.status(404).json({ erro: 'Doação não encontrada.' });
    }
    if (doacao.instituicao_id !== req.usuario.id) {
      await conexao.rollback();
      return res.status(403).json({ erro: 'Esta reserva não pertence à sua instituição.' });
    }
    if (doacao.status !== 'reservada') {
      await conexao.rollback();
      return res.status(409).json({ erro: 'Só é possível cancelar reservas em andamento.' });
    }

    await conexao.query('DELETE FROM reservas WHERE doacao_id = ?', [doacao.id]);
    await conexao.query("UPDATE doacoes SET status = 'disponivel' WHERE id = ?", [doacao.id]);
    await conexao.commit();

    res.json({ mensagem: 'Reserva cancelada. A doação voltou a ficar disponível.' });
  } catch (err) {
    await conexao.rollback();
    next(err);
  } finally {
    conexao.release();
  }
}

async function concluir(req, res, next) {
  try {
    const doacao = await buscarPorId(req.params.id);
    if (!doacao) return res.status(404).json({ erro: 'Doação não encontrada.' });
    if (doacao.doador_id !== req.usuario.id) {
      return res.status(403).json({ erro: 'Você só pode concluir as suas próprias doações.' });
    }
    if (doacao.status !== 'reservada') {
      return res.status(409).json({ erro: 'Só é possível concluir doações reservadas.' });
    }
    await db.query("UPDATE doacoes SET status = 'concluida' WHERE id = ?", [doacao.id]);
    res.json({ mensagem: 'Doação concluída.' });
  } catch (err) { next(err); }
}

// Totais por status, respeitando o que cada perfil pode ver
async function resumo(req, res, next) {
  try {
    const vis = visibilidade(req.usuario);
    const [rows] = await db.query(
      `SELECT d.status, COUNT(*) AS total
       FROM doacoes d LEFT JOIN reservas r ON r.doacao_id = d.id
       WHERE ${vis.sql} GROUP BY d.status`,
      vis.params
    );
    const totais = { disponivel: 0, reservada: 0, concluida: 0, cancelada: 0 };
    rows.forEach((l) => { totais[l.status] = l.total; });
    res.json(totais);
  } catch (err) { next(err); }
}

module.exports = { listar, obter, criar, atualizar, excluir, reservar, cancelarReserva, concluir, resumo };
