// src/utils/verificadorDeEmail.js
function verificadorDeEmail(v) {
  const erros = [];
  let email = String(v ?? '').trim();

  // 1) vazio após trim
  if (email.length === 0) {
    erros.push({
      dica: 'O e-mail não pode estar vazio nem conter apenas espaços. Ex.: ex@dominio.com',
    });
    return { ok: false, erros };
  }

  // 2) espaços internos não são permitidos
  // OBS: se você enviar "+" sem encodar na URL, muitos frameworks decodificam como espaço.
  // No Postman, use a aba Params ou encode "+" como "%2B".
  if (/\s/.test(email)) {
    erros.push({
      dica: 'O e-mail não pode conter espaços. Ex.: ex@dominio.com',
    });
    return { ok: false, erros };
  }

  // 3) exatamente um @
  const partesArroba = email.split('@');
  if (partesArroba.length !== 2) {
    erros.push({
      dica: 'Falta o separador "@": use o formato usuario@dominio. Ex.: ex@dominio.com',
    });
    return { ok: false, erros };
  }

  let [local, domain] = partesArroba;

  // 4) limites de comprimento (prática comum)
  //   - total ≤ 320, local ≤ 64, domínio ≤ 255
  if (email.length > 320) {
    erros.push({ dica: 'O e-mail é muito longo (máx. 320 caracteres).' });
    return { ok: false, erros };
  }
  if (local.length === 0 || local.length > 64) {
    erros.push({ dica: 'A parte antes de "@" deve ter entre 1 e 64 caracteres.' });
    return { ok: false, erros };
  }
  if (domain.length === 0 || domain.length > 255) {
    erros.push({ dica: 'O domínio (após "@") deve ter entre 1 e 255 caracteres.' });
    return { ok: false, erros };
  }

  // 5) regras da parte local (antes do @)
  if (local.startsWith('.') || local.endsWith('.')) {
    erros.push({ dica: 'A parte antes de "@" não pode começar nem terminar com ponto.' });
    return { ok: false, erros };
  }
  if (local.includes('..')) {
    erros.push({ dica: 'O e-mail não pode conter dois pontos consecutivos.' });
    return { ok: false, erros };
  }
  // permite + e outros símbolos comuns (RFC 5322 simplificado)
  const regexLocal = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+$/;
  if (!regexLocal.test(local)) {
    erros.push({
      dica:
        "A parte antes de '@' contém caracteres inválidos. Permitidos: letras, números e . ! # $ % & ' * + / = ? ^ _ ` { | } ~ -",
    });
    return { ok: false, erros };
  }

  // 6) regras do domínio
  if (domain.startsWith('.')) {
    erros.push({ dica: 'O domínio não pode começar com ponto.' });
    return { ok: false, erros };
  }
  if (domain.endsWith('.')) {
    erros.push({ dica: 'O domínio não pode terminar com ponto.' });
    return { ok: false, erros };
  }
  if (domain.includes('..')) {
    erros.push({ dica: 'O e-mail não pode conter dois pontos consecutivos.' });
    return { ok: false, erros };
  }
  // precisa ter pelo menos um ponto para separar TLD (ex.: exemplo.com)
  if (!domain.includes('.')) {
    erros.push({ dica: 'O domínio deve conter ao menos um ponto. Ex.: dominio.com' });
    return { ok: false, erros };
  }

  const domainLower = domain.toLowerCase();
  const labels = domainLower.split('.');

  // cada label: 1..63, apenas [A-Za-z0-9-], não inicia/termina com '-'
  const labelRegex = /^[A-Za-z0-9-]+$/;
  for (const label of labels) {
    if (label.length === 0) {
      erros.push({ dica: 'O domínio não pode ter partes vazias (ex.: "@.com" ou "@dominio..com").' });
      return { ok: false, erros };
    }
    if (label.length > 63) {
      erros.push({ dica: 'Cada parte do domínio deve ter no máximo 63 caracteres.' });
      return { ok: false, erros };
    }
    if (!labelRegex.test(label)) {
      erros.push({
        dica: 'O domínio deve conter apenas letras, números e hífen. Ex.: exemplo.com, mail.exemplo.com',
      });
      return { ok: false, erros };
    }
    if (label.startsWith('-') || label.endsWith('-')) {
      erros.push({ dica: 'Nenhuma parte do domínio pode começar ou terminar com hífen.' });
      return { ok: false, erros };
    }
  }

  // TLD: somente letras e tamanho >= 2
  const tld = labels[labels.length - 1];
  if (!/^[A-Za-z]{2,}$/.test(tld)) {
    erros.push({
      dica: 'A terminação do domínio (TLD) deve ter ao menos 2 letras. Ex.: .com, .org, .br',
    });
    return { ok: false, erros };
  }

  // 7) valor final normalizado
  // - mantém a parte local como veio
  // - normaliza o domínio para minúsculas
  const normalizado = `${local}@${domainLower}`;

  return { ok: true, valor: normalizado, erros: [] };
}

module.exports = verificadorDeEmail;
