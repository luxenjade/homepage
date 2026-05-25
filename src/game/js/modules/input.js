const JOYSTICK_RADIUS = 60;

export function setupInput({ canvas, onPauseToggle, onFirstTouch }) {
  const keys = {};
  const touch = {
    active: false,
    id: null,
    originX: 0,
    originY: 0,
    currentX: 0,
    currentY: 0,
    dx: 0,
    dy: 0,
  };

  function clearInputState() {
    touch.active = false;
    touch.id = null;
    touch.dx = 0;
    touch.dy = 0;
  }

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (typeof onPauseToggle === "function") onPauseToggle();
      return;
    }
    keys[e.key] = true;
    if (e.key === " ") e.preventDefault();
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key))
      e.preventDefault();
  });

  window.addEventListener("keyup", (e) => {
    keys[e.key] = false;
  });

  canvas.addEventListener(
    "touchstart",
    (e) => {
      e.preventDefault();
      if (touch.active) return;
      const t = e.changedTouches[0];
      touch.active = true;
      touch.id = t.identifier;
      touch.originX = touch.currentX = t.clientX;
      touch.originY = touch.currentY = t.clientY;
      touch.dx = 0;
      touch.dy = 0;
      if (typeof onFirstTouch === "function") onFirstTouch();
    },
    { passive: false },
  );

  canvas.addEventListener(
    "touchmove",
    (e) => {
      e.preventDefault();
      for (const t of e.changedTouches) {
        if (t.identifier !== touch.id) continue;
        touch.currentX = t.clientX;
        touch.currentY = t.clientY;
        let dx = touch.currentX - touch.originX;
        let dy = touch.currentY - touch.originY;
        const mag = Math.sqrt(dx * dx + dy * dy);
        if (mag > JOYSTICK_RADIUS) {
          dx = (dx / mag) * JOYSTICK_RADIUS;
          dy = (dy / mag) * JOYSTICK_RADIUS;
        }
        touch.dx = dx / JOYSTICK_RADIUS;
        touch.dy = dy / JOYSTICK_RADIUS;
      }
    },
    { passive: false },
  );

  canvas.addEventListener(
    "touchend",
    (e) => {
      e.preventDefault();
      for (const t of e.changedTouches) {
        if (t.identifier !== touch.id) continue;
        clearInputState();
      }
    },
    { passive: false },
  );

  canvas.addEventListener(
    "touchcancel",
    () => {
      clearInputState();
    },
    { passive: false },
  );

  return { keys, touch, clearInputState };
}
