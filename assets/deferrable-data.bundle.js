// node_modules/@switchthemes/islands/index.js
var deferrableData = (name, data) => {
  if (window.alpineIsInitialized) {
    Alpine.data(name, data);
  } else {
    document.addEventListener("alpine:init", () => {
      Alpine.data(name, data);
    });
  }
};

// _src/js/deferrable-data.js
var deferrable_data_default = deferrableData;
export {
  deferrable_data_default as default
};
