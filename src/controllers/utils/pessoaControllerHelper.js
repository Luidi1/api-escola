// utils/montarWhere.js
const CAMPOS_PERMITIDOS = ['id', 'email', 'nome', 'ativo', 'cpf'];

function montarWhere(query) {
  const where = {};

  for (const k of CAMPOS_PERMITIDOS) {
    if (query[k] === undefined) continue;
    let v = query[k];

    if (k === 'ativo') v = String(v).toLowerCase() === 'true'; // boolean
    // converte número se for id, ou se não for string textual
    where[k] = isNaN(v) || ['cpf', 'email', 'nome'].includes(k)
      ? v
      : Number(v);
  }

  return where;
}

module.exports = { montarWhere, CAMPOS_PERMITIDOS };
