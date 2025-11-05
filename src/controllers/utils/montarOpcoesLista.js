// controllers/utils/montarOpcoesLista.js
function montarOpcoesLista(
  query,
  {
    ordenaveis = [],
    limitMax = 100,
    // 🔹 whitelist de scopes vindos do Service da entidade (sem aliases)
    scopesPermitidos = []
  } = {}
) {
  const q = { ...(query || {}) };

  // pagina → offset (mantém comportamento atual)
  if (q.pagina) {
    const lim = Number(q.limit) || 10;
    const pag = Math.max(1, Number(q.pagina) || 1);
    q.offset = (pag - 1) * lim;
  }

  const opcoes = {};
  const invalidos = [];
  const valoresInvalidos = [];

  // limit / offset (numéricos não-negativos, com teto)
  if (q.limit !== undefined) {
    if (q.limit === '') {
      invalidos.push({
        parametro: 'limit',
        valorRecebido: q.limit,
        dica: 'Informe um valor inteiro ≥ 0. Ex.: ?limit=10',
      });
    } else {
      const n = Number(q.limit);
      if (!Number.isInteger(n) || n < 0) {
        valoresInvalidos.push({
          parametro: 'limit',
          valorRecebido: q.limit,
          dica: 'Use inteiro ≥ 0.',
        });
      } else {
        opcoes.limit = Math.min(n, limitMax);
      }
    }
  }

  if (q.offset !== undefined) {
    if (q.offset === '') {
      invalidos.push({
        parametro: 'offset',
        valorRecebido: q.offset,
        dica: 'Informe um valor inteiro ≥ 0. Ex.: ?offset=0',
      });
    } else {
      const n = Number(q.offset);
      if (!Number.isInteger(n) || n < 0) {
        valoresInvalidos.push({
          parametro: 'offset',
          valorRecebido: q.offset,
          dica: 'Use inteiro ≥ 0.',
        });
      } else {
        opcoes.offset = n;
      }
    }
  }

  // order: aceita "campo", "campo:ASC", "campo:DESC", e múltiplos separados por vírgula
  if (q.order !== undefined) {
    const bruto = String(q.order);
    const itensRaw = bruto.split(',').map((s) => s.trim());

    // detecta string vazia OU apenas vírgulas
    const todosVazios = itensRaw.every((s) => s === '');
    if (bruto.trim() === '' || todosVazios) {
      invalidos.push({
        parametro: 'order',
        valorRecebido: q.order,
        dica: 'Informe o campo. Ex.: ?order=nome:ASC',
      });
    } else {
      const pares = [];
      const itens = itensRaw.filter(Boolean);

      for (const item of itens) {
        const [campoRaw, dirRaw] = item.split(':');
        const campo = String(campoRaw || '').trim();
        const dir = String(dirRaw || 'ASC').trim().toUpperCase();

        if (!campo) {
          invalidos.push({
            parametro: 'order',
            valorRecebido: item,
            dica: 'Informe o campo. Ex.: ?order=nome:ASC',
          });
          continue;
        }
        if (ordenaveis.length && !ordenaveis.includes(campo)) {
          invalidos.push({
            parametro: 'order',
            valorRecebido: item,
            dica: `Campo não ordenável. Permitidos: ${ordenaveis.join(', ')}`,
          });
          continue;
        }
        if (dir !== 'ASC' && dir !== 'DESC') {
          valoresInvalidos.push({
            parametro: 'order',
            valorRecebido: item,
            dica: 'Direção deve ser ASC ou DESC.',
          });
          continue;
        }
        pares.push([campo, dir]);
      }

      if (pares.length) opcoes.order = pares;
    }
  }

  // 🔹 VALIDAÇÃO DE SCOPE (sem aliases)
  if (q.scope !== undefined) {
    const bruto = String(q.scope);

    // vazio ou só vírgulas → inválido (mantém padrão dos outros)
    const itensRaw = bruto.split(',').map((s) => s.trim());
    const todosVazios = itensRaw.every((s) => s === '');
    if (bruto.trim() === '' || todosVazios) {
      invalidos.push({
        parametro: 'scope',
        valorRecebido: q.scope,
        dica: `Informe um nome de scope válido. Permitidos: ${scopesPermitidos.join(', ')}`,
      });
    } else {
      // normaliza: remove vazios
      const lista = itensRaw.filter(Boolean);

      // se houver whitelist definida, valide cada um
      if (Array.isArray(scopesPermitidos) && scopesPermitidos.length > 0) {
        const naoPermitidos = lista.filter((s) => !scopesPermitidos.includes(s));
        if (naoPermitidos.length) {
          valoresInvalidos.push({
            parametro: 'scope',
            valorRecebido: q.scope,
            dica: `Scopes permitidos: ${scopesPermitidos.join(', ')}`,
          });
        } else {
          // Sequelize aceita string para 1 scope ou array para composição
          opcoes.scope = lista.length > 1 ? lista : lista[0];
        }
      } else {
        // sem whitelist definida → por segurança, trate como inválido (recomendado)
        valoresInvalidos.push({
          parametro: 'scope',
          valorRecebido: q.scope,
          dica: 'Nenhum scope público está configurado para esta entidade.',
        });
      }
    }
  }

  const { limit, offset, order, scope, pagina, ...filtros } = q;
  return { opcoes, filtros, invalidos, valoresInvalidos };
}

module.exports = montarOpcoesLista;
