const converteIds = require('../utils/conversorDeStringHelper.js');
const montarWhere = require('./utils/controllerHelper.js');

class Controller {
    constructor(entidadeService) {
        this.entidadeService = entidadeService;
    }

    #campos() {
        return this.entidadeService.constructor.CAMPOS_PERMITIDOS || [];
    }
    #tipos() {
        return this.entidadeService.constructor.TIPOS || {};
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
            const campos = this.#campos();
            const tipos = this.#tipos();

            if (!req.query || Object.keys(req.query).length === 0) {
                return res.status(422).json({
                    erro: 'Nenhum parâmetro de consulta foi enviado.',
                    dicas: { permitidos: campos },
                });
            }

            const { where, invalidos, valoresInvalidos } =
                montarWhere(req.query, campos, tipos);

            const erros = [
                ...invalidos.map(e => ({ ...e, tipo: 'parametro_inexistente' })),
                ...valoresInvalidos.map(e => ({ ...e, tipo: 'valor_invalido' })),
            ];

            if (erros.length > 0) {
                const mensagemErro =
                    erros.length === 1
                        ? 'Um parâmetro possui problema.'
                        : 'Alguns parâmetros possuem problemas.';

                return res.status(422).json({
                    erro: mensagemErro,
                    detalhes: erros,
                    dicas: { permitidos: campos },
                });
            }

            if (Object.keys(where).length === 0) {
                return res.status(422).json({
                    erro: 'Nenhum parâmetro de consulta válido foi enviado.',
                    dicas: { permitidos: campos },
                });
            }

            const registro = await this.entidadeService.pegaUmRegistro({ where });

            if (!registro) {
                return res.status(404).json({ erro: 'Não encontrado' });
            }

            return res.status(200).json(registro);
        } catch (erro) {
            return res.status(500).json({ erro: erro.message });
        }
    }

    async pegaPorEscopo(req, res) {
        try {
            const { scope, limit, order, ...filtros } = req.query;

            const resultado = await pessoaServices.pegaPessoaPorEscopo(scope, {
                where: filtros,
                limit: limit ? Number(limit) : undefined,
                order: order ? [[...order.split(',')]] : undefined
            });

            return res.status(200).json(resultado);
        } catch (erro) {
            return res.status(500).json({ erro: erro.message });
        }
    }

}
module.exports = Controller;