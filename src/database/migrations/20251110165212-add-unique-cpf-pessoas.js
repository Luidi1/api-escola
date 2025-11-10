// migrations/XXXXXXXX-add-unique-cpf-pessoas.js
'use strict';

module.exports = {
  async up(qi) {
    // remove se já existir com esse nome (idempotência leve)
    try { 
      await qi.removeConstraint('Pessoas', 'pessoas_cpf_uk'); 
    } catch (_) {}

    await qi.addConstraint('Pessoas', {
      fields: ['cpf'],
      type: 'unique',
      name: 'pessoas_cpf_uk',
    });
  },

  async down(qi) {
    await qi.removeConstraint('Pessoas', 'pessoas_cpf_uk');
  }
};
