'use strict';

/**
 * Regras implementadas (pragmáticas, não RFC completo):
 * - não pode ser vazio/ espaços apenas
 * - não pode conter espaço interno
 * - deve ter EXATAMENTE um "@"
 * - não pode ter ".." (dois pontos consecutivos) em nenhuma parte
 * - parte local não pode começar/terminar com "."
 * - domínio deve ter ao menos um ponto (ex.: "empresa.com")
 * Obs.: normalização (ex.: domínio em minúsculas) continua no app/modelo.
 */

module.exports = {
  async up(queryInterface) {
    const dialect = queryInterface.sequelize.getDialect();

    // utilzinho para rodar SQL ignorando erro (idempotência leve)
    const tryRun = async (sql) => {
      try { await queryInterface.sequelize.query(sql); } catch (_) {}
    };

    if (dialect === 'postgres') {
      // Remover se já existir (idempotência)
      await tryRun(`ALTER TABLE "Pessoas" DROP CONSTRAINT IF EXISTS pessoas_email_format;`);

      // CHECK composto:
      // - sem espaços
      // - exatamente um "@"
      // - contém ponto após o "@"
      // - não contém ".."
      // - local não começa/termina com "."
      //
      // Nota: usamos expressões SQL combinadas em vez de um único regex
      // para deixar mais legível e com mensagens previsíveis.
      await queryInterface.sequelize.query(`
        ALTER TABLE "Pessoas"
        ADD CONSTRAINT pessoas_email_format
        CHECK (
          btrim("email") <> ''                                  -- não vazio
          AND position(' ' in "email") = 0                     -- sem espaço
          AND length("email") - length(replace("email",'@','')) = 1  -- exato 1 "@"
          AND position('..' in "email") = 0                    -- sem dois pontos seguidos
          AND substring("email" from '^[^.].*@') IS NOT NULL    -- local não começa com "."
          AND substring("email" from '@[^.].*$') IS NOT NULL    -- domínio não começa com "."
          AND position('.' in split_part("email",'@',2)) > 0    -- domínio tem ao menos um "."
        );
      `);

    } else if (dialect === 'mysql') {
      // MySQL 8+ (CHECK passa a valer). Remover se existir.
      await tryRun(`ALTER TABLE \`Pessoas\` DROP CHECK \`pessoas_email_format\`;`);

      // Equivalente lógico ao do Postgres usando funções nativas
      await queryInterface.sequelize.query(`
        ALTER TABLE \`Pessoas\`
        ADD CONSTRAINT \`pessoas_email_format\`
        CHECK (
          TRIM(\`email\`) <> ''                                 -- não vazio
          AND INSTR(\`email\`, ' ') = 0                         -- sem espaço
          AND (LENGTH(\`email\`) - LENGTH(REPLACE(\`email\`,'@',''))) = 1 -- 1 "@"
          AND INSTR(\`email\`, '..') = 0                        -- sem dois pontos seguidos
          AND LEFT(\`email\`, 1) <> '.'                         -- local não começa com '.'
          AND SUBSTRING_INDEX(\`email\`, '@', -1) <> ''         -- tem domínio
          AND LEFT(SUBSTRING_INDEX(\`email\`, '@', -1), 1) <> '.' -- domínio não começa com '.'
          AND INSTR(SUBSTRING_INDEX(\`email\`, '@', -1), '.') > 0  -- domínio tem "."
        );
      `);

    } else if (dialect === 'sqlite') {
      // SQLite não tem CHECK/regex robusto — usamos TRIGGERS de bloqueio.

      // Apaga triggers se já existirem (idempotência)
      await tryRun(`DROP TRIGGER IF EXISTS pessoas_email_chk_ins;`);
      await tryRun(`DROP TRIGGER IF EXISTS pessoas_email_chk_upd;`);

      // Helper SQL para extrair local e dominio no SQLite
      // local:  substr(email, 1, instr(email,'@')-1)
      // dominio: substr(email, instr(email,'@')+1)
      await queryInterface.sequelize.query(`
        CREATE TRIGGER IF NOT EXISTS pessoas_email_chk_ins
        BEFORE INSERT ON Pessoas
        FOR EACH ROW
        BEGIN
          -- não vazio
          SELECT CASE WHEN TRIM(NEW.email) = '' THEN
            RAISE(ABORT, 'email inválido: vazio')
          END;

          -- sem espaço
          SELECT CASE WHEN INSTR(NEW.email, ' ') > 0 THEN
            RAISE(ABORT, 'email inválido: contém espaço')
          END;

          -- exatamente um "@"
          SELECT CASE
            WHEN (LENGTH(NEW.email) - LENGTH(REPLACE(NEW.email, '@', ''))) <> 1 THEN
              RAISE(ABORT, 'email inválido: precisa de um único @')
          END;

          -- sem '..'
          SELECT CASE WHEN INSTR(NEW.email, '..') > 0 THEN
            RAISE(ABORT, 'email inválido: pontos consecutivos')
          END;

          -- local/domínio
          SELECT CASE
            WHEN INSTR(NEW.email,'@') = 1 OR INSTR(NEW.email,'@') = LENGTH(NEW.email) THEN
              RAISE(ABORT, 'email inválido: local/domínio vazios')
          END;

          -- local não começa/termina com '.'
          SELECT CASE
            WHEN SUBSTR(NEW.email,1,1)='.' OR
                 SUBSTR(NEW.email, INSTR(NEW.email,'@')-1, 1)='.' THEN
              RAISE(ABORT, 'email inválido: local começa/termina com ponto')
          END;

          -- domínio tem ao menos um '.'
          SELECT CASE
            WHEN INSTR(SUBSTR(NEW.email, INSTR(NEW.email,'@')+1), '.') = 0 THEN
              RAISE(ABORT, 'email inválido: domínio precisa de ponto')
          END;

          -- domínio não começa/termina com '.'
          SELECT CASE
            WHEN SUBSTR(NEW.email, INSTR(NEW.email,'@')+1, 1)='.' OR
                 SUBSTR(NEW.email, LENGTH(NEW.email), 1)='.' THEN
              RAISE(ABORT, 'email inválido: domínio começa/termina com ponto')
          END;
        END;
      `);

      await queryInterface.sequelize.query(`
        CREATE TRIGGER IF NOT EXISTS pessoas_email_chk_upd
        BEFORE UPDATE OF email ON Pessoas
        FOR EACH ROW
        BEGIN
          -- regras idênticas às do INSERT
          SELECT CASE WHEN TRIM(NEW.email) = '' THEN
            RAISE(ABORT, 'email inválido: vazio')
          END;

          SELECT CASE WHEN INSTR(NEW.email, ' ') > 0 THEN
            RAISE(ABORT, 'email inválido: contém espaço')
          END;

          SELECT CASE
            WHEN (LENGTH(NEW.email) - LENGTH(REPLACE(NEW.email, '@', ''))) <> 1 THEN
              RAISE(ABORT, 'email inválido: precisa de um único @')
          END;

          SELECT CASE WHEN INSTR(NEW.email, '..') > 0 THEN
            RAISE(ABORT, 'email inválido: pontos consecutivos')
          END;

          SELECT CASE
            WHEN INSTR(NEW.email,'@') = 1 OR INSTR(NEW.email,'@') = LENGTH(NEW.email) THEN
              RAISE(ABORT, 'email inválido: local/domínio vazios')
          END;

          SELECT CASE
            WHEN SUBSTR(NEW.email,1,1)='.' OR
                 SUBSTR(NEW.email, INSTR(NEW.email,'@')-1, 1)='.' THEN
              RAISE(ABORT, 'email inválido: local começa/termina com ponto')
          END;

          SELECT CASE
            WHEN INSTR(SUBSTR(NEW.email, INSTR(NEW.email,'@')+1), '.') = 0 THEN
              RAISE(ABORT, 'email inválido: domínio precisa de ponto')
          END;

          SELECT CASE
            WHEN SUBSTR(NEW.email, INSTR(NEW.email,'@')+1, 1)='.' OR
                 SUBSTR(NEW.email, LENGTH(NEW.email), 1)='.' THEN
              RAISE(ABORT, 'email inválido: domínio começa/termina com ponto')
          END;
        END;
      `);
    } else {
      // outros dialetos: por enquanto, não fazemos nada
    }
  },

  async down(queryInterface) {
    const dialect = queryInterface.sequelize.getDialect();

    if (dialect === 'postgres') {
      await queryInterface.sequelize.query(`
        ALTER TABLE "Pessoas" DROP CONSTRAINT IF EXISTS pessoas_email_format;
      `);
    } else if (dialect === 'mysql') {
      await queryInterface.sequelize.query(`
        ALTER TABLE \`Pessoas\` DROP CHECK \`pessoas_email_format\`;
      `);
    } else if (dialect === 'sqlite') {
      await queryInterface.sequelize.query(`DROP TRIGGER IF EXISTS pessoas_email_chk_ins;`);
      await queryInterface.sequelize.query(`DROP TRIGGER IF EXISTS pessoas_email_chk_upd;`);
    }
  }
};
