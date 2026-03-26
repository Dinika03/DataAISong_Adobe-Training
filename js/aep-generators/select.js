/**
 * SELECT Query Generator
 * Supports: columns, FROM, SNAPSHOT, WHERE, GROUP BY, HAVING, ORDER BY, LIMIT/OFFSET
 */
(function () {
  'use strict';
  const AEP = window.AEPQueryBuilder;

  AEP.registerGenerator('select', {
    label: 'SELECT',
    icon: 'Q',

    renderForm(container) {
      // -- FROM section (first, so dataset dropdown is available for field dropdowns)
      const fromSection = AEP.createSection(container, 'FROM');
      const fromRow = document.createElement('div');
      fromRow.className = 'form-row';
      const { group: fromGroup } = AEP.createDatasetDropdown('select-table', 'Table / Dataset', {
        required: true, placeholder: 'Enter or select dataset'
      });
      fromRow.appendChild(fromGroup);
      fromSection.appendChild(fromRow);

      // On dataset select, fetch schema
      const dsInput = document.getElementById('select-table');
      dsInput.addEventListener('change', async () => {
        const api = window.AEPApi;
        if (api && dsInput.dataset.schemaRef) {
          await api.fetchSchema(dsInput.dataset.schemaRef);
        }
      });

      // -- Columns section
      const colSection = AEP.createSection(container, 'Columns');
      const distinctRow = document.createElement('div');
      distinctRow.className = 'form-row';
      distinctRow.innerHTML = '<label class="form-check"><input type="checkbox" id="select-distinct"> DISTINCT</label>';
      colSection.appendChild(distinctRow);

      AEP.createRepeatableGroup(colSection, (row, idx) => {
        const fg1 = document.createElement('div');
        fg1.className = 'form-group';
        fg1.innerHTML = `<label class="form-label">Expression</label>
          <input type="text" class="col-expr" placeholder="* or column name" />`;
        const fg2 = document.createElement('div');
        fg2.className = 'form-group small';
        fg2.innerHTML = `<label class="form-label">Alias</label>
          <input type="text" class="col-alias" placeholder="AS..." />`;
        row.appendChild(fg1);
        row.appendChild(fg2);
      }, { addLabel: '+ Add Column', minRows: 1 });

      // -- SNAPSHOT section
      const snapSection = AEP.createSection(container, 'SNAPSHOT', { collapsed: true });
      const snapRow = document.createElement('div');
      snapRow.className = 'form-row';
      const { group: snapModeGroup } = AEP.createField('select', 'select-snap-mode', 'Mode', {
        choices: [
          { value: '', label: 'None' },
          { value: 'SINCE', label: 'SINCE' },
          { value: 'AS OF', label: 'AS OF' },
          { value: 'BETWEEN', label: 'BETWEEN' }
        ],
        size: 'medium'
      });
      const { group: snapId1Group } = AEP.createField('text', 'select-snap-id1', 'Snapshot ID', { placeholder: 'snapshot_id' });
      const { group: snapId2Group } = AEP.createField('text', 'select-snap-id2', 'End Snapshot ID', { placeholder: 'end_snapshot_id' });
      snapId2Group.style.display = 'none';
      snapRow.appendChild(snapModeGroup);
      snapRow.appendChild(snapId1Group);
      snapRow.appendChild(snapId2Group);
      snapSection.appendChild(snapRow);

      document.getElementById('select-snap-mode').addEventListener('change', (e) => {
        snapId2Group.style.display = e.target.value === 'BETWEEN' ? '' : 'none';
      });

      // -- WHERE section
      const whereSection = AEP.createSection(container, 'WHERE', { collapsed: true });
      AEP.createRepeatableGroup(whereSection, (row, idx) => {
        if (idx > 0) {
          const joiner = document.createElement('div');
          joiner.className = 'form-group small';
          joiner.innerHTML = `<label class="form-label">Join</label>
            <select class="where-joiner"><option>AND</option><option>OR</option></select>`;
          row.appendChild(joiner);
        }
        const fg1 = document.createElement('div');
        fg1.className = 'form-group';
        fg1.innerHTML = `<label class="form-label">Field</label>
          <input type="text" class="where-field" placeholder="column_name" />`;
        const fg2 = document.createElement('div');
        fg2.className = 'form-group small';
        fg2.innerHTML = `<label class="form-label">Operator</label>
          <select class="where-op">
            <option>=</option><option>!=</option><option>&lt;</option><option>&gt;</option>
            <option>&lt;=</option><option>&gt;=</option><option>LIKE</option><option>ILIKE</option>
            <option>NOT LIKE</option><option>IN</option><option>IS NULL</option><option>IS NOT NULL</option>
          </select>`;
        const fg3 = document.createElement('div');
        fg3.className = 'form-group';
        fg3.innerHTML = `<label class="form-label">Value</label>
          <input type="text" class="where-value" placeholder="value" />`;
        row.appendChild(fg1);
        row.appendChild(fg2);
        row.appendChild(fg3);
      }, { addLabel: '+ Add Condition' });

      // -- GROUP BY section
      const groupSection = AEP.createSection(container, 'GROUP BY', { collapsed: true });
      AEP.createRepeatableGroup(groupSection, (row) => {
        const fg = document.createElement('div');
        fg.className = 'form-group';
        fg.innerHTML = `<label class="form-label">Expression</label>
          <input type="text" class="groupby-expr" placeholder="column_name" />`;
        row.appendChild(fg);
      }, { addLabel: '+ Add Group By' });

      // -- HAVING section
      const havingSection = AEP.createSection(container, 'HAVING', { collapsed: true });
      const { group: havingGroup } = AEP.createField('text', 'select-having', 'Condition', {
        placeholder: 'e.g. COUNT(*) > 5'
      });
      havingSection.appendChild(havingGroup);

      // -- ORDER BY section
      const orderSection = AEP.createSection(container, 'ORDER BY', { collapsed: true });
      AEP.createRepeatableGroup(orderSection, (row) => {
        const fg1 = document.createElement('div');
        fg1.className = 'form-group';
        fg1.innerHTML = `<label class="form-label">Expression</label>
          <input type="text" class="orderby-expr" placeholder="column_name" />`;
        const fg2 = document.createElement('div');
        fg2.className = 'form-group small';
        fg2.innerHTML = `<label class="form-label">Direction</label>
          <select class="orderby-dir"><option>ASC</option><option>DESC</option></select>`;
        const fg3 = document.createElement('div');
        fg3.className = 'form-group small';
        fg3.innerHTML = `<label class="form-label">Nulls</label>
          <select class="orderby-nulls"><option value="">Default</option><option>NULLS FIRST</option><option>NULLS LAST</option></select>`;
        row.appendChild(fg1);
        row.appendChild(fg2);
        row.appendChild(fg3);
      }, { addLabel: '+ Add Order By' });

      // -- LIMIT / OFFSET section
      const limitSection = AEP.createSection(container, 'LIMIT / OFFSET', { collapsed: true });
      const limitRow = document.createElement('div');
      limitRow.className = 'form-row';
      const { group: limitGroup } = AEP.createField('number', 'select-limit', 'LIMIT', { placeholder: '', size: 'small' });
      const { group: offsetGroup } = AEP.createField('number', 'select-offset', 'OFFSET', { placeholder: '', size: 'small' });
      limitRow.appendChild(limitGroup);
      limitRow.appendChild(offsetGroup);
      limitSection.appendChild(limitRow);
    },

    generateSQL() {
      const parts = [];

      // SELECT
      const distinct = document.getElementById('select-distinct')?.checked;
      const colRows = document.querySelectorAll('#formArea .col-expr');
      const columns = [];
      colRows.forEach((el) => {
        const expr = el.value.trim();
        if (!expr) return;
        const alias = el.closest('.repeatable-row')?.querySelector('.col-alias')?.value.trim();
        columns.push(alias ? `${expr} AS ${alias}` : expr);
      });

      let selectLine = 'SELECT';
      if (distinct) selectLine += ' DISTINCT';
      selectLine += ' ' + (columns.length ? columns.join(',\n       ') : '*');
      parts.push(selectLine);

      // FROM
      const table = document.getElementById('select-table')?.value.trim();
      if (table) parts.push('FROM ' + table);

      // SNAPSHOT
      const snapMode = document.getElementById('select-snap-mode')?.value;
      const snapId1 = document.getElementById('select-snap-id1')?.value.trim();
      const snapId2 = document.getElementById('select-snap-id2')?.value.trim();
      if (snapMode && snapId1) {
        if (snapMode === 'BETWEEN' && snapId2) {
          parts.push(`SNAPSHOT BETWEEN ${snapId1} AND ${snapId2}`);
        } else if (snapMode === 'BETWEEN') {
          parts.push(`SNAPSHOT BETWEEN ${snapId1} AND ...`);
        } else {
          parts.push(`SNAPSHOT ${snapMode} ${snapId1}`);
        }
      }

      // WHERE
      const whereRows = document.querySelectorAll('#formArea .where-field');
      const conditions = [];
      whereRows.forEach((el) => {
        const field = el.value.trim();
        if (!field) return;
        const row = el.closest('.repeatable-row');
        const op = row.querySelector('.where-op')?.value || '=';
        const val = row.querySelector('.where-value')?.value.trim() || '';
        const joiner = row.querySelector('.where-joiner')?.value || 'AND';

        let cond = '';
        if (op === 'IS NULL' || op === 'IS NOT NULL') {
          cond = `${field} ${op}`;
        } else if (op === 'IN') {
          cond = `${field} IN (${val})`;
        } else {
          cond = `${field} ${op} ${val}`;
        }

        if (conditions.length > 0) {
          conditions.push(joiner + ' ' + cond);
        } else {
          conditions.push(cond);
        }
      });
      if (conditions.length) parts.push('WHERE ' + conditions.join('\n  '));

      // GROUP BY
      const groupExprs = [];
      document.querySelectorAll('#formArea .groupby-expr').forEach(el => {
        if (el.value.trim()) groupExprs.push(el.value.trim());
      });
      if (groupExprs.length) parts.push('GROUP BY ' + groupExprs.join(', '));

      // HAVING
      const having = document.getElementById('select-having')?.value.trim();
      if (having) parts.push('HAVING ' + having);

      // ORDER BY
      const orderParts = [];
      document.querySelectorAll('#formArea .orderby-expr').forEach(el => {
        const expr = el.value.trim();
        if (!expr) return;
        const row = el.closest('.repeatable-row');
        const dir = row.querySelector('.orderby-dir')?.value || 'ASC';
        const nulls = row.querySelector('.orderby-nulls')?.value || '';
        orderParts.push(expr + ' ' + dir + (nulls ? ' ' + nulls : ''));
      });
      if (orderParts.length) parts.push('ORDER BY ' + orderParts.join(', '));

      // LIMIT / OFFSET
      const limit = document.getElementById('select-limit')?.value;
      const offset = document.getElementById('select-offset')?.value;
      if (limit) parts.push('LIMIT ' + limit);
      if (offset) parts.push('OFFSET ' + offset);

      return parts.join('\n');
    }
  });
})();
