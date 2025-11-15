// src/controllers/utils/montarWhere.js
const verificadorDeNome = require('../../utils/verificadorDeNome');
const verificadorDeEmail = require('../../utils/verificadorDeEmail');
const verificadorDeCPF = require('../../utils/verificadorDeCPF.js');

function montarWhere(dados, camposPermitidos = [], tipos = {}, { usarFormatoQuery = true } = {}) {
  const where = {};
  const invalidos = [];        // { parametro, valorRecebido, dica }
  const valoresInvalidos = []; // { parametro, valorRecebido, dica, tipo }

  // helper: coloca a dica no formato "Ex.: ?campo=valor"
  function dicaComQuery(campo, dica) {
    // se a dica já tiver "Ex.:" seguido de um exemplo, injeta "?campo="
    // Ex.: "Ex.: Maria da Silva" => "Ex.: ?nome=Maria da Silva"
    return dica.replace(/Ex\.\s*:\s*/i, `Ex.: ?${campo}=`);
  }

  // helper: empurra erros no formato padrão do montarWhere
  function empurraErros(campo, valorRecebido, errosDoValidador) {
    for (const e of errosDoValidador) {
      const dica = usarFormatoQuery ? dicaComQuery(campo, e.dica) : e.dica;
      valoresInvalidos.push({
        parametro: campo,
        valorRecebido,
        dica,
        tipo: 'valor_invalido',
      });
    }
  }

  for (const chave of Object.keys(dados)) {
    if (!camposPermitidos.includes(chave)) {
      invalidos.push({
        parametro: chave,
        valorRecebido: dados[chave],
        dica: 'Parâmetro não permitido.'
      });
      continue;
    }

    let v = dados[chave];

    switch (tipos[chave]) {
      case 'number': {
        const s = String(v).trim();

        // rejeita vazio, espaços e qualquer coisa que não seja inteiro (opcional: só positivos)
        if (!/^-?\d+$/.test(s)) { // use /^\d+$/ se quiser só positivos
          valoresInvalidos.push({
            parametro: chave,
            valorRecebido: v,
            dica: usarFormatoQuery
              ? `Use um número inteiro. Ex.: ?${chave}=3`
              : 'Use um número inteiro. Ex.: 3',
          });
          continue;
        }

        const n = Number(s);

        // (opcional) se for um id, exija > 0
        if (chave === 'id' && n <= 0) {
          valoresInvalidos.push({
            parametro: chave,
            valorRecebido: v,
            dica: usarFormatoQuery
              ? `Use um id inteiro positivo. Ex.: ?${chave}=3`
              : 'Use um id inteiro positivo. Ex.: 3',
          });
          continue;
        }

        v = n;
        break;
      }

      case 'boolean': {
        const s = String(v).toLowerCase();
        if (s !== 'true' && s !== 'false') {
          valoresInvalidos.push({
            parametro: chave,
            valorRecebido: v,
            dica: usarFormatoQuery
              ? `Use true ou false. Ex.: ?${chave}=true`
              : 'Use true ou false. Ex.: true',
            tipo: 'valor_invalido',
          });
          continue;
        }
        v = (s === 'true');
        break;
      }

      case 'cpf': {
        // usa o verificador completo (remove pontuação, confere dígitos verificadores etc.)
        const r = verificadorDeCPF(v);
        if (!r.ok) {
          // adapta os erros para o formato usado em montarWhere
          empurraErros(chave, v, r.erros);
          continue;
        }
        v = r.valor; // CPF normalizado e formatado (000.000.000-00)
        break;
      }

      case 'email': {
        // usa o verificador completo (normaliza domínio, checa formato por etapas)
        const r = verificadorDeEmail(v);
        if (!r.ok) {
          empurraErros(chave, v, r.erros);
          continue;
        }
        v = r.valor; // e-mail normalizado (ex.: domínio em minúsculas)
        break;
      }

      case 'nome': {
        // usa o validador genérico (mensagens neutras)
        const r = verificadorDeNome(v);
        if (!r.ok) {
          // adapta para o formato do montarWhere
          empurraErros(chave, v, r.erros);
          continue;
        }
        v = r.valor; // já normalizado (trim, espaços e capitalização)
        break;
      }

      case 'role': {
        // normaliza: tira espaços e deixa minúsculo
        const s = String(v).trim().toLowerCase();

        const rolesPermitidos = ['estudante', 'docente', 'administrador'];

        if (!rolesPermitidos.includes(s)) {
          valoresInvalidos.push({
            parametro: chave,
            valorRecebido: v,
            dica: usarFormatoQuery
              ? `Use um dos valores permitidos (${rolesPermitidos.join(', ')}). Ex.: ?${chave}=estudante`
              : `Use um dos valores permitidos (${rolesPermitidos.join(', ')}). Ex.: estudante`,
            tipo: 'valor_invalido',
          });
          continue;
        }

        // se passar na validação, salva já normalizado
        v = s;
        break;
      }

      default: {
        // sem tipo especial: mantém como veio
        v = v;
      }
    }

    where[chave] = v;
  }

  return { where, invalidos, valoresInvalidos };
}

module.exports = montarWhere;
