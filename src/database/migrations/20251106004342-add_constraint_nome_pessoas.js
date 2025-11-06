'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.getDialect();

    // 1) NOT NULL no campo
    await queryInterface.changeColumn('Pessoas', 'nome', {
      type: Sequelize.STRING,
      allowNull: false,
    });

    // 2) Remover constraints antigas com mesmo nome se já existirem (idempotência leve)
    const dropIfExists = async (sql) => {
      try { await queryInterface.sequelize.query(sql); } catch (_) {}
    };

    if (dialect === 'postgres') {
      // Postgres: regex forte
      await dropIfExists(`
        ALTER TABLE "Pessoas" DROP CONSTRAINT IF EXISTS pessoas_nome_not_blank;
      `);
      await dropIfExists(`
        ALTER TABLE "Pessoas" DROP CONSTRAINT IF EXISTS pessoas_nome_regex;
      `);

      // TRIM(nome) <> ''
      await queryInterface.sequelize.query(`
        ALTER TABLE "Pessoas"
        ADD CONSTRAINT pessoas_nome_not_blank
        CHECK (btrim("nome") <> '');
      `);

      // Apenas letras (inclui acentos), espaço, hífen e apóstrofo (regex case-sensitive ok)
      await queryInterface.sequelize.query(`
        ALTER TABLE "Pessoas"
        ADD CONSTRAINT pessoas_nome_regex
        CHECK ("nome" ~ '^[A-Za-zÀ-ÖØ-öø-ÿ'' -]+$');
      `);

    } else if (dialect === 'mysql') {
      // MySQL 8+: REGEXP usa ICU
      await dropIfExists(`
        ALTER TABLE \`Pessoas\` DROP CHECK \`pessoas_nome_not_blank\`;
      `);
      await dropIfExists(`
        ALTER TABLE \`Pessoas\` DROP CHECK \`pessoas_nome_regex\`;
      `);

      await queryInterface.sequelize.query(`
        ALTER TABLE \`Pessoas\`
        ADD CONSTRAINT \`pessoas_nome_not_blank\`
        CHECK (TRIM(\`nome\`) <> '');
      `);

      await queryInterface.sequelize.query(`
        ALTER TABLE \`Pessoas\`
        ADD CONSTRAINT \`pessoas_nome_regex\`
        CHECK (\`nome\` REGEXP '^[A-Za-zÀ-ÖØ-öø-ÿ'' -]+$');
      `);

    } else if (dialect === 'sqlite') {
      // SQLite: sem regex robusto. Faremos o "mínimo viável":
      // - TRIM(nome) <> ''
      // - Nome não contém dígitos
      // Obs.: CHECKs em SQLite precisam recriar a tabela para alterar; o Sequelize em geral reescreve o schema.
      // Usaremos addConstraint 'check' via SQL direto, recriando regra com ALTER TABLE ... ADD CONSTRAINT não é suportado nativamente.
      // Assim, a abordagem prática é: criar uma coluna virtual/check via table rebuild é complexa.
      // Solução simples: adicionar uma "verificação" com trigger (compatível) para inserts/updates.

      // Criar triggers que barram valores inválidos
      // 1) impedir vazio/apenas espaços
      await queryInterface.sequelize.query(`
        CREATE TRIGGER IF NOT EXISTS pessoas_nome_not_blank_insert
        BEFORE INSERT ON Pessoas
        FOR EACH ROW
        BEGIN
          SELECT CASE
            WHEN TRIM(NEW.nome) = '' THEN
              RAISE(ABORT, 'nome não pode ser vazio')
          END;
        END;
      `);
      await queryInterface.sequelize.query(`
        CREATE TRIGGER IF NOT EXISTS pessoas_nome_not_blank_update
        BEFORE UPDATE OF nome ON Pessoas
        FOR EACH ROW
        BEGIN
          SELECT CASE
            WHEN TRIM(NEW.nome) = '' THEN
              RAISE(ABORT, 'nome não pode ser vazio')
          END;
        END;
      `);

      // 2) impedir dígitos
      await queryInterface.sequelize.query(`
        CREATE TRIGGER IF NOT EXISTS pessoas_nome_no_digits_insert
        BEFORE INSERT ON Pessoas
        FOR EACH ROW
        BEGIN
          SELECT CASE
            WHEN NEW.nome GLOB '*[0-9]*' THEN
              RAISE(ABORT, 'nome não pode conter dígitos')
          END;
        END;
      `);
      await queryInterface.sequelize.query(`
        CREATE TRIGGER IF NOT EXISTS pessoas_nome_no_digits_update
        BEFORE UPDATE OF nome ON Pessoas
        FOR EACH ROW
        BEGIN
          SELECT CASE
            WHEN NEW.nome GLOB '*[0-9]*' THEN
              RAISE(ABORT, 'nome não pode conter dígitos')
          END;
        END;
      `);
    } else {
      // Outros dialetos: pelo menos o NOT NULL já foi aplicado.
      // Você pode adicionar ramificações específicas se necessário.
    }
  },

  async down(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.getDialect();

    // Reverter NOT NULL
    await queryInterface.changeColumn('Pessoas', 'nome', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    if (dialect === 'postgres') {
      await queryInterface.sequelize.query(`
        ALTER TABLE "Pessoas" DROP CONSTRAINT IF EXISTS pessoas_nome_not_blank;
      `);
      await queryInterface.sequelize.query(`
        ALTER TABLE "Pessoas" DROP CONSTRAINT IF EXISTS pessoas_nome_regex;
      `);
    } else if (dialect === 'mysql') {
      await queryInterface.sequelize.query(`
        ALTER TABLE \`Pessoas\` DROP CHECK \`pessoas_nome_not_blank\`;
      `);
      await queryInterface.sequelize.query(`
        ALTER TABLE \`Pessoas\` DROP CHECK \`pessoas_nome_regex\`;
      `);
    } else if (dialect === 'sqlite') {
      await queryInterface.sequelize.query(`DROP TRIGGER IF EXISTS pessoas_nome_not_blank_insert;`);
      await queryInterface.sequelize.query(`DROP TRIGGER IF EXISTS pessoas_nome_not_blank_update;`);
      await queryInterface.sequelize.query(`DROP TRIGGER IF EXISTS pessoas_nome_no_digits_insert;`);
      await queryInterface.sequelize.query(`DROP TRIGGER IF EXISTS pessoas_nome_no_digits_update;`);
    }
  }
};
