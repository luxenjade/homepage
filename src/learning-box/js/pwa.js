if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/learning-box/service-worker.js").catch(() => {});
  });
}
