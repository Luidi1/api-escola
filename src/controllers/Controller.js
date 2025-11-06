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
        return this.entidadeService.constructor.CAMPOS_PERMITIDOS;
    }

    #tipos() {
        return this.entidadeService.constructor.TIPOS;
    }
    #camposOrdenaveis() {
        return this.entidadeService.constructor.CAMPOS_ORDENAVEIS;
    }
    #scopesPermitidos() {
        return this.entidadeService.constructor.SCOPES_PERMITIDOS;
    }

    #preparaFiltro(req, { allowSemQuery = false } = {}) {
        const campos = this.#campos();
        const tipos = this.#tipos();

        // defina ordenáveis por entidade (ou use todos os campos)
        const ordenaveis = this.entidadeService.constructor.CAMPOS_ORDENAVEIS;

        // whitelist de scopes da entidade
        const scopesPermitidos = this.entidadeService.constructor.SCOPES_PERMITIDOS || [];

        const { opcoes, filtros, invalidos: invLista, valoresInvalidos: valLista } =
            montarOpcoesLista(req.query, { ordenaveis, limitMax: 100, scopesPermitidos });

        // 🔸 converte erros de listagem para formato unificado (NÃO retorna ainda)
        const errosListagem = [
            ...invLista.map(e => ({ ...e, tipo: 'parametro_inexistente' })),
            ...valLista.map(e => ({ ...e, tipo: 'valor_invalido' })),
        ];

        const semQuery =
            !req.query ||
            Object.keys(req.query).length === 0 ||
            Object.keys(filtros).length === 0;

        // ✅ se permitir sem query, ainda assim valide listagem; e monte detalhes sem chaves vazias
        if (semQuery && allowSemQuery) {
            if (errosListagem.length) {
                const detalhes = {};
                if (errosListagem.length) detalhes.listagem = errosListagem;

                return {
                    erro: {
                        status: 422,
                        payload: {
                            erro: 'Parâmetros de listagem inválidos.',
                            detalhes,
                            dicas: {
                                'campos permitidos': campos,
                                'campos de paginação': Controller.PERMITIDOS_LISTAGEM,
                                'campos ordenáveis': ordenaveis
                            }
                        }
                    }
                };
            }
            // sem erros de listagem → segue sem WHERE
            return { where: undefined, opcoes };
        }

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

        // 🔸 valida filtros (WHERE) mesmo se houver erro de listagem, para agrupar tudo
        const { where, invalidos, valoresInvalidos } = montarWhere(filtros, campos, tipos);
        const errosFiltros = [
            ...invalidos.map(e => ({ ...e, tipo: 'parametro_inexistente' })),
            ...valoresInvalidos.map(e => ({ ...e, tipo: 'valor_invalido' })),
        ];

        // 🔸 se houver QUALQUER erro (listagem ou filtros), retorna tudo junto
        if (errosListagem.length || errosFiltros.length) {
            const detalhes = {};
            if (errosListagem.length) detalhes.listagem = errosListagem;
            if (errosFiltros.length) detalhes.filtros = errosFiltros;

            return {
                erro: {
                    status: 422,
                    payload: {
                        erro: 'Alguns parâmetros possuem problemas.',
                        detalhes,
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

    #msgNaoEncontrado(where) {
        // obtém o nome da classe (ex.: PessoaService → Pessoa)
        const nomeClasse = this.entidadeService.constructor.name;
        const entidadeSingular = nomeClasse
            .replace(/Services?$/i, '') // remove "Service" ou "Services"
            .replace(/s$/i, '')         // remove plural simples
            || 'Registro';

        // detecta gênero com base no final do nome
        const ultimaLetra = entidadeSingular.slice(-1).toLowerCase();
        const genero = ultimaLetra === 'a' ? 'f' : 'm';

        // funções auxiliares para adequar o texto
        const palavraEncontrado = genero === 'f' ? 'encontrada' : 'encontrado';
        const artigoIndefinido = genero === 'f' ? 'uma' : 'um';

        // mensagens dinâmicas conforme o filtro
        if (!where || Object.keys(where).length === 0)
            return `${entidadeSingular} não ${palavraEncontrado}.`;

        if ('email' in where)
            return `Não foi ${palavraEncontrado} ${artigoIndefinido} ${entidadeSingular.toLowerCase()} com esse e-mail.`;

        if ('nome' in where)
            return `Não foi ${palavraEncontrado} ${artigoIndefinido} ${entidadeSingular.toLowerCase()} com esse nome.`;

        return `${entidadeSingular} não ${palavraEncontrado}.`;
    }


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
            const where = converteIds(req.params);

            // ✅ só permitimos 'scope' como query param
            const permitidos = new Set(['scope']);
            const chavesQuery = Object.keys(req.query || {});
            const desconhecidos = chavesQuery.filter(k => !permitidos.has(k));

            if (desconhecidos.length) {
                const msg =
                    desconhecidos.length === 1
                        ? 'Parâmetro de consulta não permitido.'
                        : 'Parâmetros de consulta não permitidos.';

                return res.status(422).json({
                    erro: msg,
                    detalhes: {
                        listagem: desconhecidos.map(k => ({
                            parametro: k,
                            valorRecebido: req.query[k],
                            tipo: 'parametro_inexistente',
                            dica: 'Somente o parâmetro "scope" é aceito nesta rota.'
                        }))
                    }
                });
            }

            // ✅ valida e aplica scope opcional
            const scopesPermitidos = this.#scopesPermitidos() || [];
            let scopeUsado;

            if (Object.prototype.hasOwnProperty.call(req.query || {}, 'scope')) {
                const scope = String(req.query.scope || '').trim();

                if (!scope) {
                    return res.status(422).json({
                        erro: 'Escopo vazio.',
                        detalhes: {
                            listagem: [
                                {
                                    parametro: 'scope',
                                    valorRecebido: req.query.scope,
                                    tipo: 'valor_invalido',
                                    dica: `Use um dos: ${scopesPermitidos.join(', ')}`
                                }
                            ]
                        }
                    });
                }

                if (!scopesPermitidos.includes(scope)) {
                    return res.status(422).json({
                        erro: 'Escopo inválido.',
                        detalhes: {
                            listagem: [
                                {
                                    parametro: 'scope',
                                    valorRecebido: scope,
                                    tipo: 'valor_invalido',
                                    dica: `Permitidos: ${scopesPermitidos.join(', ')}`
                                }
                            ]
                        }
                    });
                }

                scopeUsado = scope;
            }

            // ✅ busca registro com ou sem escopo
            const registro = await this.entidadeService.pegaUmRegistro({
                where,
                ...(scopeUsado ? { scope: scopeUsado } : {})
            });

            if (!registro)
                return res.status(404).json({ erro: 'Pessoa não encontrada' });

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

            if (!registro) {
                return res.status(404).json({ erro: this.#msgNaoEncontrado(where) });
            }

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
            // whitelist de scopes exposta pelo Service da entidade
            const scopesPermitidos = this.#scopesPermitidos();

            const scope = String(req.params?.scope || '').trim();

            // 422: sem escopo na rota
            if (!scope) {
                return res.status(422).json({
                    erro: 'Nenhum escopo foi informado na rota.',
                    dicas: { 'scopes permitidos': scopesPermitidos }
                });
            }

            // 422: escopo não permitido
            if (!scopesPermitidos.includes(scope)) {
                return res.status(422).json({
                    erro: 'Escopo inválido.',
                    detalhes: {
                        listagem: [
                            {
                                parametro: 'scope',
                                valorRecebido: scope,
                                dica: `Use um dos: ${scopesPermitidos.join(', ')}`,
                                tipo: 'valor_invalido'
                            }
                        ]
                    }
                });
            }

            // ✅ apenas aplica o escopo; não aceita query params (sem where/paginação)
            const registros = await this.entidadeService.pegaTodosOsRegistros({ scope });

            return res.status(200).json(registros);
        } catch (erro) {
            return res.status(500).json({ erro: erro.message });
        }
    }

    async criaNovo(req, res) {
        const dadosParaCriacao = req.body;
        try {
            const novoRegistroCriado = await this.entidadeService.criaRegistro(dadosParaCriacao);
            return res.status(200).json(novoRegistroCriado);
        } catch (erro) {
            return res.status(500).json({ erro: erro.message });
        }
    }

}

module.exports = Controller;
