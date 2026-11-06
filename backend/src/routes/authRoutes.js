const router = require('express').Router();
const controller = require('../controllers/authController');
const autenticar = require('../middlewares/authMiddleware');

router.post('/cadastro', controller.cadastrar);
router.post('/login', controller.login);
router.get('/me', autenticar, controller.perfilLogado);

module.exports = router;
