// migrations/XXXXXXXX-add-cpf-format-constraint.js
'use strict';

/**
 * CPF no banco:
 * - PG/MySQL: CHECK completo, incluindo DV.
 * - SQLite: TRIGGERS com validações de formato (sem DV). DV fica no app.
 */
module.exports = {
  async up(queryInterface) {
    const dialect = queryInterface.sequelize.getDialect();

    const tryRun = async (sql) => { try { await queryInterface.sequelize.query(sql); } catch (_) {} };

    if (dialect === 'postgres') {
      await tryRun(`ALTER TABLE "Pessoas" DROP CONSTRAINT IF EXISTS pessoas_cpf_format;`);
      await queryInterface.sequelize.query(`
        ALTER TABLE "Pessoas"
        ADD CONSTRAINT pessoas_cpf_format
        CHECK (
          btrim("cpf") <> '' AND
          position(' ' in "cpf") = 0 AND
          length(regexp_replace("cpf", '[^0-9]', '', 'g')) = 11 AND
          regexp_replace("cpf", '[^0-9]', '', 'g') !~ '^([0-9])\\1{10}$' AND
          (
            (
              (
                (substr(regexp_replace("cpf",'[^0-9]','','g'),1,1))::int * 10 +
                (substr(regexp_replace("cpf",'[^0-9]','','g'),2,1))::int * 9  +
                (substr(regexp_replace("cpf",'[^0-9]','','g'),3,1))::int * 8  +
                (substr(regexp_replace("cpf",'[^0-9]','','g'),4,1))::int * 7  +
                (substr(regexp_replace("cpf",'[^0-9]','','g'),5,1))::int * 6  +
                (substr(regexp_replace("cpf",'[^0-9]','','g'),6,1))::int * 5  +
                (substr(regexp_replace("cpf",'[^0-9]','','g'),7,1))::int * 4  +
                (substr(regexp_replace("cpf",'[^0-9]','','g'),8,1))::int * 3  +
                (substr(regexp_replace("cpf",'[^0-9]','','g'),9,1))::int * 2
              ) % 11
            ) < 2 AND (substr(regexp_replace("cpf",'[^0-9]','','g'),10,1))::int = 0
            OR
            (
              (substr(regexp_replace("cpf",'[^0-9]','','g'),10,1))::int =
              11 - (
                (
                  (substr(regexp_replace("cpf",'[^0-9]','','g'),1,1))::int * 10 +
                  (substr(regexp_replace("cpf",'[^0-9]','','g'),2,1))::int * 9  +
                  (substr(regexp_replace("cpf",'[^0-9]','','g'),3,1))::int * 8  +
                  (substr(regexp_replace("cpf",'[^0-9]','','g'),4,1))::int * 7  +
                  (substr(regexp_replace("cpf",'[^0-9]','','g'),5,1))::int * 6  +
                  (substr(regexp_replace("cpf",'[^0-9]','','g'),6,1))::int * 5  +
                  (substr(regexp_replace("cpf",'[^0-9]','','g'),7,1))::int * 4  +
                  (substr(regexp_replace("cpf",'[^0-9]','','g'),8,1))::int * 3  +
                  (substr(regexp_replace("cpf",'[^0-9]','','g'),9,1))::int * 2
                ) % 11
              )
            )
          ) AND
          (
            (
              (
                (substr(regexp_replace("cpf",'[^0-9]','','g'),1,1))::int * 11 +
                (substr(regexp_replace("cpf",'[^0-9]','','g'),2,1))::int * 10 +
                (substr(regexp_replace("cpf",'[^0-9]','','g'),3,1))::int * 9  +
                (substr(regexp_replace("cpf",'[^0-9]','','g'),4,1))::int * 8  +
                (substr(regexp_replace("cpf",'[^0-9]','','g'),5,1))::int * 7  +
                (substr(regexp_replace("cpf",'[^0-9]','','g'),6,1))::int * 6  +
                (substr(regexp_replace("cpf",'[^0-9]','','g'),7,1))::int * 5  +
                (substr(regexp_replace("cpf",'[^0-9]','','g'),8,1))::int * 4  +
                (substr(regexp_replace("cpf",'[^0-9]','','g'),9,1))::int * 3  +
                (
                  CASE
                    WHEN (
                      (
                        (substr(regexp_replace("cpf",'[^0-9]','','g'),1,1))::int * 10 +
                        (substr(regexp_replace("cpf",'[^0-9]','','g'),2,1))::int * 9  +
                        (substr(regexp_replace("cpf",'[^0-9]','','g'),3,1))::int * 8  +
                        (substr(regexp_replace("cpf",'[^0-9]','','g'),4,1))::int * 7  +
                        (substr(regexp_replace("cpf",'[^0-9]','','g'),5,1))::int * 6  +
                        (substr(regexp_replace("cpf",'[^0-9]','','g'),6,1))::int * 5  +
                        (substr(regexp_replace("cpf",'[^0-9]','','g'),7,1))::int * 4  +
                        (substr(regexp_replace("cpf",'[^0-9]','','g'),8,1))::int * 3  +
                        (substr(regexp_replace("cpf",'[^0-9]','','g'),9,1))::int * 2
                      ) % 11
                    ) < 2 THEN 0
                    ELSE 11 - (
                      (
                        (substr(regexp_replace("cpf",'[^0-9]','','g'),1,1))::int * 10 +
                        (substr(regexp_replace("cpf",'[^0-9]','','g'),2,1))::int * 9  +
                        (substr(regexp_replace("cpf",'[^0-9]','','g'),3,1))::int * 8  +
                        (substr(regexp_replace("cpf",'[^0-9]','','g'),4,1))::int * 7  +
                        (substr(regexp_replace("cpf",'[^0-9]','','g'),5,1))::int * 6  +
                        (substr(regexp_replace("cpf",'[^0-9]','','g'),6,1))::int * 5  +
                        (substr(regexp_replace("cpf",'[^0-9]','','g'),7,1))::int * 4  +
                        (substr(regexp_replace("cpf",'[^0-9]','','g'),8,1))::int * 3  +
                        (substr(regexp_replace("cpf",'[^0-9]','','g'),9,1))::int * 2
                      ) % 11
                    )
                  END
                ) * 2
              ) % 11
            ) < 2 AND (substr(regexp_replace("cpf",'[^0-9]','','g'),11,1))::int = 0
            OR
            (
              (substr(regexp_replace("cpf",'[^0-9]','','g'),11,1))::int =
              11 - (
                (
                  (substr(regexp_replace("cpf",'[^0-9]','','g'),1,1))::int * 11 +
                  (substr(regexp_replace("cpf",'[^0-9]','','g'),2,1))::int * 10 +
                  (substr(regexp_replace("cpf",'[^0-9]','','g'),3,1))::int * 9  +
                  (substr(regexp_replace("cpf",'[^0-9]','','g'),4,1))::int * 8  +
                  (substr(regexp_replace("cpf",'[^0-9]','','g'),5,1))::int * 7  +
                  (substr(regexp_replace("cpf",'[^0-9]','','g'),6,1))::int * 6  +
                  (substr(regexp_replace("cpf",'[^0-9]','','g'),7,1))::int * 5  +
                  (substr(regexp_replace("cpf",'[^0-9]','','g'),8,1))::int * 4  +
                  (substr(regexp_replace("cpf",'[^0-9]','','g'),9,1))::int * 3  +
                  (
                    CASE
                      WHEN (
                        (
                          (substr(regexp_replace("cpf",'[^0-9]','','g'),1,1))::int * 10 +
                          (substr(regexp_replace("cpf",'[^0-9]','','g'),2,1))::int * 9  +
                          (substr(regexp_replace("cpf",'[^0-9]','','g'),3,1))::int * 8  +
                          (substr(regexp_replace("cpf",'[^0-9]','','g'),4,1))::int * 7  +
                          (substr(regexp_replace("cpf",'[^0-9]','','g'),5,1))::int * 6  +
                          (substr(regexp_replace("cpf",'[^0-9]','','g'),6,1))::int * 5  +
                          (substr(regexp_replace("cpf",'[^0-9]','','g'),7,1))::int * 4  +
                          (substr(regexp_replace("cpf",'[^0-9]','','g'),8,1))::int * 3  +
                          (substr(regexp_replace("cpf",'[^0-9]','','g'),9,1))::int * 2
                        ) % 11
                      ) < 2 THEN 0
                      ELSE 11 - (
                        (
                          (substr(regexp_replace("cpf",'[^0-9]','','g'),1,1))::int * 10 +
                          (substr(regexp_replace("cpf",'[^0-9]','','g'),2,1))::int * 9  +
                          (substr(regexp_replace("cpf",'[^0-9]','','g'),3,1))::int * 8  +
                          (substr(regexp_replace("cpf",'[^0-9]','','g'),4,1))::int * 7  +
                          (substr(regexp_replace("cpf",'[^0-9]','','g'),5,1))::int * 6  +
                          (substr(regexp_replace("cpf",'[^0-9]','','g'),6,1))::int * 5  +
                          (substr(regexp_replace("cpf",'[^0-9]','','g'),7,1))::int * 4  +
                          (substr(regexp_replace("cpf",'[^0-9]','','g'),8,1))::int * 3  +
                          (substr(regexp_replace("cpf",'[^0-9]','','g'),9,1))::int * 2
                        ) % 11
                      )
                    END
                  ) * 2
                ) % 11
              )
            )
          )
        );
      `);

    } else if (dialect === 'mysql') {
      await tryRun('ALTER TABLE `Pessoas` DROP CHECK `pessoas_cpf_format`;');
      await queryInterface.sequelize.query(`
        ALTER TABLE \`Pessoas\`
        ADD CONSTRAINT \`pessoas_cpf_format\`
        CHECK (
          TRIM(\`cpf\`) <> '' AND
          INSTR(\`cpf\`, ' ') = 0 AND
          LENGTH(REPLACE(REPLACE(REPLACE(\`cpf\`,'.',''),'-',''),' ','')) = 11 AND
          REPLACE(REPLACE(REPLACE(\`cpf\`,'.',''),'-',''),' ','') NOT REGEXP '^(.)\\1{10}$' AND
          (
            (
              (SUBSTRING(REPLACE(REPLACE(REPLACE(\`cpf\`,'.',''),'-',''),' ',''),1,1)+0)*10 +
              (SUBSTRING(REPLACE(REPLACE(REPLACE(\`cpf\`,'.',''),'-',''),' ',''),2,1)+0)*9  +
              (SUBSTRING(REPLACE(REPLACE(REPLACE(\`cpf\`,'.',''),'-',''),' ',''),3,1)+0)*8  +
              (SUBSTRING(REPLACE(REPLACE(REPLACE(\`cpf\`,'.',''),'-',''),' ',''),4,1)+0)*7  +
              (SUBSTRING(REPLACE(REPLACE(REPLACE(\`cpf\`,'.',''),'-',''),' ',''),5,1)+0)*6  +
              (SUBSTRING(REPLACE(REPLACE(REPLACE(\`cpf\`,'.',''),'-',''),' ',''),6,1)+0)*5  +
              (SUBSTRING(REPLACE(REPLACE(REPLACE(\`cpf\`,'.',''),'-',''),' ',''),7,1)+0)*4  +
              (SUBSTRING(REPLACE(REPLACE(REPLACE(\`cpf\`,'.',''),'-',''),' ',''),8,1)+0)*3  +
              (SUBSTRING(REPLACE(REPLACE(REPLACE(\`cpf\`,'.',''),'-',''),' ',''),9,1)+0)*2
            ) % 11
          ) < 2 AND (SUBSTRING(REPLACE(REPLACE(REPLACE(\`cpf\`,'.',''),'-',''),' ',''),10,1)+0) = 0
          OR
          (
            (SUBSTRING(REPLACE(REPLACE(REPLACE(\`cpf\`,'.',''),'-',''),' ',''),10,1)+0) =
            11 - (
              (
                (SUBSTRING(REPLACE(REPLACE(REPLACE(\`cpf\`,'.',''),'-',''),' ',''),1,1)+0)*10 +
                (SUBSTRING(REPLACE(REPLACE(REPLACE(\`cpf\`,'.',''),'-',''),' ',''),2,1)+0)*9  +
                (SUBSTRING(REPLACE(REPLACE(REPLACE(\`cpf\`,'.',''),'-',''),' ',''),3,1)+0)*8  +
                (SUBSTRING(REPLACE(REPLACE(REPLACE(\`cpf\`,'.',''),'-',''),' ',''),4,1)+0)*7  +
                (SUBSTRING(REPLACE(REPLACE(REPLACE(\`cpf\`,'.',''),'-',''),' ',''),5,1)+0)*6  +
                (SUBSTRING(REPLACE(REPLACE(REPLACE(\`cpf\`,'.',''),'-',''),' ',''),6,1)+0)*5  +
                (SUBSTRING(REPLACE(REPLACE(REPLACE(\`cpf\`,'.',''),'-',''),' ',''),7,1)+0)*4  +
                (SUBSTRING(REPLACE(REPLACE(REPLACE(\`cpf\`,'.',''),'-',''),' ',''),8,1)+0)*3  +
                (SUBSTRING(REPLACE(REPLACE(REPLACE(\`cpf\`,'.',''),'-',''),' ',''),9,1)+0)*2
              ) % 11
            )
          ) AND
          (
            (
              (SUBSTRING(REPLACE(REPLACE(REPLACE(\`cpf\`,'.',''),'-',''),' ',''),1,1)+0)*11 +
              (SUBSTRING(REPLACE(REPLACE(REPLACE(\`cpf\`,'.',''),'-',''),' ',''),2,1)+0)*10 +
              (SUBSTRING(REPLACE(REPLACE(REPLACE(\`cpf\`,'.',''),'-',''),' ',''),3,1)+0)*9  +
              (SUBSTRING(REPLACE(REPLACE(REPLACE(\`cpf\`,'.',''),'-',''),' ',''),4,1)+0)*8  +
              (SUBSTRING(REPLACE(REPLACE(REPLACE(\`cpf\`,'.',''),'-',''),' ',''),5,1)+0)*7  +
              (SUBSTRING(REPLACE(REPLACE(REPLACE(\`cpf\`,'.',''),'-',''),' ',''),6,1)+0)*6  +
              (SUBSTRING(REPLACE(REPLACE(REPLACE(\`cpf\`,'.',''),'-',''),' ',''),7,1)+0)*5  +
              (SUBSTRING(REPLACE(REPLACE(REPLACE(\`cpf\`,'.',''),'-',''),' ',''),8,1)+0)*4  +
              (SUBSTRING(REPLACE(REPLACE(REPLACE(\`cpf\`,'.',''),'-',''),' ',''),9,1)+0)*3  +
              (
                CASE
                  WHEN (
                    (
                      (SUBSTRING(REPLACE(REPLACE(REPLACE(\`cpf\`,'.',''),'-',''),' ',''),1,1)+0)*10 +
                      (SUBSTRING(REPLACE(REPLACE(REPLACE(\`cpf\`,'.',''),'-',''),' ',''),2,1)+0)*9  +
                      (SUBSTRING(REPLACE(REPLACE(REPLACE(\`cpf\`,'.',''),'-',''),' ',''),3,1)+0)*8  +
                      (SUBSTRING(REPLACE(REPLACE(REPLACE(\`cpf\`,'.',''),'-',''),' ',''),4,1)+0)*7  +
                      (SUBSTRING(REPLACE(REPLACE(REPLACE(\`cpf\`,'.',''),'-',''),' ',''),5,1)+0)*6  +
                      (SUBSTRING(REPLACE(REPLACE(REPLACE(\`cpf\`,'.',''),'-',''),' ',''),6,1)+0)*5  +
                      (SUBSTRING(REPLACE(REPLACE(REPLACE(\`cpf\`,'.',''),'-',''),' ',''),7,1)+0)*4  +
                      (SUBSTRING(REPLACE(REPLACE(REPLACE(\`cpf\`,'.',''),'-',''),' ',''),8,1)+0)*3  +
                      (SUBSTRING(REPLACE(REPLACE(REPLACE(\`cpf\`,'.',''),'-',''),' ',''),9,1)+0)*2
                    ) % 11
                  ) < 2 THEN 0
                  ELSE 11 - (
                    (
                      (SUBSTRING(REPLACE(REPLACE(REPLACE(\`cpf\`,'.',''),'-',''),' ',''),1,1)+0)*10 +
                      (SUBSTRING(REPLACE(REPLACE(REPLACE(\`cpf\`,'.',''),'-',''),' ',''),2,1)+0)*9  +
                      (SUBSTRING(REPLACE(REPLACE(REPLACE(\`cpf\`,'.',''),'-',''),' ',''),3,1)+0)*8  +
                      (SUBSTRING(REPLACE(REPLACE(REPLACE(\`cpf\`,'.',''),'-',''),' ',''),4,1)+0)*7  +
                      (SUBSTRING(REPLACE(REPLACE(REPLACE(\`cpf\`,'.',''),'-',''),' ',''),5,1)+0)*6  +
                      (SUBSTRING(REPLACE(REPLACE(REPLACE(\`cpf\`,'.',''),'-',''),' ',''),6,1)+0)*5  +
                      (SUBSTRING(REPLACE(REPLACE(REPLACE(\`cpf\`,'.',''),'-',''),' ',''),7,1)+0)*4  +
                      (SUBSTRING(REPLACE(REPLACE(REPLACE(\`cpf\`,'.',''),'-',''),' ',''),8,1)+0)*3  +
                      (SUBSTRING(REPLACE(REPLACE(REPLACE(\`cpf\`,'.',''),'-',''),' ',''),9,1)+0)*2
                    ) % 11
                  )
                END
              ) * 2
            ) % 11
          ) < 2 AND (SUBSTRING(REPLACE(REPLACE(REPLACE(\`cpf\`,'.',''),'-',''),' ',''),11,1)+0) = 0
          OR
          (
            (SUBSTRING(REPLACE(REPLACE(REPLACE(\`cpf\`,'.',''),'-',''),' ',''),11,1)+0) =
            11 - (
              (
                (SUBSTRING(REPLACE(REPLACE(REPLACE(\`cpf\`,'.',''),'-',''),' ',''),1,1)+0)*11 +
                (SUBSTRING(REPLACE(REPLACE(REPLACE(\`cpf\`,'.',''),'-',''),' ',''),2,1)+0)*10 +
                (SUBSTRING(REPLACE(REPLACE(REPLACE(\`cpf\`,'.',''),'-',''),' ',''),3,1)+0)*9  +
                (SUBSTRING(REPLACE(REPLACE(REPLACE(\`cpf\`,'.',''),'-',''),' ',''),4,1)+0)*8  +
                (SUBSTRING(REPLACE(REPLACE(REPLACE(\`cpf\`,'.',''),'-',''),' ',''),5,1)+0)*7  +
                (SUBSTRING(REPLACE(REPLACE(REPLACE(\`cpf\`,'.',''),'-',''),' ',''),6,1)+0)*6  +
                (SUBSTRING(REPLACE(REPLACE(REPLACE(\`cpf\`,'.',''),'-',''),' ',''),7,1)+0)*5  +
                (SUBSTRING(REPLACE(REPLACE(REPLACE(\`cpf\`,'.',''),'-',''),' ',''),8,1)+0)*4  +
                (SUBSTRING(REPLACE(REPLACE(REPLACE(\`cpf\`,'.',''),'-',''),' ',''),9,1)+0)*3  +
                (
                  CASE
                    WHEN (
                      (
                        (SUBSTRING(REPLACE(REPLACE(REPLACE(\`cpf\`,'.',''),'-',''),' ',''),1,1)+0)*10 +
                        (SUBSTRING(REPLACE(REPLACE(REPLACE(\`cpf\`,'.',''),'-',''),' ',''),2,1)+0)*9  +
                        (SUBSTRING(REPLACE(REPLACE(REPLACE(\`cpf\`,'.',''),'-',''),' ',''),3,1)+0)*8  +
                        (SUBSTRING(REPLACE(REPLACE(REPLACE(\`cpf\`,'.',''),'-',''),' ',''),4,1)+0)*7  +
                        (SUBSTRING(REPLACE(REPLACE(REPLACE(\`cpf\`,'.',''),'-',''),' ',''),5,1)+0)*6  +
                        (SUBSTRING(REPLACE(REPLACE(REPLACE(\`cpf\`,'.',''),'-',''),' ',''),6,1)+0)*5  +
                        (SUBSTRING(REPLACE(REPLACE(REPLACE(\`cpf\`,'.',''),'-',''),' ',''),7,1)+0)*4  +
                        (SUBSTRING(REPLACE(REPLACE(REPLACE(\`cpf\`,'.',''),'-',''),' ',''),8,1)+0)*3  +
                        (SUBSTRING(REPLACE(REPLACE(REPLACE(\`cpf\`,'.',''),'-',''),' ',''),9,1)+0)*2
                      ) % 11
                    ) < 2 THEN 0
                    ELSE 11 - (
                      (
                        (SUBSTRING(REPLACE(REPLACE(REPLACE(\`cpf\`,'.',''),'-',''),' ',''),1,1)+0)*10 +
                        (SUBSTRING(REPLACE(REPLACE(REPLACE(\`cpf\`,'.',''),'-',''),' ',''),2,1)+0)*9  +
                        (SUBSTRING(REPLACE(REPLACE(REPLACE(\`cpf\`,'.',''),'-',''),' ',''),3,1)+0)*8  +
                        (SUBSTRING(REPLACE(REPLACE(REPLACE(\`cpf\`,'.',''),'-',''),' ',''),4,1)+0)*7  +
                        (SUBSTRING(REPLACE(REPLACE(REPLACE(\`cpf\`,'.',''),'-',''),' ',''),5,1)+0)*6  +
                        (SUBSTRING(REPLACE(REPLACE(REPLACE(\`cpf\`,'.',''),'-',''),' ',''),6,1)+0)*5  +
                        (SUBSTRING(REPLACE(REPLACE(REPLACE(\`cpf\`,'.',''),'-',''),' ',''),7,1)+0)*4  +
                        (SUBSTRING(REPLACE(REPLACE(REPLACE(\`cpf\`,'.',''),'-',''),' ',''),8,1)+0)*3  +
                        (SUBSTRING(REPLACE(REPLACE(REPLACE(\`cpf\`,'.',''),'-',''),' ',''),9,1)+0)*2
                      ) % 11
                    )
                  END
                ) * 2
              ) % 11
            )
          )
        );
      `);

    } else if (dialect === 'sqlite') {
      // SQLite: validações de formato via TRIGGER (sem DV)
      await tryRun(`DROP TRIGGER IF EXISTS pessoas_cpf_chk_ins;`);
      await tryRun(`DROP TRIGGER IF EXISTS pessoas_cpf_chk_upd;`);

      const BODY = `
        -- não vazio
        SELECT CASE WHEN TRIM(NEW.cpf) = '' THEN
          RAISE(ABORT, 'cpf inválido: vazio')
        END;

        -- sem espaço
        SELECT CASE WHEN INSTR(NEW.cpf, ' ') > 0 THEN
          RAISE(ABORT, 'cpf inválido: contém espaço')
        END;

        -- 11 dígitos após remover pontuação
        SELECT CASE
          WHEN LENGTH(REPLACE(REPLACE(NEW.cpf,'.',''),'-','')) <> 11 THEN
            RAISE(ABORT, 'cpf inválido: precisa ter 11 dígitos')
        END;

        -- não pode ser sequência repetida
        SELECT CASE
          WHEN REPLACE(REPLACE(NEW.cpf,'.',''),'-','') IN (
            '00000000000','11111111111','22222222222','33333333333','44444444444',
            '55555555555','66666666666','77777777777','88888888888','99999999999'
          ) THEN
            RAISE(ABORT, 'cpf inválido: sequência repetida')
        END;
      `;

      await queryInterface.sequelize.query(`
        CREATE TRIGGER IF NOT EXISTS pessoas_cpf_chk_ins
        BEFORE INSERT ON Pessoas
        FOR EACH ROW
        BEGIN
          ${BODY}
        END;
      `);

      await queryInterface.sequelize.query(`
        CREATE TRIGGER IF NOT EXISTS pessoas_cpf_chk_upd
        BEFORE UPDATE OF cpf ON Pessoas
        FOR EACH ROW
        BEGIN
          ${BODY}
        END;
      `);
    }
  },

  async down(queryInterface) {
    const dialect = queryInterface.sequelize.getDialect();

    if (dialect === 'postgres') {
      await queryInterface.sequelize.query(`ALTER TABLE "Pessoas" DROP CONSTRAINT IF EXISTS pessoas_cpf_format;`);
    } else if (dialect === 'mysql') {
      await queryInterface.sequelize.query(`ALTER TABLE \`Pessoas\` DROP CHECK \`pessoas_cpf_format\`;`);
    } else if (dialect === 'sqlite') {
      await queryInterface.sequelize.query(`DROP TRIGGER IF EXISTS pessoas_cpf_chk_ins;`);
      await queryInterface.sequelize.query(`DROP TRIGGER IF EXISTS pessoas_cpf_chk_upd;`);
    }
  }
};
