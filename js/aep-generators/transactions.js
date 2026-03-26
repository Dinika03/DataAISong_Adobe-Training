/**
 * Transactions Generator (BEGIN / COMMIT / ROLLBACK)
 */
(function () {
  'use strict';
  const AEP = window.AEPQueryBuilder;

  AEP.registerGenerator('transactions', {
    label: 'Transactions',
    icon: 'X',

    renderForm(container) {
      const section = AEP.createSection(container, 'Transaction');

      const modeRow = document.createElement('div');
      modeRow.className = 'form-row';
      modeRow.innerHTML = `<div class="radio-group">
        <label class="radio-item"><input type="radio" name="txn-op" value="single" checked> Single Statement</label>
        <label class="radio-item"><input type="radio" name="txn-op" value="wrap"> Wrap SQL Block</label>
      </div>`;
      section.appendChild(modeRow);

      // Single statement mode
      const singleDiv = document.createElement('div');
      singleDiv.id = 'txn-single';
      const row1 = document.createElement('div');
      row1.className = 'form-row';
      const { group: opGroup } = AEP.createField('select', 'txn-statement', 'Statement', {
        choices: ['BEGIN', 'COMMIT', 'ROLLBACK'], size: 'medium'
      });
      row1.appendChild(opGroup);
      singleDiv.appendChild(row1);
      section.appendChild(singleDiv);

      // Wrap mode
      const wrapDiv = document.createElement('div');
      wrapDiv.id = 'txn-wrap';
      wrapDiv.style.display = 'none';
      const { group: sqlGroup } = AEP.createField('textarea', 'txn-sql', 'SQL Block', {
        placeholder: 'INSERT INTO ...\nUPDATE ...', rows: 8
      });
      wrapDiv.appendChild(sqlGroup);
      section.appendChild(wrapDiv);

      container.querySelectorAll('input[name="txn-op"]').forEach(r => {
        r.addEventListener('change', (e) => {
          singleDiv.style.display = e.target.value === 'single' ? '' : 'none';
          wrapDiv.style.display = e.target.value === 'wrap' ? '' : 'none';
          AEP.scheduleUpdate();
        });
      });
    },

    generateSQL() {
      const mode = document.querySelector('input[name="txn-op"]:checked')?.value || 'single';

      if (mode === 'single') {
        return document.getElementById('txn-statement')?.value || 'BEGIN';
      }

      const sql = document.getElementById('txn-sql')?.value.trim();
      return `BEGIN;\n\n${sql || '-- Enter SQL statements'}\n\nCOMMIT;`;
    }
  });
})();
