// Dictionary loader Web Worker
// This runs in a separate thread to avoid blocking the main thread

self.onmessage = function(e) {
  if (e.data.action === 'load') {
    try {
      // Import Typo.js in the worker context
      importScripts(e.data.typoUrl);
      
      // Load dictionary files
      fetch(e.data.affUrl)
        .then(r => r.text())
        .then(affData => {
          return fetch(e.data.dicUrl)
            .then(r => r.text())
            .then(dicData => {
              // Initialize Typo (this is the slow part that blocks)
              const dict = new Typo('en_US', affData, dicData);
              
              // Send back a simple success - we can't send the Typo object
              // So we'll recreate it in the main thread or use a different approach
              self.postMessage({ success: true });
            });
        })
        .catch(err => {
          self.postMessage({ success: false, error: err.message });
        });
    } catch (err) {
      self.postMessage({ success: false, error: err.message });
    }
  }
};
