/**
 * EXPLAIN Generator
 */
(function () {
  'use strict';
  const AEP = window.AEPQueryBuilder;

  AEP.registerGenerator('explain', {
    label: 'EXPLAIN',
    icon: 'P',

    renderForm(container) {
      const section = AEP.createSection(container, 'Query Plan');
      const { group: queryGroup } = AEP.createField('textarea', 'explain-query', 'Query to Explain', {
        required: true, placeholder: 'SELECT * FROM dataset WHERE ...', rows: 10
      });
      section.appendChild(queryGroup);
    },

    generateSQL() {
      const query = document.getElementById('explain-query')?.value.trim();
      if (!query) return '-- Enter a query to explain';
      return `EXPLAIN\n${query}`;
    }
  });
})();
