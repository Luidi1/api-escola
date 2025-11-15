const dataSource = require('../database/models');

class Services {
  constructor(modelo) {
    this.modelo = modelo;
  }

  async pegaTodosOsRegistros(opts = {}) {
    const { scope, where, ...resto } = opts;

    let modelo = dataSource[this.modelo];
    if (scope) {
      modelo = modelo.scope(scope); // ✅ método correto do Sequelize
    }

    const opcoes = { ...resto };
    if (where && Object.keys(where).length > 0) {
      opcoes.where = where;
    }

    return modelo.findAll(opcoes);
  }

  async pegaUmRegistro(opts = {}) {
    if (!opts.where || Object.keys(opts.where).length === 0) {
      throw new Error('Nenhum filtro (where) foi informado para busca única.');
    }

    const { scope, where, ...resto } = opts;

    let modelo = dataSource[this.modelo];
    if (scope) {
      modelo = modelo.scope(scope); // ✅ padronizado
    }

    const opcoes = { ...resto, where };
    return modelo.findOne(opcoes);
  }

  // no Services.js
  async criaRegistro(opts = {}) {
    const { values = {}, transaction = null } = opts;

    const Model = dataSource[this.modelo];

    return Model.create(values, {
      ...(transaction ? { transaction } : {})
    });
  }



  async deletaRegistro(opts = {}) {
    const { where, scope, force = false, transaction = null, ...resto } = opts;

    if (!where || Object.keys(where).length === 0) {
      throw new Error('Filtro `where` obrigatório para deletar registro.');
    }

    let modelo = dataSource[this.modelo];

    // aplica o escopo
    if (scope) {
      modelo = modelo.scope(scope);
    }

    // busca antes de deletar
    const registrosAntes = await modelo.findAll({ where, transaction });

    if (registrosAntes.length === 0) {
      return { ok: false, registros: [] };
    }

    const opcoes = {
      where,
      ...(transaction ? { transaction } : {}),
      ...resto
    };

    if (modelo?.options?.paranoid) {
      opcoes.force = !!force;
    }

    const quantidade = await modelo.destroy(opcoes);

    return {
      ok: quantidade > 0,
      registros: registrosAntes.map(r => r.get({ plain: true })),
      tipo: modelo?.options?.paranoid
        ? (force ? 'hard' : 'soft')
        : 'hard'
    };
  }

  async atualizarRegistro(opts = {}) {
    const {
      where,
      scope,
      values = {},
      transaction = null,
      ...resto
    } = opts;

    // 🔹 segurança mínima: obrigar where
    if (!where || Object.keys(where).length === 0) {
      throw new Error('Filtro `where` obrigatório para atualizar registro.');
    }

    // 🔹 segurança mínima: obrigar valores
    if (!values || Object.keys(values).length === 0) {
      throw new Error('Valores para atualização não podem estar vazios.');
    }

    let modelo = dataSource[this.modelo];

    // aplica escopo, se houver
    if (scope) {
      modelo = modelo.scope(scope);
    }

    // 🔍 busca antes (para saber se existe algo pra atualizar)
    const opcoesBuscaAntes = {
      where,
      ...(transaction ? { transaction } : {})
    };

    const registrosAntes = await modelo.findAll(opcoesBuscaAntes);

    if (registrosAntes.length === 0) {
      return { ok: false, registros: [] };
    }

    // 🔑 pega a PK do modelo (em geral "id")
    const pk = modelo.primaryKeyAttribute || 'id';
    const ids = registrosAntes.map(r => r.get(pk));

    // ⚙️ faz o update
    const opcoesUpdate = {
      where,
      ...(transaction ? { transaction } : {}),
      ...resto
    };

    const [quantidade] = await modelo.update(values, opcoesUpdate);

    if (quantidade === 0) {
      // nada foi atualizado (pode ter batido em alguma constraint, etc.)
      return { ok: false, registros: [] };
    }

    // 🔁 busca de novo para retornar já atualizados,
    //    agora usando os IDs capturados antes (e não mais o where original)
    const opcoesBuscaDepois = {
      where: { [pk]: ids },
      ...(transaction ? { transaction } : {})
    };

    const registrosDepois = await modelo.findAll(opcoesBuscaDepois);

    return {
      ok: true,
      registros: registrosDepois.map(r => r.get({ plain: true })),
      alterados: quantidade
    };
  }




  async contaRegistros(opts = {}) {
    const { where = {}, transaction = null, scope = null } = opts;

    // 🔸 validação mínima
    if (!where || typeof where !== 'object') {
      throw new Error('Parâmetro `where` deve ser um objeto.');
    }

    const ModeloBase = dataSource[this.modelo];

    // 👇 aplica o escopo se existir
    const Model = scope ? ModeloBase.scope(scope) : ModeloBase;

    // 🔹 opções do count
    const opcoes = {
      where,
      ...(transaction ? { transaction } : {})
    };

    // 🔸 executa a contagem usando Sequelize
    const total = await Model.count(opcoes);

    // 🔹 retorna o número total de registros que correspondem ao filtro
    return total;
  }


}

module.exports = Services;
