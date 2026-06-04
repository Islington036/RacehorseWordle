(function attachStorage(root) {
  const RHW = root.RHW || {};

  function createMemoryStorage() {
    const values = new Map();
    return {
      getItem(key) {
        return values.has(key) ? values.get(key) : null;
      },
      setItem(key, value) {
        values.set(key, String(value));
      },
      removeItem(key) {
        values.delete(key);
      }
    };
  }

  function getBackend() {
    try {
      const testKey = "__rhw_storage_test__";
      root.localStorage.setItem(testKey, "1");
      root.localStorage.removeItem(testKey);
      return root.localStorage;
    } catch (error) {
      return createMemoryStorage();
    }
  }

  const backend = getBackend();

  function readJson(key, fallback) {
    try {
      const raw = backend.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch (error) {
      return fallback;
    }
  }

  function writeJson(key, value) {
    try {
      backend.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      return false;
    }
  }

  function remove(key) {
    try {
      backend.removeItem(key);
    } catch (error) {
      // Storage is best-effort only.
    }
  }

  const api = { readJson, writeJson, remove };
  root.RHW = Object.assign(RHW, { storage: api });
  if (typeof module !== "undefined") {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : window);
