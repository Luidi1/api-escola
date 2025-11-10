'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Altera a coluna 'role' para ter NOT NULL e valor padrão
    await queryInterface.changeColumn('Pessoas', 'role', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'estudante',
    });

    // Adiciona uma constraint CHECK para garantir que role tenha apenas valores válidos
    // Obs: SQLite precisa de trigger, mas em Postgres/MySQL o CHECK já funciona
    const dialect = queryInterface.sequelize.getDialect();

    if (dialect === 'sqlite') {
      await queryInterface.sequelize.query(`
        DROP TRIGGER IF EXISTS pessoas_role_chk_ins;
      `);
      await queryInterface.sequelize.query(`
        DROP TRIGGER IF EXISTS pessoas_role_chk_upd;
      `);

      // Trigger para INSERT
      await queryInterface.sequelize.query(`
        CREATE TRIGGER pessoas_role_chk_ins
        BEFORE INSERT ON Pessoas
        FOR EACH ROW
        BEGIN
          SELECT CASE
            WHEN NEW.role NOT IN ('estudante','docente','administrador')
            THEN RAISE(ABORT, 'role inválido: deve ser estudante, docente ou administrador')
          END;
        END;
      `);

      // Trigger para UPDATE
      await queryInterface.sequelize.query(`
        CREATE TRIGGER pessoas_role_chk_upd
        BEFORE UPDATE OF role ON Pessoas
        FOR EACH ROW
        BEGIN
          SELECT CASE
            WHEN NEW.role NOT IN ('estudante','docente','administrador')
            THEN RAISE(ABORT, 'role inválido: deve ser estudante, docente ou administrador')
          END;
        END;
      `);
    } else {
      // Postgres / MySQL
      await queryInterface.sequelize.query(`
        ALTER TABLE "Pessoas"
        ADD CONSTRAINT pessoas_role_ck
        CHECK (role IN ('estudante','docente','administrador'));
      `);
    }
  },

  async down(queryInterface) {
    const dialect = queryInterface.sequelize.getDialect();

    // Remove constraint/check/trigger
    if (dialect === 'sqlite') {
      await queryInterface.sequelize.query(`DROP TRIGGER IF EXISTS pessoas_role_chk_ins;`);
      await queryInterface.sequelize.query(`DROP TRIGGER IF EXISTS pessoas_role_chk_upd;`);
    } else {
      await queryInterface.sequelize.query(`ALTER TABLE "Pessoas" DROP CONSTRAINT IF EXISTS pessoas_role_ck;`);
    }

    // Reverte a coluna
    await queryInterface.changeColumn('Pessoas', 'role', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: null,
    });
  }
};
