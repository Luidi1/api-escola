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
}

module.exports = Services;
