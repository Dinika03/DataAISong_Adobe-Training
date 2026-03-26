/**
 * Views Generator (CREATE VIEW / CREATE OR REPLACE VIEW / DROP VIEW)
 */
(function () {
  'use strict';
  const AEP = window.AEPQueryBuilder;

  AEP.registerGenerator('views', {
    label: 'Views',
    icon: 'V',

    renderForm(container) {
      const section = AEP.createSection(container, 'View Definition');

      const row1 = document.createElement('div');
      row1.className = 'form-row';
      const { group: opGroup } = AEP.createField('select', 'view-op', 'Operation', {
        choices: [
          { value: 'CREATE VIEW', label: 'CREATE VIEW' },
          { value: 'CREATE OR REPLACE VIEW', label: 'CREATE OR REPLACE VIEW' },
          { value: 'DROP VIEW', label: 'DROP VIEW' }
        ],
        size: 'medium'
      });
      const { group: nameGroup } = AEP.createField('text', 'view-name', 'View Name', {
        required: true, placeholder: 'my_view'
      });
      row1.appendChild(opGroup);
      row1.appendChild(nameGroup);
      section.appendChild(row1);

      const queryDiv = document.createElement('div');
      queryDiv.id = 'view-query-section';
      const { group: queryGroup } = AEP.createField('textarea', 'view-query', 'SELECT Statement', {
        placeholder: 'SELECT * FROM dataset WHERE ...', rows: 8
      });
      queryDiv.appendChild(queryGroup);
      section.appendChild(queryDiv);

      document.getElementById('view-op').addEventListener('change', (e) => {
        queryDiv.style.display = e.target.value.startsWith('DROP') ? 'none' : '';
        AEP.scheduleUpdate();
      });
    },

    generateSQL() {
      const op = document.getElementById('view-op')?.value || 'CREATE VIEW';
      const name = document.getElementById('view-name')?.value.trim();
      if (!name) return '-- Enter a view name';

      if (op === 'DROP VIEW') return `DROP VIEW ${name}`;

      const query = document.getElementById('view-query')?.value.trim();
      return `${op} ${name} AS\n${query || '-- Enter SELECT query'}`;
    }
  });
})();
