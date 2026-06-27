const subjects = [
  { name: "地理総合、地理探究", line1: "地理総合", line2: "地理探究" },
  { name: "歴史総合、日本史探究", line1: "歴史総合", line2: "日本史探究" },
  { name: "歴史総合、世界史探究", line1: "歴史総合", line2: "世界史探究" },
  { name: "公共、倫理", line1: "公共", line2: "倫理" },
  { name: "公共、政治・経済", line1: "公共", line2: "政治・経済" },
  {
    name: "地理総合／歴史総合／公共",
    line1: "地理総合",
    line2: "歴史総合／公共",
  },
];

const COLORS = [
  { fill: "#B5D4F4", stroke: "#185FA5", text: "#0C447C" },
  { fill: "#9FE1CB", stroke: "#0F6E56", text: "#085041" },
  { fill: "#FAC775", stroke: "#854F0B", text: "#633806" },
  { fill: "#F5C4B3", stroke: "#993C1D", text: "#712B13" },
  { fill: "#C0DD97", stroke: "#3B6D11", text: "#27500A" },
  { fill: "#CECBF6", stroke: "#534AB7", text: "#3C3489" },
];

const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");
const N = subjects.length;
const R = 148;
const CX = 160,
  CY = 160;
let angle = 0;
let spinning = false;

function drawWheel(a) {
  ctx.clearRect(0, 0, 320, 320);
  const slice = (Math.PI * 2) / N;
  for (let i = 0; i < N; i++) {
    const start = a + i * slice;
    const end = start + slice;
    const c = COLORS[i];
    ctx.beginPath();
    ctx.moveTo(CX, CY);
    ctx.arc(CX, CY, R, start, end);
    ctx.closePath();
    ctx.fillStyle = c.fill;
    ctx.fill();
    ctx.strokeStyle = c.stroke;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.save();
    ctx.translate(CX, CY);
    ctx.rotate(start + slice / 2);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = c.text;
    ctx.font = "bold 12px var(--font-sans)";
    ctx.fillText(subjects[i].line1, R * 0.58, -9);
    ctx.fillText(subjects[i].line2, R * 0.58, 9);
    ctx.restore();
  }

  ctx.beginPath();
  ctx.arc(CX, CY, 10, 0, Math.PI * 2);
  ctx.fillStyle = "var(--color-text-primary)";
  ctx.fill();

  ctx.save();
  ctx.translate(CX, CY - R - 2);
  ctx.beginPath();
  ctx.moveTo(0, 2);
  ctx.lineTo(-10, -22);
  ctx.lineTo(10, -22);
  ctx.closePath();
  ctx.fillStyle = "var(--color-text-primary)";
  ctx.fill();
  ctx.restore();
}

drawWheel(0);

function easeOut(t) {
  return 1 - Math.pow(1 - t, 3);
}

function spin() {
  if (spinning) return;
  spinning = true;
  document.getElementById("btn").disabled = true;
  document.getElementById("res").innerHTML = "";

  const slice = (Math.PI * 2) / N;
  const targetI = Math.floor(Math.random() * N);
  const extra = Math.PI * 2 * (6 + Math.floor(Math.random() * 4));
  const landAngle =
    extra +
    (Math.PI * 2 - (targetI * slice + slice / 2)) +
    (Math.random() * 0.6 - 0.3) * slice;
  const startAngle = angle;
  const duration = 3400;
  const start = performance.now();

  function step(now) {
    const t = Math.min((now - start) / duration, 1);
    angle = startAngle + landAngle * easeOut(t);
    drawWheel(angle);
    if (t < 1) {
      requestAnimationFrame(step);
    } else {
      spinning = false;
      document.getElementById("btn").disabled = false;
      const norm = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      const pointed = (Math.PI * 1.5 - norm + Math.PI * 2) % (Math.PI * 2);
      const idx = Math.floor(pointed / slice) % N;
      document.getElementById("res").innerHTML =
        '<div class="label">選ばれた科目</div><div class="subject">' +
        subjects[idx].name +
        "</div>";
    }
  }
  requestAnimationFrame(step);
}
