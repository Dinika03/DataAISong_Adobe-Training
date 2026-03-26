/**
 * Anonymous Blocks Generator (BEGIN/END with IF/ELSEIF/ELSE)
 */
(function () {
  'use strict';
  const AEP = window.AEPQueryBuilder;

  AEP.registerGenerator('anonymous-blocks', {
    label: 'Anonymous Blocks',
    icon: 'B',

    renderForm(container) {
      // Variables
      const varSection = AEP.createSection(container, 'Variable Declarations', { collapsed: true });
      AEP.createRepeatableGroup(varSection, (row) => {
        const fg1 = document.createElement('div');
        fg1.className = 'form-group';
        fg1.innerHTML = `<label class="form-label">Name</label>
          <input type="text" class="var-name" placeholder="my_var" />`;
        const fg2 = document.createElement('div');
        fg2.className = 'form-group small';
        fg2.innerHTML = `<label class="form-label">Type</label>
          <input type="text" class="var-type" placeholder="varchar" />`;
        const fg3 = document.createElement('div');
        fg3.className = 'form-group';
        fg3.innerHTML = `<label class="form-label">Default Value</label>
          <input type="text" class="var-default" placeholder="optional" />`;
        row.appendChild(fg1);
        row.appendChild(fg2);
        row.appendChild(fg3);
      }, { addLabel: '+ Add Variable' });

      // Conditional Blocks
      const blockSection = AEP.createSection(container, 'Conditional Logic');

      // IF block (always present)
      const ifBlock = document.createElement('div');
      ifBlock.className = 'form-section';
      ifBlock.style.marginBottom = '12px';
      ifBlock.innerHTML = `
        <div class="form-group">
          <label class="form-label">IF Condition</label>
          <input type="text" id="block-if-cond" placeholder="condition_expression" />
        </div>
        <div class="form-group" style="margin-top:8px">
          <label class="form-label">THEN SQL</label>
          <textarea id="block-if-sql" rows="3" placeholder="SQL statements..."></textarea>
        </div>`;
      blockSection.appendChild(ifBlock);

      // ELSEIF blocks (repeatable)
      const elseifLabel = document.createElement('div');
      elseifLabel.className = 'form-label';
      elseifLabel.style.marginTop = '12px';
      elseifLabel.style.marginBottom = '8px';
      elseifLabel.textContent = 'ELSEIF Blocks (optional)';
      blockSection.appendChild(elseifLabel);

      AEP.createRepeatableGroup(blockSection, (row) => {
        const fg1 = document.createElement('div');
        fg1.className = 'form-group';
        fg1.innerHTML = `<label class="form-label">ELSEIF Condition</label>
          <input type="text" class="elseif-cond" placeholder="condition_expression" />`;
        const fg2 = document.createElement('div');
        fg2.className = 'form-group';
        fg2.innerHTML = `<label class="form-label">THEN SQL</label>
          <textarea class="elseif-sql" rows="2" placeholder="SQL statements..."></textarea>`;
        row.appendChild(fg1);
        row.appendChild(fg2);
      }, { addLabel: '+ Add ELSEIF' });

      // ELSE block
      const elseBlock = document.createElement('div');
      elseBlock.style.marginTop = '12px';
      elseBlock.innerHTML = `
        <label class="form-check" style="margin-bottom:8px">
          <input type="checkbox" id="block-has-else"> Include ELSE block
        </label>
        <div id="block-else-section" style="display:none">
          <div class="form-group">
            <label class="form-label">ELSE SQL</label>
            <textarea id="block-else-sql" rows="3" placeholder="SQL statements..."></textarea>
          </div>
        </div>`;
      blockSection.appendChild(elseBlock);

      document.getElementById('block-has-else').addEventListener('change', (e) => {
        document.getElementById('block-else-section').style.display = e.target.checked ? '' : 'none';
        AEP.scheduleUpdate();
      });
    },

    generateSQL() {
      const parts = [];

      // Variables
      const vars = [];
      document.querySelectorAll('#formArea .var-name').forEach(el => {
        const name = el.value.trim();
        if (!name) return;
        const row = el.closest('.repeatable-row');
        const type = row.querySelector('.var-type')?.value.trim() || 'varchar';
        const def = row.querySelector('.var-default')?.value.trim();
        let line = `LET ${name} ${type}`;
        if (def) line += ` := ${def}`;
        vars.push('  ' + line + ';');
      });

      parts.push('DO $$');
      if (vars.length) {
        parts.push('DECLARE');
        parts.push(vars.join('\n'));
      }
      parts.push('BEGIN');

      // IF
      const ifCond = document.getElementById('block-if-cond')?.value.trim();
      const ifSql = document.getElementById('block-if-sql')?.value.trim();
      parts.push(`  IF ${ifCond || 'condition'} THEN`);
      parts.push(AEP.indent(ifSql || '-- SQL statements', 2));

      // ELSEIF blocks
      document.querySelectorAll('#formArea .elseif-cond').forEach(el => {
        const cond = el.value.trim();
        const sql = el.closest('.repeatable-row')?.querySelector('.elseif-sql')?.value.trim();
        if (cond) {
          parts.push(`  ELSEIF ${cond} THEN`);
          parts.push(AEP.indent(sql || '-- SQL statements', 2));
        }
      });

      // ELSE
      const hasElse = document.getElementById('block-has-else')?.checked;
      if (hasElse) {
        const elseSql = document.getElementById('block-else-sql')?.value.trim();
        parts.push('  ELSE');
        parts.push(AEP.indent(elseSql || '-- SQL statements', 2));
      }

      parts.push('  END IF;');
      parts.push('END $$;');

      return parts.join('\n');
    }
  });
})();
