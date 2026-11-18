const router = require('express').Router();
const controller = require('../controllers/categoriasController');
const autenticar = require('../middlewares/authMiddleware');
const permitir = require('../middlewares/roleMiddleware');

router.use(autenticar);

router.get('/', controller.listar);                                   // qualquer usuário logado
router.post('/', permitir('admin'), controller.criar);               // somente admin
router.put('/:id', permitir('admin'), controller.atualizar);
router.delete('/:id', permitir('admin'), controller.excluir);

module.exports = router;
