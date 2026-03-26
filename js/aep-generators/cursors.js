/**
 * Cursors Generator (DECLARE / FETCH / CLOSE)
 */
(function () {
  'use strict';
  const AEP = window.AEPQueryBuilder;

  AEP.registerGenerator('cursors', {
    label: 'Cursors',
    icon: 'C',

    renderForm(container) {
      const section = AEP.createSection(container, 'Cursor Operation');

      const row1 = document.createElement('div');
      row1.className = 'form-row';
      const { group: opGroup } = AEP.createField('select', 'cursor-op', 'Operation', {
        choices: ['DECLARE', 'FETCH', 'CLOSE'], size: 'medium'
      });
      const { group: nameGroup } = AEP.createField('text', 'cursor-name', 'Cursor Name', {
        required: true, placeholder: 'my_cursor'
      });
      row1.appendChild(opGroup);
      row1.appendChild(nameGroup);
      section.appendChild(row1);

      // DECLARE query
      const declareDiv = document.createElement('div');
      declareDiv.id = 'cursor-declare-section';
      const { group: queryGroup } = AEP.createField('textarea', 'cursor-query', 'SELECT Query', {
        placeholder: 'SELECT * FROM dataset', rows: 6
      });
      declareDiv.appendChild(queryGroup);
      section.appendChild(declareDiv);

      // FETCH count
      const fetchDiv = document.createElement('div');
      fetchDiv.id = 'cursor-fetch-section';
      fetchDiv.style.display = 'none';
      const row2 = document.createElement('div');
      row2.className = 'form-row';
      const { group: countGroup } = AEP.createField('number', 'cursor-count', 'Row Count', {
        placeholder: '10', size: 'small'
      });
      row2.appendChild(countGroup);
      fetchDiv.appendChild(row2);
      section.appendChild(fetchDiv);

      document.getElementById('cursor-op').addEventListener('change', (e) => {
        declareDiv.style.display = e.target.value === 'DECLARE' ? '' : 'none';
        fetchDiv.style.display = e.target.value === 'FETCH' ? '' : 'none';
        AEP.scheduleUpdate();
      });
    },

    generateSQL() {
      const op = document.getElementById('cursor-op')?.value || 'DECLARE';
      const name = document.getElementById('cursor-name')?.value.trim();
      if (!name) return '-- Enter a cursor name';

      if (op === 'DECLARE') {
        const query = document.getElementById('cursor-query')?.value.trim();
        return `DECLARE ${name} CURSOR FOR\n${query || '-- Enter SELECT query'}`;
      }

      if (op === 'FETCH') {
        const count = document.getElementById('cursor-count')?.value || '10';
        return `FETCH ${count} FROM ${name}`;
      }

      return `CLOSE ${name}`;
    }
  });
})();
