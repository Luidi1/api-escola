const { Router } = require('express');
const PessoaController = require('../controllers/PessoaController');

const pessoaController = new PessoaController();
const router = Router();

router.get('/pessoas', pessoaController.pegaTodos.bind(pessoaController));
router.get('/pessoas/pegarUmaPessoaPorFiltro', pessoaController.pegaUmPorFiltro.bind(pessoaController));
router.get('/pessoas/:id', pessoaController.pegaUmPorId.bind(pessoaController));

module.exports = router;