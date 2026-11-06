// Autorização por perfil. Uso: router.get('/', autenticar, permitir('admin'), controller)
function permitir(...perfisPermitidos) {
  return (req, res, next) => {
    if (!req.usuario || !perfisPermitidos.includes(req.usuario.perfil)) {
      return res.status(403).json({ erro: 'Acesso negado para o seu perfil.' });
    }
    next();
  };
}

module.exports = permitir;
