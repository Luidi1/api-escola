// src/utils/verificadorDeCPF.js
/**
 * Valida e normaliza um CPF.
 * - Aceita com ou sem pontuação (pontos e hífen).
 * - Rejeita espaços internos, letras e símbolos indevidos.
 * - Rejeita sequências repetidas (ex.: 000.000.000-00, 11111111111 etc.).
 * - Confere os dígitos verificadores (módulo 11).
 * - Retorna valor normalizado no formato 000.000.000-00.
 *
 * Retorno:
 *   { ok: true,  valor: '000.000.000-00', erros: [] }
 *   { ok: false, erros: [{ dica: 'mensagem' }, ...] }
 */
function verificadorDeCPF(v) {
  const erros = [];
  let bruto = String(v ?? '').trim();

  // 1) vazio após trim
  if (bruto.length === 0) {
    erros.push({
      dica: 'O CPF não pode estar vazio nem conter apenas espaços. Ex.: 123.456.789-09',
    });
    return { ok: false, erros };
  }

  // Observação: o caractere "+" em URLs pode ser decodificado como espaço por alguns frameworks.
  // Use sempre encode adequado ao enviar parâmetros (ex.: encode "+" como "%2B").

  // 2) espaços internos não são permitidos
  if (/\s/.test(bruto)) {
    erros.push({
      dica: 'O CPF não pode conter espaços internos. Use apenas números, pontos e hífen. Ex.: 123.456.789-09',
    });
    return { ok: false, erros };
  }

  // 3) somente dígitos, pontos e hífen são aceitos na entrada "amigável"
  if (!/^[0-9.\-]+$/.test(bruto)) {
    erros.push({
      dica: 'O CPF deve conter apenas números, pontos e hífen. Ex.: 123.456.789-09',
    });
    return { ok: false, erros };
  }

  // 4) normaliza: remove pontuação e verifica tamanho
  const cpf = bruto.replace(/\D/g, ''); // apenas dígitos
  if (cpf.length !== 11) {
    erros.push({
      dica: 'O CPF deve ter exatamente 11 dígitos (com ou sem pontuação). Ex.: 123.456.789-09',
    });
    return { ok: false, erros };
  }

  // 5) rejeita sequências repetidas (000..., 111..., ..., 999...)
  if (/^(\d)\1{10}$/.test(cpf)) {
    erros.push({
      dica: 'O CPF não pode ser uma sequência de dígitos repetidos (ex.: 00000000000, 11111111111).',
    });
    return { ok: false, erros };
  }

  // 6) valida dígitos verificadores (módulo 11)
  const calcularDV = (base) => {
    const soma = base
      .split('')
      .reduce((acc, dig, i) => acc + Number(dig) * (base.length + 1 - i), 0);
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };

  const corpo9 = cpf.slice(0, 9);
  const dv1Esperado = calcularDV(corpo9);
  const dv2Esperado = calcularDV(corpo9 + String(dv1Esperado));

  const dv1Real = Number(cpf.charAt(9));
  const dv2Real = Number(cpf.charAt(10));

  if (dv1Real !== dv1Esperado || dv2Real !== dv2Esperado) {
    erros.push({
      dica: 'CPF inválido: dígitos verificadores não conferem. Verifique os números informados.',
    });
    return { ok: false, erros };
  }

  // 7) formata valor final: 000.000.000-00
  const valorFormatado = `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9)}`;

  // 8) retorno padronizado
  return { ok: true, valor: valorFormatado, erros: [] };
}

module.exports = verificadorDeCPF;
