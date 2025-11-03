const converteIds = require('../utils/conversorDeStringHelper.js');
const montarWhere = require('./utils/controllerHelper.js');
const montarOpcoesLista = require('./utils/montarOpcoesLista.js');

class Controller {
    // 🔹 parâmetros fixos de paginação/listagem — definidos fora dos métodos
    static PERMITIDOS_LISTAGEM = ['limit', 'offset', 'order', 'scope', 'pagina'];

    constructor(entidadeService) {
        this.entidadeService = entidadeService;
    }

    #campos() {
        return this.entidadeService.constructor.CAMPOS_PERMITIDOS || [];
    }

    #tipos() {
        return this.entidadeService.constructor.TIPOS || {};
    }

    #preparaFiltro(req, { allowSemQuery = false } = {}) {
        const campos = this.#campos();
        const tipos = this.#tipos();

        // defina ordenáveis por entidade (ou use todos os campos)
        const ordenaveis = this.entidadeService.constructor.CAMPOS_ORDENAVEIS;

        const { opcoes, filtros, invalidos: invLista, valoresInvalidos: valLista } =
            montarOpcoesLista(req.query, { ordenaveis, limitMax: 100 });

        // 🔸 converte erros de listagem para formato unificado (NÃO retorna ainda)
        const errosListagem = [
            ...invLista.map(e => ({ ...e, tipo: 'parametro_inexistente' })),
            ...valLista.map(e => ({ ...e, tipo: 'valor_invalido' })),
        ];

        const semQuery =
            !req.query ||
            Object.keys(req.query).length === 0 ||
            Object.keys(filtros).length === 0;

        if (semQuery && !allowSemQuery) {
            return {
                erro: {
                    status: 422,
                    payload: {
                        erro: 'Nenhum parâmetro de consulta foi enviado.',
                        dicas: {
                            'campos permitidos': campos,
                            'campos de paginação': Controller.PERMITIDOS_LISTAGEM
                        }
                    }
                }
            };
        }

        if (semQuery && allowSemQuery) {
            return { where: undefined, opcoes };
        }

        // 🔸 valida filtros (WHERE) mesmo se houver erro de listagem, para agrupar tudo
        const { where, invalidos, valoresInvalidos } = montarWhere(filtros, campos, tipos);
        const errosFiltros = [
            ...invalidos.map(e => ({ ...e, tipo: 'parametro_inexistente' })),
            ...valoresInvalidos.map(e => ({ ...e, tipo: 'valor_invalido' })),
        ];

        // 🔸 se houver QUALQUER erro (listagem ou filtros), retorna tudo junto
        if (errosListagem.length || errosFiltros.length) {
            return {
                erro: {
                    status: 422,
                    payload: {
                        erro: 'Alguns parâmetros possuem problemas.',
                        detalhes: {
                            listagem: errosListagem,
                            filtros: errosFiltros
                        },
                        // 🔹 mensagens de dica padronizadas
                        dicas: {
                            'campos permitidos': campos,
                            'campos de paginação': Controller.PERMITIDOS_LISTAGEM,
                            'campos ordenáveis': ordenaveis
                        }
                    }
                }
            };
        }

        return { where, opcoes };
    }

    /*// 👇 helper privado para validar query e montar where/opções
    #preparaFiltro(req, { allowSemQuery = false } = {}) {
        const campos = this.#campos();
        const tipos = this.#tipos();

        // defina ordenáveis por entidade (ou use todos os campos)
        const ordenaveis = this.entidadeService.constructor.CAMPOS_ORDENAVEIS;

        const { opcoes, filtros, invalidos: invLista, valoresInvalidos: valLista } =
            montarOpcoesLista(req.query, { ordenaveis, limitMax: 100 });

        // se houver erro de listagem (order/limit/offset inválidos), retorne 422
        if (invLista.length || valLista.length) {
            return {
                erro: {
                    status: 422,
                    payload: {
                        erro: 'Parâmetros de listagem inválidos.',
                        detalhes: [
                            ...invLista.map(e => ({ ...e, tipo: 'parametro_inexistente' })),
                            ...valLista.map(e => ({ ...e, tipo: 'valor_invalido' })),
                        ],
                        // 🔹 mensagens de dica padronizadas
                        dicas: {
                            'campos permitidos': campos,
                            'campos de paginação': Controller.PERMITIDOS_LISTAGEM,
                            'campos ordenáveis': ordenaveis
                        }
                    }
                }
            };
        }

        const semQuery =
            !req.query ||
            Object.keys(req.query).length === 0 ||
            Object.keys(filtros).length === 0;

        if (semQuery && !allowSemQuery) {
            return {
                erro: {
                    status: 422,
                    payload: {
                        erro: 'Nenhum parâmetro de consulta foi enviado.',
                        dicas: {
                            'campos permitidos': campos,
                            'campos de paginação': Controller.PERMITIDOS_LISTAGEM
                        }
                    }
                }
            };
        }

        if (semQuery && allowSemQuery) {
            return { where: undefined, opcoes };
        }

        const { where, invalidos, valoresInvalidos } = montarWhere(filtros, campos, tipos);
        const erros = [
            ...invalidos.map(e => ({ ...e, tipo: 'parametro_inexistente' })),
            ...valoresInvalidos.map(e => ({ ...e, tipo: 'valor_invalido' })),
        ];

        if (erros.length) {
            return {
                erro: {
                    status: 422,
                    payload: {
                        erro: 'Alguns parâmetros possuem problemas.',
                        detalhes: erros,
                        dicas: {
                            'campos permitidos': campos,
                            'campos de paginação': Controller.PERMITIDOS_LISTAGEM
                        }
                    }
                }
            };
        }

        return { where, opcoes };
    }*/



    async pegaTodos(req, res) {
        try {
            const listaRegistros = await this.entidadeService.pegaTodosOsRegistros();
            return res.status(200).json(listaRegistros);
        } catch (erro) {
            return res.status(500).json({ erro: erro.message });
        }
    }

    async pegaUmPorId(req, res) {
        try {
            const { ...params } = req.params;
            const where = converteIds(params);
            const registro = await this.entidadeService.pegaUmRegistro({ where });

            if (!registro) return res.status(404).json({ erro: 'Pessoa não encontrada' });
            return res.status(200).json(registro);
        } catch (erro) {
            return res.status(500).json({ erro: erro.message });
        }
    }

    // Mantido, mas agora usa o helper para evitar repetição
    async pegaUmPorFiltro(req, res) {
        try {
            const prep = this.#preparaFiltro(req, { allowSemQuery: false });
            if (prep.erro) return res.status(prep.erro.status).json(prep.erro.payload);

            const { where, opcoes } = prep;
            const registro = await this.entidadeService.pegaUmRegistro({ where, ...opcoes });

            if (!registro) return res.status(404).json({ erro: 'Não encontrado' });
            return res.status(200).json(registro);
        } catch (erro) {
            return res.status(500).json({ erro: erro.message });
        }
    }

    // 👇 Novo: vários por filtro, reaproveitando 100% da lógica
    async pegaTodosPorFiltro(req, res) {
        try {
            const prep = this.#preparaFiltro(req, { allowSemQuery: true });
            if (prep.erro) return res.status(prep.erro.status).json(prep.erro.payload);

            const { where, opcoes } = prep;
            const registros = await this.entidadeService.pegaTodosOsRegistros({
                ...(where ? { where } : {}),
                ...opcoes
            });

            return res.status(200).json(registros); // 200 com [] quando vazio
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
