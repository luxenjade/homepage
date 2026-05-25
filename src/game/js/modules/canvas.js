export function setupCanvas(canvas) {
  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  window.addEventListener("resize", resize);
  resize();

  return { resize };
}
