/**
 * INSERT INTO Generator
 * Supports simple mode and nested XDM struct mode.
 */
(function () {
  'use strict';
  const AEP = window.AEPQueryBuilder;

  AEP.registerGenerator('insert-into', {
    label: 'INSERT INTO',
    icon: 'I',

    renderForm(container) {
      // Target table
      const targetSection = AEP.createSection(container, 'Target');
      const row1 = document.createElement('div');
      row1.className = 'form-row';
      const { group: tableGroup } = AEP.createDatasetDropdown('insert-table', 'Target Table', {
        required: true, placeholder: 'Enter or select target dataset'
      });
      row1.appendChild(tableGroup);
      targetSection.appendChild(row1);

      // Mode selection
      const modeSection = AEP.createSection(container, 'Insert Mode');
      const modeRow = document.createElement('div');
      modeRow.className = 'form-row';
      modeRow.innerHTML = `<div class="radio-group">
        <label class="radio-item"><input type="radio" name="insert-mode" value="simple" checked> Simple SELECT</label>
        <label class="radio-item"><input type="radio" name="insert-mode" value="nested"> Nested XDM (struct)</label>
      </div>`;
      modeSection.appendChild(modeRow);

      // Simple mode
      const simpleDiv = document.createElement('div');
      simpleDiv.id = 'insert-simple-section';
      const { group: queryGroup } = AEP.createField('textarea', 'insert-query', 'SELECT Statement', {
        placeholder: 'SELECT * FROM source_table', rows: 8
      });
      simpleDiv.appendChild(queryGroup);
      modeSection.appendChild(simpleDiv);

      // Nested XDM mode
      const nestedDiv = document.createElement('div');
      nestedDiv.id = 'insert-nested-section';
      nestedDiv.style.display = 'none';

      const nestedRow1 = document.createElement('div');
      nestedRow1.className = 'form-row';
      const { group: tenantGroup } = AEP.createField('text', 'insert-tenant', 'Tenant Name', {
        placeholder: '_myorg', tooltip: 'XDM tenant namespace', size: 'medium'
      });
      const { group: sourceGroup } = AEP.createDatasetDropdown('insert-source', 'Source Table', {
        placeholder: 'Enter or select source dataset'
      });
      nestedRow1.appendChild(tenantGroup);
      nestedRow1.appendChild(sourceGroup);
      nestedDiv.appendChild(nestedRow1);

      // Field mappings
      const mappingsLabel = document.createElement('div');
      mappingsLabel.className = 'form-label';
      mappingsLabel.style.marginTop = '12px';
      mappingsLabel.style.marginBottom = '8px';
      mappingsLabel.textContent = 'Field Mappings';
      nestedDiv.appendChild(mappingsLabel);

      AEP.createRepeatableGroup(nestedDiv, (row) => {
        const fg1 = document.createElement('div');
        fg1.className = 'form-group';
        fg1.innerHTML = `<label class="form-label">Source Field</label>
          <input type="text" class="mapping-source" placeholder="source_column" />`;
        const fg2 = document.createElement('div');
        fg2.className = 'form-group';
        fg2.innerHTML = `<label class="form-label">Target Field</label>
          <input type="text" class="mapping-target" placeholder="target_column" />`;
        row.appendChild(fg1);
        row.appendChild(fg2);
      }, { addLabel: '+ Add Field Mapping', minRows: 1 });

      modeSection.appendChild(nestedDiv);

      // Mode toggle
      container.querySelectorAll('input[name="insert-mode"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
          simpleDiv.style.display = e.target.value === 'simple' ? '' : 'none';
          nestedDiv.style.display = e.target.value === 'nested' ? '' : 'none';
          AEP.scheduleUpdate();
        });
      });
    },

    generateSQL() {
      const table = document.getElementById('insert-table')?.value.trim();
      if (!table) return '-- Enter a target table name';

      const mode = document.querySelector('input[name="insert-mode"]:checked')?.value || 'simple';

      if (mode === 'simple') {
        const query = document.getElementById('insert-query')?.value.trim();
        return `INSERT INTO ${table}\n${query || '-- Enter SELECT query'}`;
      }

      // Nested XDM mode
      const tenant = document.getElementById('insert-tenant')?.value.trim() || '_tenant';
      const source = document.getElementById('insert-source')?.value.trim();
      const mappings = [];
      document.querySelectorAll('#formArea .mapping-source').forEach(el => {
        const src = el.value.trim();
        const tgt = el.closest('.repeatable-row')?.querySelector('.mapping-target')?.value.trim();
        if (src && tgt) mappings.push(`    ${src} AS ${tgt}`);
      });

      if (!mappings.length) return `INSERT INTO ${table}\n-- Add field mappings`;

      const parts = [
        `INSERT INTO ${table}`,
        'SELECT',
        `  struct(`,
        mappings.join(',\n'),
        `  ) ${tenant}`,
        `FROM ${source || '-- enter source table'}`
      ];

      return parts.join('\n');
    }
  });
})();
