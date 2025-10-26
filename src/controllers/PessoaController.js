const Controller = require('./Controller.js');
const PessoaServices = require('../services/PessoaServices');

const pessoaServices = new PessoaServices();

class PessoaController extends Controller{
    constructor(){
        super(pessoaServices);
    }
}

module.exports = PessoaController;