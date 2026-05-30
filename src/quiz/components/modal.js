(function () {
  let modalEl = null;
  let titleEl = null;
  let bodyEl = null;

  function ensureModal() {
    if (modalEl) return;

    modalEl = document.createElement("div");
    modalEl.className = "qz-modal hidden";
    modalEl.setAttribute("role", "dialog");
    modalEl.setAttribute("aria-modal", "true");
    modalEl.innerHTML = `
      <div class="qz-modal__panel">
        <div class="qz-modal__header">
          <span class="qz-modal__title"></span>
          <button
            class="qz-btn qz-btn--ghost qz-btn--sm qz-modal__close"
            type="button"
            aria-label="閉じる"
          >
            ✕
          </button>
        </div>
        <div class="qz-modal__body"></div>
      </div>
    `;

    document.body.appendChild(modalEl);

    titleEl = modalEl.querySelector(".qz-modal__title");
    bodyEl = modalEl.querySelector(".qz-modal__body");

    modalEl.addEventListener("click", (e) => {
      if (e.target === modalEl) {
        closeQuizModal();
      }
    });

    modalEl
      .querySelector(".qz-modal__close")
      .addEventListener("click", closeQuizModal);

    document.addEventListener("keydown", (e) => {
      if (
        e.key === "Escape" &&
        modalEl &&
        !modalEl.classList.contains("hidden")
      ) {
        closeQuizModal();
      }
    });
  }

  window.openQuizModal = function ({ title = "", html = "", className = "" }) {
    ensureModal();

    modalEl.className = "qz-modal";
    if (className) modalEl.classList.add(className);

    titleEl.textContent = title;
    bodyEl.innerHTML = html;

    modalEl.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  };

  window.closeQuizModal = function () {
    if (!modalEl) return;
    modalEl.classList.add("hidden");
    bodyEl.innerHTML = "";
    document.body.style.overflow = "";
  };
})();
