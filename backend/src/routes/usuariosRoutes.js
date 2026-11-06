const router = require('express').Router();
const controller = require('../controllers/usuariosController');
const autenticar = require('../middlewares/authMiddleware');
const permitir = require('../middlewares/roleMiddleware');

// Todas as rotas abaixo exigem login e perfil admin
router.use(autenticar, permitir('admin'));

router.get('/', controller.listar);
router.patch('/:id/status', controller.atualizarStatus);

module.exports = router;
