const router = require('express').Router();
const controller = require('../controllers/doacoesController');
const autenticar = require('../middlewares/authMiddleware');
const permitir = require('../middlewares/roleMiddleware');

// Garante que :id seja um número inteiro positivo
router.param('id', (req, res, next, id) => {
  if (!/^\d+$/.test(id)) return res.status(400).json({ erro: 'ID inválido.' });
  next();
});

router.use(autenticar);

router.get('/resumo', controller.resumo);                                          // todos os perfis (dados filtrados por perfil)
router.get('/', controller.listar);
router.get('/:id', controller.obter);

router.post('/', permitir('doador'), controller.criar);                            // só doador cria
router.put('/:id', permitir('doador'), controller.atualizar);                      // só o doador dono edita
router.delete('/:id', permitir('doador', 'admin'), controller.excluir);            // dono ou admin exclui

router.post('/:id/reserva', permitir('instituicao'), controller.reservar);         // só instituição reserva
router.delete('/:id/reserva', permitir('instituicao'), controller.cancelarReserva);
router.patch('/:id/concluir', permitir('doador'), controller.concluir);

module.exports = router;
