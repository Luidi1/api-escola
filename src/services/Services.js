const dataSource = require('../database/models'); //como o arquivo é index.js não precisamos passar o nome do arquivo.

class Services {
    constructor(modelo) {
        this.modelo = modelo;
    }

    async pegaTodosOsRegistros(where = {}) {
        const listaRegistros = await dataSource[this.modelo].findAll({ where: { ...where } });
        return listaRegistros;
    }
}

module.exports = Services;