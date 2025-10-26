const { Router } = require('express');
const PessoaController = require('../controllers/PessoaController');

const pessoaController = new PessoaController();
const router = Router();

router.get('/pessoas', pessoaController.pegaTodos.bind(pessoaController));

module.exports = router;