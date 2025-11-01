function montarWhere(query, camposPermitidos = [], tipos = {}) {
  const where = {};
  const invalidos = [];        // { parametro, valorRecebido, dica }
  const valoresInvalidos = []; // { parametro, valorRecebido, dica }

  for (const chave of Object.keys(query)) {
    if (!camposPermitidos.includes(chave)) {
      invalidos.push({ parametro: chave, valorRecebido: query[chave], dica: 'Parâmetro não permitido.' });
      continue; // segue coletando os demais
    }

    let v = query[chave];

    switch (tipos[chave]) {
      case 'number': {
        const n = Number(v);
        if (Number.isNaN(n)) {
          valoresInvalidos.push({ parametro: chave, valorRecebido: v, dica: 'Use um número inteiro. Ex.: ?id=3' });
          continue; // não retorna!
        }
        v = n;
        break;
      }
      case 'boolean': {
        const s = String(v).toLowerCase();
        if (s !== 'true' && s !== 'false') {
          valoresInvalidos.push({ parametro: chave, valorRecebido: v, dica: 'Use true ou false. Ex.: ?ativo=true' });
          continue;
        }
        v = (s === 'true');
        break;
      }
      case 'cpf': {
        const ok = /^\d{11}$/.test(String(v));
        if (!ok) {
          valoresInvalidos.push({ parametro: chave, valorRecebido: v, dica: '11 dígitos numéricos. Ex.: ?cpf=12345678900' });
          continue;
        }
        v = String(v);
        break;
      }
      case 'email': {
        const ok = /^[\w.-]+@[\w.-]+\.\w{2,}$/.test(String(v));
        if (!ok) {
          valoresInvalidos.push({ parametro: chave, valorRecebido: v, dica: 'E-mail válido. Ex.: ?email=ex@dominio.com' });
          continue;
        }
        v = String(v);
        break;
      }
      // dentro do switch (tipos[chave]) no montarWhere.js
      case 'nome': {
        // 1) remove espaços no início/fim
        let nome = String(v).trim();

        // 2) se ficou vazio, é só espaços
        if (nome.length === 0) {
          valoresInvalidos.push({
            parametro: chave,
            valorRecebido: v,
            dica: 'O nome não pode estar vazio nem conter apenas espaços. Exemplo: ?nome=Maria da Silva',
          });
          continue;
        }

        // 3) NORMALIZA espaços internos (não gera erro):
        //    transforma "Ana        Silveira" em "Ana Silveira"
        nome = nome.replace(/\s{2,}/g, ' ');

        // 4) apenas letras (com acentos), espaços, hífen e apóstrofo
        const regexNome = /^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$/;
        if (!regexNome.test(nome)) {
          valoresInvalidos.push({
            parametro: chave,
            valorRecebido: v,
            dica: 'O nome deve conter apenas letras e espaços. Exemplo: ?nome=Maria da Silva',
          });
          continue;
        }

        // 5) rejeita se for apenas números
        if (/^\d+$/.test(nome)) {
          valoresInvalidos.push({
            parametro: chave,
            valorRecebido: v,
            dica: 'O nome não pode conter apenas números. Exemplo: ?nome=João',
          });
          continue;
        }

        // 6) exige que cada palavra tenha ao menos 2 letras
        const palavras = nome.split(' ');
        const todasValidas = palavras.every((palavra) => {
          const apenasLetras = palavra.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ]/g, '');
          return apenasLetras.length >= 2;
        });

        if (!todasValidas) {
          valoresInvalidos.push({
            parametro: chave,
            valorRecebido: v,
            dica: 'Cada palavra do nome deve conter ao menos duas letras. Exemplo: ?nome=Ana Beatriz',
          });
          continue;
        }

        // 7) valor final normalizado e validado
        v = nome;
        break;
      }
    }

    where[chave] = v;
  }

  return { where, invalidos, valoresInvalidos };
}
module.exports = montarWhere;
