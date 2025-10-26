class Controller{
    constructor(entidadeService){
        this.entidadeService = entidadeService;
    }

    async pegaTodos(req, res){
        try{
            const listaRegistros = await this.entidadeService.pegaTodosOsRegistros();
            return res.status(200).json(listaRegistros);
        }
        catch(erro){
            return res.status(500).json({ erro: erro.message });
        }
    }
}

module.exports = Controller;