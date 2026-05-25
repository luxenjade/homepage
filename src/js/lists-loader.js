(() => {
  window.CARDS_DATA = window.CARDS_DATA || {};
  document.dispatchEvent(
    new CustomEvent("cards-data-ready", { detail: window.CARDS_DATA }),
  );
  if (typeof window.tryRenderAll === "function") {
    window.tryRenderAll();
  }
  window.CARDS_DATA_READY = Promise.resolve(window.CARDS_DATA);
})();
