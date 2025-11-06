// migrations/XXXXXXXX-add-unique-email-pessoas.js
'use strict';

module.exports = {
  async up(qi) {
    // remove se já existir com esse nome (idempotência leve)
    try { await qi.removeConstraint('Pessoas', 'pessoas_email_uk'); } catch (_) {}

    await qi.addConstraint('Pessoas', {
      fields: ['email'],
      type: 'unique',
      name: 'pessoas_email_uk',
    });
  },
  async down(qi) {
    await qi.removeConstraint('Pessoas', 'pessoas_email_uk');
  }
};
