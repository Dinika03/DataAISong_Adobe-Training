/**
 * AEP API Client
 * Loads config from aep-config.json, fetches datasets and schemas from AEP Platform APIs.
 */
(function () {
  'use strict';

  const API = window.AEPApi = {
    config: null,
    datasets: [],
    schemaCache: {},  // keyed by schemaRef URL
    connected: false,

    /* ===== Load Config ===== */
    async loadConfig() {
      try {
        const res = await fetch('aep-config.json');
        if (!res.ok) throw new Error('Config file not found');
        const cfg = await res.json();
        if (!cfg.imsOrgId || cfg.imsOrgId.startsWith('YOUR_')) {
          this.config = null;
          this._updateStatus('offline', 'Not configured');
          return false;
        }
        this.config = cfg;
        this._updateConfigDisplay();
        this._updateStatus('loading', 'Connecting...');
        return true;
      } catch (e) {
        this.config = null;
        this._updateStatus('offline', 'No config');
        return false;
      }
    },

    /* ===== API Headers ===== */
    _headers(extra) {
      return Object.assign({
        'Authorization': 'Bearer ' + this.config.accessToken,
        'x-api-key': this.config.apiKey,
        'x-gw-ims-org-id': this.config.imsOrgId,
        'x-sandbox-name': this.config.sandbox || 'prod'
      }, extra || {});
    },

    /* ===== Fetch Datasets ===== */
    async fetchDatasets() {
      if (!this.config) return [];
      try {
        const url = 'https://platform.adobe.io/data/foundation/catalog/dataSets?limit=100&properties=name,tags,schemaRef';
        const res = await fetch(url, { headers: this._headers() });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();
        this.datasets = Object.entries(data).map(([id, ds]) => ({
          id,
          name: ds.name || id,
          schemaRef: ds.schemaRef ? ds.schemaRef['$id'] || ds.schemaRef.id || '' : '',
          tags: ds.tags || {}
        }));
        this.datasets.sort((a, b) => a.name.localeCompare(b.name));
        this.connected = true;
        this._updateStatus('online', this.datasets.length + ' datasets');
        return this.datasets;
      } catch (e) {
        this.connected = false;
        this._updateStatus('offline', 'Error: ' + e.message);
        return [];
      }
    },

    /* ===== Fetch Schema Fields ===== */
    async fetchSchema(schemaRef) {
      if (!this.config || !schemaRef) return [];
      if (this.schemaCache[schemaRef]) return this.schemaCache[schemaRef];

      try {
        const url = 'https://platform.adobe.io/data/foundation/schemaregistry/global/schemas/' + encodeURIComponent(schemaRef);
        const res = await fetch(url, {
          headers: this._headers({ 'Accept': 'application/vnd.adobe.xed-full+json;version=1' })
        });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const schema = await res.json();
        const fields = this._flattenSchema(schema);
        this.schemaCache[schemaRef] = fields;
        return fields;
      } catch (e) {
        console.warn('Failed to fetch schema:', e);
        return [];
      }
    },

    /* ===== Flatten Schema into field paths ===== */
    _flattenSchema(schema, prefix, result) {
      result = result || [];
      prefix = prefix || '';
      const props = schema.properties || {};
      for (const [key, val] of Object.entries(props)) {
        const path = prefix ? prefix + '.' + key : key;
        const type = val.type || (val['$ref'] ? 'object' : 'unknown');
        if (type === 'object' && val.properties) {
          this._flattenSchema(val, path, result);
        } else if (type === 'array' && val.items && val.items.properties) {
          result.push({ path, type: 'array<object>' });
          this._flattenSchema(val.items, path, result);
        } else {
          result.push({ path, type });
        }
      }
      return result;
    },

    /* ===== Test Connection ===== */
    async testConnection() {
      const resultEl = document.getElementById('testResult');
      resultEl.className = 'test-result';
      resultEl.style.display = 'none';

      if (!this.config) {
        resultEl.className = 'test-result error';
        resultEl.textContent = 'No valid config loaded. Edit aep-config.json first.';
        return false;
      }

      try {
        resultEl.className = 'test-result';
        resultEl.style.display = 'block';
        resultEl.textContent = 'Testing...';

        const datasets = await this.fetchDatasets();
        if (datasets.length > 0) {
          resultEl.className = 'test-result success';
          resultEl.textContent = 'Connected! Found ' + datasets.length + ' datasets.';
          return true;
        } else {
          resultEl.className = 'test-result error';
          resultEl.textContent = 'Connected but no datasets found.';
          return false;
        }
      } catch (e) {
        resultEl.className = 'test-result error';
        resultEl.textContent = 'Connection failed: ' + e.message;
        return false;
      }
    },

    /* ===== UI Updates ===== */
    _updateStatus(state, text) {
      const el = document.getElementById('connectionStatus');
      if (!el) return;
      const dot = el.querySelector('.status-dot');
      const txt = el.querySelector('.status-text');
      dot.className = 'status-dot ' + state;
      txt.textContent = text || state;
    },

    _updateConfigDisplay() {
      if (!this.config) return;
      const c = this.config;
      document.getElementById('cfgOrg').textContent = c.imsOrgId || '—';
      document.getElementById('cfgSandbox').textContent = c.sandbox || 'prod';
      document.getElementById('cfgApiKey').textContent = c.apiKey ? c.apiKey.slice(0, 8) + '...' : '—';
      document.getElementById('cfgToken').textContent = c.accessToken ? c.accessToken.slice(0, 12) + '...' : '—';
    }
  };

  /* ===== Initialize on DOM Ready ===== */
  document.addEventListener('DOMContentLoaded', async () => {
    const loaded = await API.loadConfig();
    if (loaded) {
      await API.fetchDatasets();
    }

    // Settings modal buttons
    document.getElementById('testConnectionBtn').addEventListener('click', () => API.testConnection());
    document.getElementById('refreshDatasetsBtn').addEventListener('click', async () => {
      await API.loadConfig();
      await API.fetchDatasets();
    });
  });
})();
