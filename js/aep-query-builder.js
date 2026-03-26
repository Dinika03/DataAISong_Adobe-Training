/**
 * AEP SQL Query Builder - Core Orchestrator
 * Manages generator registry, sidebar navigation, SQL output, and shared utilities.
 */
(function () {
  'use strict';

  const AEP = window.AEPQueryBuilder = {
    generators: {},
    activeGenerator: null,
    _updateTimer: null,

    /* ===== Generator Registry ===== */
    registerGenerator(id, config) {
      // config: { label, icon, renderForm(container), generateSQL(), validate?() }
      this.generators[id] = config;
    },

    /* ===== Initialization ===== */
    init() {
      this._buildSidebar();
      this._bindGlobalEvents();

      // Activate the first generator
      const firstId = Object.keys(this.generators)[0];
      if (firstId) this.activate(firstId);
    },

    /* ===== Sidebar ===== */
    _buildSidebar() {
      const sidebar = document.getElementById('sidebar');
      sidebar.innerHTML = '';
      for (const [id, gen] of Object.entries(this.generators)) {
        const item = document.createElement('div');
        item.className = 'sidebar-item';
        item.dataset.id = id;
        item.innerHTML = `<span class="sidebar-icon">${gen.icon || ''}</span><span>${gen.label}</span>`;
        item.addEventListener('click', () => this.activate(id));
        sidebar.appendChild(item);
      }
    },

    /* ===== Activate Generator ===== */
    activate(id) {
      const gen = this.generators[id];
      if (!gen) return;
      this.activeGenerator = id;

      // Update sidebar active state
      document.querySelectorAll('.sidebar-item').forEach(el => {
        el.classList.toggle('active', el.dataset.id === id);
      });

      // Render form
      const formArea = document.getElementById('formArea');
      formArea.innerHTML = '';
      gen.renderForm(formArea);

      // Attach change listeners to all inputs
      this._attachInputListeners(formArea);

      // Initial SQL generation
      this.updateOutput();
    },

    /* ===== Input Listeners ===== */
    _attachInputListeners(container) {
      const inputs = container.querySelectorAll('input, select, textarea');
      inputs.forEach(el => {
        el.addEventListener('input', () => this.scheduleUpdate());
        el.addEventListener('change', () => this.scheduleUpdate());
      });
    },

    reattachListeners() {
      const formArea = document.getElementById('formArea');
      if (formArea) this._attachInputListeners(formArea);
    },

    scheduleUpdate() {
      clearTimeout(this._updateTimer);
      this._updateTimer = setTimeout(() => this.updateOutput(), 150);
    },

    /* ===== SQL Output ===== */
    updateOutput() {
      const gen = this.generators[this.activeGenerator];
      if (!gen) return;

      let sql = '';
      try {
        sql = gen.generateSQL();
      } catch (e) {
        sql = '-- Error generating SQL: ' + e.message;
      }

      const codeEl = document.getElementById('sqlCode');
      codeEl.innerHTML = this.highlightSQL(sql || '-- Fill in the form to generate SQL');
    },

    /* ===== SQL Syntax Highlighting ===== */
    highlightSQL(sql) {
      // Escape HTML first
      let html = sql.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

      // Comments
      html = html.replace(/(--.*$)/gm, '<span class="sql-comment">$1</span>');

      // Strings (single-quoted)
      html = html.replace(/('(?:[^'\\]|\\.)*')/g, '<span class="sql-string">$1</span>');

      // Numbers
      html = html.replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="sql-number">$1</span>');

      // Keywords
      const keywords = [
        'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'NOT', 'IN', 'IS', 'NULL', 'AS',
        'CREATE', 'TABLE', 'INSERT', 'INTO', 'VALUES', 'ALTER', 'ADD', 'COLUMN',
        'DROP', 'VIEW', 'REPLACE', 'WITH', 'SET', 'BEGIN', 'COMMIT', 'ROLLBACK',
        'DECLARE', 'CURSOR', 'FOR', 'FETCH', 'CLOSE', 'EXPLAIN', 'COPY', 'TO',
        'ORDER', 'BY', 'GROUP', 'HAVING', 'LIMIT', 'OFFSET', 'ASC', 'DESC',
        'NULLS', 'FIRST', 'LAST', 'DISTINCT', 'ALL', 'UNION', 'INTERSECT',
        'EXCEPT', 'MINUS', 'LIKE', 'ILIKE', 'BETWEEN', 'EXISTS', 'CASE', 'WHEN',
        'THEN', 'ELSE', 'END', 'IF', 'ELSEIF', 'SNAPSHOT', 'SINCE', 'TRANSFORM',
        'WINDOW', 'OVER', 'PARTITION', 'LEFT', 'RIGHT', 'INNER', 'OUTER', 'JOIN',
        'ON', 'USING', 'TRUE', 'FALSE', 'PROFILE', 'FORMAT', 'LET', 'DO'
      ];
      const kwPattern = new RegExp('\\b(' + keywords.join('|') + ')\\b', 'gi');
      html = html.replace(kwPattern, (match) => {
        // Don't highlight inside already highlighted spans
        return '<span class="sql-keyword">' + match.toUpperCase() + '</span>';
      });

      // Functions
      const functions = [
        'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'COALESCE', 'CAST', 'STRUCT',
        'INLINE', 'STRING_INDEXER', 'ONE_HOT_ENCODER', 'TOKENIZER',
        'STOP_WORDS_REMOVER', 'NGRAM', 'TF_IDF', 'COUNT_VECTORIZER', 'VECTOR_ASSEMBLER'
      ];
      const fnPattern = new RegExp('\\b(' + functions.join('|') + ')\\s*(?=\\()', 'gi');
      html = html.replace(fnPattern, (match) => '<span class="sql-function">' + match.toUpperCase() + '</span>');

      return html;
    },

    /* ===== Global Events ===== */
    _bindGlobalEvents() {
      // Copy button
      document.getElementById('copyBtn').addEventListener('click', () => {
        const gen = this.generators[this.activeGenerator];
        if (!gen) return;
        const sql = gen.generateSQL();
        this.copyToClipboard(sql);
      });

      // Reset button
      document.getElementById('resetBtn').addEventListener('click', () => {
        if (this.activeGenerator) this.activate(this.activeGenerator);
      });

      // Settings modal
      const modal = document.getElementById('settingsModal');
      document.getElementById('settingsBtn').addEventListener('click', async () => {
        modal.classList.add('active');
        await window.AEPApi.loadConfig();
      });
      document.getElementById('settingsClose').addEventListener('click', () => modal.classList.remove('active'));
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('active');
      });
    },

    /* ===== Utility: Copy to Clipboard ===== */
    copyToClipboard(text) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => this._showCopyToast());
      } else {
        // Fallback
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        this._showCopyToast();
      }
    },

    _showCopyToast() {
      const toast = document.getElementById('copyToast');
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 2000);
    },

    /* ===== Utility: Create Form Field ===== */
    createField(type, id, label, options = {}) {
      const group = document.createElement('div');
      group.className = 'form-group' + (options.size ? ' ' + options.size : '');

      let labelHtml = `<label class="form-label" for="${id}">${label}`;
      if (options.tooltip) {
        labelHtml += ` <span class="tooltip" data-tip="${options.tooltip}">?</span>`;
      }
      if (options.required) labelHtml += ' *';
      labelHtml += '</label>';
      group.innerHTML = labelHtml;

      let input;
      if (type === 'select') {
        input = document.createElement('select');
        input.id = id;
        (options.choices || []).forEach(ch => {
          const opt = document.createElement('option');
          if (typeof ch === 'object') {
            opt.value = ch.value;
            opt.textContent = ch.label;
          } else {
            opt.value = ch;
            opt.textContent = ch;
          }
          input.appendChild(opt);
        });
      } else if (type === 'textarea') {
        input = document.createElement('textarea');
        input.id = id;
        input.placeholder = options.placeholder || '';
        input.rows = options.rows || 4;
      } else {
        input = document.createElement('input');
        input.type = type;
        input.id = id;
        input.placeholder = options.placeholder || '';
        if (options.value !== undefined) input.value = options.value;
      }

      if (options.required) input.required = true;
      group.appendChild(input);

      return { group, input };
    },

    /* ===== Utility: Create Searchable Dataset Dropdown ===== */
    createDatasetDropdown(id, label, options = {}) {
      const group = document.createElement('div');
      group.className = 'form-group' + (options.size ? ' ' + options.size : '');

      let labelHtml = `<label class="form-label" for="${id}">${label}`;
      if (options.tooltip) labelHtml += ` <span class="tooltip" data-tip="${options.tooltip}">?</span>`;
      if (options.required) labelHtml += ' *';
      labelHtml += '</label>';
      group.innerHTML = labelHtml;

      const wrapper = document.createElement('div');
      wrapper.className = 'searchable-dropdown';

      const input = document.createElement('input');
      input.type = 'text';
      input.id = id;
      input.placeholder = options.placeholder || 'Search datasets...';
      input.autocomplete = 'off';

      const list = document.createElement('div');
      list.className = 'dropdown-list';

      wrapper.appendChild(input);
      wrapper.appendChild(list);
      group.appendChild(wrapper);

      // Wire up searchable behavior
      let highlighted = -1;

      const getItems = () => {
        const api = window.AEPApi;
        if (!api || !api.datasets.length) return [];
        const query = input.value.toLowerCase();
        return api.datasets.filter(d =>
          d.name.toLowerCase().includes(query) || d.id.toLowerCase().includes(query)
        );
      };

      const renderList = () => {
        const items = getItems();
        list.innerHTML = '';
        highlighted = -1;
        if (items.length === 0) {
          list.innerHTML = '<div class="dropdown-item" style="color:var(--text-muted)">No datasets found</div>';
          return;
        }
        items.slice(0, 50).forEach((d, i) => {
          const div = document.createElement('div');
          div.className = 'dropdown-item';
          div.innerHTML = `${this._escapeHtml(d.name)}<span class="item-subtitle">${this._escapeHtml(d.id)}</span>`;
          div.addEventListener('mousedown', (e) => {
            e.preventDefault();
            input.value = d.name;
            input.dataset.datasetId = d.id;
            input.dataset.schemaRef = d.schemaRef || '';
            wrapper.classList.remove('open');
            input.dispatchEvent(new Event('change', { bubbles: true }));
            if (options.onSelect) options.onSelect(d);
          });
          list.appendChild(div);
        });
      };

      input.addEventListener('focus', () => { wrapper.classList.add('open'); renderList(); });
      input.addEventListener('input', () => { wrapper.classList.add('open'); renderList(); });
      input.addEventListener('blur', () => { setTimeout(() => wrapper.classList.remove('open'), 200); });

      input.addEventListener('keydown', (e) => {
        const items = list.querySelectorAll('.dropdown-item');
        if (e.key === 'ArrowDown') { e.preventDefault(); highlighted = Math.min(highlighted + 1, items.length - 1); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); highlighted = Math.max(highlighted - 1, 0); }
        else if (e.key === 'Enter' && highlighted >= 0) { e.preventDefault(); items[highlighted]?.dispatchEvent(new Event('mousedown')); }
        else if (e.key === 'Escape') { wrapper.classList.remove('open'); }
        items.forEach((it, i) => it.classList.toggle('highlighted', i === highlighted));
      });

      return { group, input };
    },

    /* ===== Utility: Create Column/Field Dropdown ===== */
    createFieldDropdown(id, label, datasetInputId, options = {}) {
      const group = document.createElement('div');
      group.className = 'form-group' + (options.size ? ' ' + options.size : '');

      let labelHtml = `<label class="form-label" for="${id}">${label}`;
      if (options.tooltip) labelHtml += ` <span class="tooltip" data-tip="${options.tooltip}">?</span>`;
      labelHtml += '</label>';
      group.innerHTML = labelHtml;

      const wrapper = document.createElement('div');
      wrapper.className = 'searchable-dropdown';

      const input = document.createElement('input');
      input.type = 'text';
      input.id = id;
      input.placeholder = options.placeholder || 'Type or select field...';
      input.autocomplete = 'off';

      const list = document.createElement('div');
      list.className = 'dropdown-list';

      wrapper.appendChild(input);
      wrapper.appendChild(list);
      group.appendChild(wrapper);

      const getFields = () => {
        const api = window.AEPApi;
        const dsInput = document.getElementById(datasetInputId);
        if (!api || !dsInput || !dsInput.dataset.schemaRef) return [];
        const schema = api.schemaCache[dsInput.dataset.schemaRef];
        if (!schema) return [];
        const query = input.value.toLowerCase();
        return schema.filter(f => f.path.toLowerCase().includes(query) || f.type.toLowerCase().includes(query));
      };

      const renderList = () => {
        const fields = getFields();
        list.innerHTML = '';
        if (fields.length === 0) {
          list.innerHTML = '<div class="dropdown-item" style="color:var(--text-muted)">No fields available</div>';
          return;
        }
        fields.slice(0, 50).forEach(f => {
          const div = document.createElement('div');
          div.className = 'dropdown-item';
          div.innerHTML = `${this._escapeHtml(f.path)}<span class="item-subtitle">${this._escapeHtml(f.type)}</span>`;
          div.addEventListener('mousedown', (e) => {
            e.preventDefault();
            input.value = f.path;
            wrapper.classList.remove('open');
            input.dispatchEvent(new Event('input', { bubbles: true }));
          });
          list.appendChild(div);
        });
      };

      input.addEventListener('focus', () => { wrapper.classList.add('open'); renderList(); });
      input.addEventListener('input', () => { wrapper.classList.add('open'); renderList(); });
      input.addEventListener('blur', () => { setTimeout(() => wrapper.classList.remove('open'), 200); });

      return { group, input };
    },

    /* ===== Utility: Create Repeatable Group ===== */
    createRepeatableGroup(container, rowFactory, options = {}) {
      const wrapper = document.createElement('div');
      wrapper.className = 'repeatable-group';
      const rowsContainer = document.createElement('div');
      wrapper.appendChild(rowsContainer);

      const addBtn = document.createElement('button');
      addBtn.type = 'button';
      addBtn.className = 'add-row-btn';
      addBtn.textContent = options.addLabel || '+ Add Row';
      wrapper.appendChild(addBtn);

      const self = this;
      let rowCount = 0;

      function addRow(values) {
        const row = document.createElement('div');
        row.className = 'repeatable-row';
        rowFactory(row, rowCount, values);

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'remove-row-btn';
        removeBtn.innerHTML = '&times;';
        removeBtn.addEventListener('click', () => {
          row.remove();
          self.scheduleUpdate();
        });
        row.appendChild(removeBtn);

        rowsContainer.appendChild(row);
        rowCount++;

        // Reattach listeners for new inputs
        self.reattachListeners();
        self.scheduleUpdate();
      }

      addBtn.addEventListener('click', () => addRow());

      // Add initial rows
      const minRows = options.minRows || 0;
      for (let i = 0; i < minRows; i++) addRow();

      container.appendChild(wrapper);

      return {
        wrapper,
        addRow,
        getRows() {
          return Array.from(rowsContainer.querySelectorAll('.repeatable-row'));
        }
      };
    },

    /* ===== Utility: Create Collapsible Section ===== */
    createSection(container, title, options = {}) {
      const section = document.createElement('div');
      section.className = 'form-section' + (options.collapsed ? ' collapsed' : '');

      const titleEl = document.createElement('div');
      titleEl.className = 'form-section-title';
      titleEl.innerHTML = `<span>${title}</span><span class="collapse-icon">&#9660;</span>`;
      titleEl.addEventListener('click', () => section.classList.toggle('collapsed'));

      const content = document.createElement('div');
      content.className = 'form-section-content';

      section.appendChild(titleEl);
      section.appendChild(content);
      container.appendChild(section);

      return content;
    },

    /* ===== Utility: Escape HTML ===== */
    _escapeHtml(str) {
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    },

    /* ===== Utility: Escape SQL single quotes ===== */
    escapeSQL(val) {
      return (val || '').replace(/'/g, "''");
    },

    /* ===== Utility: Indent SQL ===== */
    indent(sql, level) {
      const pad = '  '.repeat(level || 1);
      return sql.split('\n').map(line => pad + line).join('\n');
    }
  };

  // Initialize on DOM ready
  document.addEventListener('DOMContentLoaded', () => AEP.init());
})();
