const verificadorDeNome = require('../../utils/verificadorDeNome.js');
const verificadorDeEmail = require('../../utils/verificadorDeEmail.js');
const verificadorDeCPF = require('../../utils/verificadorDeCPF.js');

'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Pessoa extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Pessoa.init({
    nome: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'O Nome é obrigatório.',
        },
        nomeValido(value) {
          const r = verificadorDeNome(value);
          if (!r.ok) throw new Error(r.erros[0].dica);
          this.setDataValue('nome', r.valor); // normaliza antes de salvar
        }
      }
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: {
        name: 'pessoas_email_uk',
        msg: 'Já existe uma pessoa com esse e-mail.',
      },
      validate: {
        notNull: {
          msg: 'O Email é obrigatório.',
        },
        emailValido(value) {
          const r = verificadorDeEmail(value);
          if (!r.ok) throw new Error(r.erros[0].dica);
          // normaliza (mantém local, baixa domínio) antes de salvar
          this.setDataValue('email', r.valor);
        },
      },
    },
    cpf: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: {
        name: 'pessoas_cpf_uk',
        msg: 'Já existe uma pessoa com esse CPF.',
      },
      validate: {
        notNull: {
          msg: 'O CPF é obrigatório.',
        },
        cpfValido(value) {
          const r = verificadorDeCPF(value);
          if (!r.ok) throw new Error(r.erros[0].dica);
          // normaliza antes de salvar (remove pontuação e formata 000.000.000-00)
          this.setDataValue('cpf', r.valor);
        },
      },
    },

    ativo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      validate: {
        isBoolean(value) {
          if (typeof value !== 'boolean') {
            throw new Error('O campo (ativo) deve ser verdadeiro (true) ou falso (false).');
          }
        },
      },
    },

    role: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'estudante', // escolha um padrão do seu domínio
      validate: {
        isIn: [['estudante', 'docente', 'administrador']], // ajuste como quiser
      },
    },

  }, {
    sequelize,
    modelName: 'Pessoa',
    tableName: 'pessoas',
    defaultScope: {
      where: {
        ativo: true,
      }
    },
    scopes: {
      todosOsRegistros: {
        where: {}
      },
      inativos: {
        where: {
          ativo: false
        }
      },
    }
  });
  return Pessoa;
};