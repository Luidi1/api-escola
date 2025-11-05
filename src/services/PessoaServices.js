const Services = require('./Services.js');

class PessoaServices extends Services {
    constructor() {
        super('Pessoa');
    }
    static CAMPOS_PERMITIDOS = ['id', 'email', 'nome', 'ativo', 'cpf'];
    static TIPOS = {
        id: 'number',
        email: 'string',
        nome: 'nome',
        ativo: 'boolean',
        cpf: 'cpf',
    };
    static CAMPOS_ORDENAVEIS = ['id', 'email', 'nome'];
    static SCOPES_PERMITIDOS = ['todosOsRegistros', 'inativos'];


    async pegaPessoaPorEscopo(escopo, opts = {}) {
        const listaPessoasPorEscopo = await super.pegaTodosOsRegistros({
            escopo: escopo,
            ...opts
        });
        return listaPessoasPorEscopo;
    }

}

module.exports = PessoaServices;