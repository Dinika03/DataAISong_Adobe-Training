/**
 * CTAS (CREATE TABLE AS SELECT) Generator
 */
(function () {
  'use strict';
  const AEP = window.AEPQueryBuilder;

  AEP.registerGenerator('ctas', {
    label: 'CTAS',
    icon: 'T',

    renderForm(container) {
      // Table Name
      const basicSection = AEP.createSection(container, 'Table Definition');
      const row1 = document.createElement('div');
      row1.className = 'form-row';
      const { group: nameGroup } = AEP.createField('text', 'ctas-table', 'Table Name', {
        required: true, placeholder: 'new_table_name',
        tooltip: 'Alphanumeric and underscores only'
      });
      row1.appendChild(nameGroup);
      basicSection.appendChild(row1);

      // WITH options
      const withSection = AEP.createSection(container, 'WITH Options');
      const row2 = document.createElement('div');
      row2.className = 'form-row';
      const { group: schemaGroup } = AEP.createField('text', 'ctas-schema', 'Schema', {
        placeholder: 'XDM schema title', tooltip: 'Associate with an existing XDM schema'
      });
      const { group: labelGroup } = AEP.createField('select', 'ctas-label', 'Label', {
        choices: [{ value: '', label: 'None' }, { value: 'PROFILE', label: 'PROFILE' }],
        tooltip: 'Enable Profile ingestion', size: 'medium'
      });
      row2.appendChild(schemaGroup);
      row2.appendChild(labelGroup);
      withSection.appendChild(row2);

      const row3 = document.createElement('div');
      row3.className = 'form-row';
      row3.innerHTML = `<label class="form-check">
        <input type="checkbox" id="ctas-rowvalidation" checked> Row Validation (default: enabled)
      </label>`;
      withSection.appendChild(row3);

      // TRANSFORM
      const transformSection = AEP.createSection(container, 'TRANSFORM Functions', { collapsed: true });
      AEP.createRepeatableGroup(transformSection, (row) => {
        const fg1 = document.createElement('div');
        fg1.className = 'form-group medium';
        fg1.innerHTML = `<label class="form-label">Function</label>
          <select class="transform-fn">
            <option value="">Select...</option>
            <option>String_Indexer</option>
            <option>one_hot_encoder</option>
            <option>tokenizer</option>
            <option>stop_words_remover</option>
            <option>ngram</option>
            <option>tf_idf</option>
            <option>count_vectorizer</option>
            <option>vector_assembler</option>
          </select>`;
        const fg2 = document.createElement('div');
        fg2.className = 'form-group';
        fg2.innerHTML = `<label class="form-label">Parameters</label>
          <input type="text" class="transform-params" placeholder="e.g. column1 column2 new_col" />`;
        row.appendChild(fg1);
        row.appendChild(fg2);
      }, { addLabel: '+ Add Transform Function' });

      // SELECT Query
      const selectSection = AEP.createSection(container, 'SELECT Query');
      const { group: queryGroup } = AEP.createField('textarea', 'ctas-query', 'SELECT Statement', {
        required: true, placeholder: 'SELECT * FROM source_table WHERE ...', rows: 8
      });
      selectSection.appendChild(queryGroup);
    },

    generateSQL() {
      const table = document.getElementById('ctas-table')?.value.trim();
      const schema = document.getElementById('ctas-schema')?.value.trim();
      const label = document.getElementById('ctas-label')?.value;
      const rowVal = document.getElementById('ctas-rowvalidation')?.checked;
      const query = document.getElementById('ctas-query')?.value.trim();

      if (!table) return '-- Enter a table name';

      const parts = [`CREATE TABLE ${table}`];

      // WITH clause
      const withOpts = [];
      if (schema) withOpts.push(`schema='${AEP.escapeSQL(schema)}'`);
      if (!rowVal) withOpts.push("rowvalidation='false'");
      if (label) withOpts.push(`label='${label}'`);
      if (withOpts.length) parts.push(`  WITH (${withOpts.join(', ')})`);

      // TRANSFORM clause
      const transforms = [];
      document.querySelectorAll('#formArea .transform-fn').forEach(el => {
        const fn = el.value;
        const params = el.closest('.repeatable-row')?.querySelector('.transform-params')?.value.trim();
        if (fn && params) transforms.push(`${fn}(${params})`);
      });
      if (transforms.length) parts.push(`  TRANSFORM (${transforms.join(', ')})`);

      // AS (SELECT ...)
      parts.push('AS (');
      parts.push(query ? AEP.indent(query, 1) : '  -- Enter SELECT query');
      parts.push(')');

      return parts.join('\n');
    }
  });
})();
