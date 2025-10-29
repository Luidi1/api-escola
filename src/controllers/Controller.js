const converteIds = require('../utils/conversorDeStringHelper.js');
const { montarWhere, CAMPOS_PERMITIDOS } = require('./utils/pessoaControllerHelper.js');

class Controller {
    constructor(entidadeService) {
        this.entidadeService = entidadeService;
    }

    async pegaTodos(req, res) {
        try {
            const listaRegistros = await this.entidadeService.pegaTodosOsRegistros();
            return res.status(200).json(listaRegistros);
        }
        catch (erro) {
            return res.status(500).json({ erro: erro.message });
        }
    }

    //Permitir q usuario pegue ativo:false?
    async pegaUmPorId(req, res) {
        try {
            // 1) pega os params da rota e converte strings numéricas para Number
            const { ...params } = req.params;          // ex.: { id: '5' }
            const where = converteIds(params);         // ex.: { id: 5 }
            console.log(where)
            // 2) busca única no service
            const registro = await this.entidadeService.pegaUmRegistro({ where });

            // 3) respostas
            if (!registro) return res.status(404).json({ erro: 'Pessoa não encontrada' });
            return res.status(200).json(registro);

        } catch (erro) {
            return res.status(500).json({ erro: erro.message });
        }
    }

    async pegaUmPorFiltro(req, res) {
        try {
            if (!req.query || Object.keys(req.query).length === 0) {
                return res.status(422).json({
                    erro: 'Nenhum parâmetro de consulta foi enviado. Use a query string, ex.: /pessoas/pegarUmaPessoaPorFiltro?email=ex@dom.com',
                    dicas: { permitidos: CAMPOS_PERMITIDOS }
                });
            }
            const where = montarWhere(req.query); // aqui pode vir { id: '5' }
            const registro = await this.entidadeService.pegaUmRegistro({ where });

            if (!registro) return res.status(404).json({ erro: 'Não encontrado' });
            return res.status(200).json(registro);
        } catch (erro) {
            return res.status(500).json({ erro: erro.message });
        }
    }

}
module.exports = Controller;