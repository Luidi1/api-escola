// src/utils/verificadorDeNome.js
function verificadorDeNome(v) {
  const erros = [];
  let nome = String(v ?? '').trim();

  // 1) vazio após trim
  if (nome.length === 0) {
    erros.push({
      dica: 'O nome não pode estar vazio nem conter apenas espaços. Ex.: Maria da Silva',
    });
    return { ok: false, erros };
  }

  // 2) normaliza espaços internos
  nome = nome.replace(/\s{2,}/g, ' ');

  // 3) apenas letras (inclui acentos), espaço, hífen e apóstrofo
  const regexNome = /^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$/;
  if (!regexNome.test(nome)) {
    erros.push({
      dica: 'O nome deve conter apenas letras, espaços, hífen ou apóstrofo. Ex.: Ana Beatriz, João-Pedro, D\'Ávila',
    });
    return { ok: false, erros };
  }

  // 4) cada palavra com ao menos 2 letras
  const palavras = nome.split(' ');
  const todasValidas = palavras.every((palavra) => {
    const apenasLetras = palavra.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ]/g, '');
    return apenasLetras.length >= 2;
  });

  if (!todasValidas) {
    erros.push({
      dica: 'Cada palavra do nome deve conter ao menos 2 letras. Ex.: Ana Beatriz',
    });
    return { ok: false, erros };
  }

  // 5) normaliza capitalização
  nome = nome
    .toLowerCase()
    .split(' ')
    .map((palavra) => {
      // mantém preposições minúsculas
      if (['da', 'de', 'do', 'das', 'dos', 'e'].includes(palavra)) {
        return palavra;
      }

      // trata casos com apóstrofo, ex.: d'ávila → d'Ávila
      if (palavra.includes("'")) {
        return palavra
          .split("'")
          .map((parte, i) =>
            i === 0
              ? parte // antes do apóstrofo (ex.: d)
              : parte.charAt(0).toUpperCase() + parte.slice(1)
          )
          .join("'");
      }

      // capitaliza a primeira letra normalmente
      return palavra.charAt(0).toUpperCase() + palavra.slice(1);
    })
    .join(' ');

  // 6) valor final normalizado e validado
  return { ok: true, valor: nome, erros: [] };
}

module.exports = verificadorDeNome;
