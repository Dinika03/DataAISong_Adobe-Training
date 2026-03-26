/**
 * COPY Export Generator
 */
(function () {
  'use strict';
  const AEP = window.AEPQueryBuilder;

  AEP.registerGenerator('copy', {
    label: 'COPY (Export)',
    icon: 'E',

    renderForm(container) {
      const section = AEP.createSection(container, 'Export Configuration');

      const row1 = document.createElement('div');
      row1.className = 'form-row';
      const { group: tableGroup } = AEP.createDatasetDropdown('copy-table', 'Source Table', {
        required: true, placeholder: 'Enter or select dataset'
      });
      row1.appendChild(tableGroup);
      section.appendChild(row1);

      const row2 = document.createElement('div');
      row2.className = 'form-row';
      const { group: pathGroup } = AEP.createField('text', 'copy-path', 'Destination Path', {
        required: true, placeholder: 'adl://account.azuredatalakestore.net/path/',
        tooltip: 'Azure Data Lake Storage path'
      });
      row2.appendChild(pathGroup);
      section.appendChild(row2);

      const row3 = document.createElement('div');
      row3.className = 'form-row';
      const { group: formatGroup } = AEP.createField('select', 'copy-format', 'Format', {
        choices: ['parquet', 'csv', 'json'], size: 'medium'
      });
      row3.appendChild(formatGroup);
      section.appendChild(row3);
    },

    generateSQL() {
      const table = document.getElementById('copy-table')?.value.trim();
      const path = document.getElementById('copy-path')?.value.trim();
      const format = document.getElementById('copy-format')?.value || 'parquet';

      if (!table) return '-- Enter a source table';
      if (!path) return `COPY ${table} TO '...'\n-- Enter destination path`;

      return `COPY ${table}\nTO '${AEP.escapeSQL(path)}'\nWITH (format = '${format}')`;
    }
  });
})();
