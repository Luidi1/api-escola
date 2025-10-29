const dataSource = require('../database/models'); //como o arquivo é index.js não precisamos passar o nome do arquivo.

class Services {
    constructor(modelo) {
        this.modelo = modelo;
    }

    async pegaTodosOsRegistros(opts = {}) {
    const { scope, where, ...resto } = opts;

    // 1) Resolve o "model" (com ou sem scope)
    let modelo = dataSource[this.modelo];
    if (scope) {
      modelo = modelo.scope(scope);
    }

    // 2) Monta as opções finais pro findAll
    const opcoes = { ...resto };
    if (where && Object.keys(where).length > 0) {
      opcoes.where = where; // deixa o Sequelize combinar com o que vier do scope
    }
    // 3) Executa
    return modelo.findAll(opcoes);
  }

  async pegaUmRegistro(opts) {
  if (!opts || !opts.where || Object.keys(opts.where).length === 0) {
    throw new Error('Nenhum filtro (where) foi informado para busca única.');
  }

  const registros = await this.pegaTodosOsRegistros(opts);
  return registros[0] || null;
}
}

module.exports = Services;