const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('api', {
  fetchData: async (url, options) => {
    const res = await fetch(url, options);
    return await res.json();
  }
});