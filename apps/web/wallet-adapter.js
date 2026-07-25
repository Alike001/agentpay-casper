(() => {
  function directProvider() {
    return typeof window.CasperWalletProvider === "function" ? window.CasperWalletProvider() : null;
  }

  function directEvent(name) {
    return window.CasperWalletEventTypes?.[name] || `casper-wallet:${name[0].toLowerCase()}${name.slice(1)}`;
  }

  window.AgentPayWalletAdapter = { directEvent, directProvider };
})();
