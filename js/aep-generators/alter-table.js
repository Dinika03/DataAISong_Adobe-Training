/**
 * ALTER TABLE Generator
 * Supports ADD COLUMN with AEP data types.
 */
(function () {
  'use strict';
  const AEP = window.AEPQueryBuilder;

  const DATA_TYPES = [
    'bigint', 'integer', 'smallint', 'tinyint',
    'varchar', 'char',
    'double', 'double precision',
    'date', 'datetime'
  ];

  const NEEDS_LENGTH = ['varchar', 'char'];

  AEP.registerGenerator('alter-table', {
    label: 'ALTER TABLE',
    icon: 'A',

    renderForm(container) {
      // Table
      const tableSection = AEP.createSection(container, 'Table');
      const row1 = document.createElement('div');
      row1.className = 'form-row';
      const { group: tableGroup } = AEP.createDatasetDropdown('alter-table-name', 'Table Name', {
        required: true, placeholder: 'Enter or select dataset'
      });
      row1.appendChild(tableGroup);
      tableSection.appendChild(row1);

      // Columns
      const colSection = AEP.createSection(container, 'Add Columns');
      AEP.createRepeatableGroup(colSection, (row) => {
        const fg1 = document.createElement('div');
        fg1.className = 'form-group';
        fg1.innerHTML = `<label class="form-label">Column Name</label>
          <input type="text" class="alter-col-name" placeholder="new_column" />`;

        const fg2 = document.createElement('div');
        fg2.className = 'form-group medium';
        const typeSelect = document.createElement('select');
        typeSelect.className = 'alter-col-type';
        DATA_TYPES.forEach(t => {
          const opt = document.createElement('option');
          opt.value = t;
          opt.textContent = t;
          typeSelect.appendChild(opt);
        });
        fg2.innerHTML = '<label class="form-label">Data Type</label>';
        fg2.appendChild(typeSelect);

        const fg3 = document.createElement('div');
        fg3.className = 'form-group small';
        fg3.innerHTML = `<label class="form-label">Length</label>
          <input type="number" class="alter-col-len" placeholder="255" min="1" />`;
        fg3.style.display = 'none';

        typeSelect.addEventListener('change', () => {
          fg3.style.display = NEEDS_LENGTH.includes(typeSelect.value) ? '' : 'none';
          AEP.scheduleUpdate();
        });

        row.appendChild(fg1);
        row.appendChild(fg2);
        row.appendChild(fg3);
      }, { addLabel: '+ Add Column', minRows: 1 });
    },

    generateSQL() {
      const table = document.getElementById('alter-table-name')?.value.trim();
      if (!table) return '-- Enter a table name';

      const columns = [];
      document.querySelectorAll('#formArea .alter-col-name').forEach(el => {
        const name = el.value.trim();
        if (!name) return;
        const row = el.closest('.repeatable-row');
        let type = row.querySelector('.alter-col-type')?.value || 'varchar';
        const len = row.querySelector('.alter-col-len')?.value;

        if (NEEDS_LENGTH.includes(type) && len) {
          type = `${type}(${len})`;
        }
        columns.push(`  ADD COLUMN ${name} ${type}`);
      });

      if (!columns.length) return `ALTER TABLE ${table}\n-- Add columns`;

      return `ALTER TABLE ${table}\n${columns.join(',\n')}`;
    }
  });
})();
