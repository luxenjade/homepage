import {
  MAX_LIVES,
  PLAYER_SPEED,
  ENEMY_BASE_SPEED,
  INVINCIBLE_MS,
  WEAPONS,
  WEAPON_ORDER,
  WEAPON_DURATION,
  COMBO_WINDOW,
  SHAKE_DECAY,
} from "./modules/constants.js";
import { playSound, toggleMute, isMuted } from "./modules/audio.js";
import { setupInput } from "./modules/input.js";
import { setupCanvas } from "./modules/canvas.js";

// ── STATE ──
let state = {};
let animId = null;
let paused = false;
let highScore = parseInt(localStorage.getItem("dodge_hs") || "0");

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const { resize } = setupCanvas(canvas);

const input = setupInput({
  canvas,
  onPauseToggle: () => (paused ? resumeGame() : pauseGame()),
  onFirstTouch: () => {
    const hint = document.getElementById("touch-hint");
    if (hint) hint.style.opacity = "0";
  },
});
const { keys, touch } = input;

// ── SCREENS ──
const scrStart = document.getElementById("screen-start");
const scrOver = document.getElementById("screen-over");
const gameWrap = document.getElementById("game-wrap");
document.getElementById("hs-display").textContent = highScore;
document.getElementById("hs-display2").textContent = highScore;

document.getElementById("btn-start").onclick = startGame;
document.getElementById("btn-restart").onclick = startGame;

// ── PAUSE ──
const pauseOverlay = document.getElementById("pause-overlay");

function pauseGame() {
  if (state.gameOver || paused) return;
  paused = true;
  cancelAnimationFrame(animId);
  document.getElementById("pause-score-val").textContent = state.score;
  document.getElementById("icon-pause").style.display = "none";
  document.getElementById("icon-play").style.display = "block";
  pauseOverlay.classList.remove("hidden");
  input.clearInputState();
}

function resumeGame() {
  if (!paused) return;
  paused = false;
  pauseOverlay.classList.add("hidden");
  document.getElementById("icon-pause").style.display = "block";
  document.getElementById("icon-play").style.display = "none";
  loop();
}

document.getElementById("btn-pause").onclick = () =>
  paused ? resumeGame() : pauseGame();
document.getElementById("btn-resume").onclick = resumeGame;
document.getElementById("btn-quit").onclick = () => {
  paused = false;
  pauseOverlay.classList.add("hidden");
  endGame();
};

// ── MUTE ──
document.getElementById("btn-mute").onclick = () => {
  const mutedNow = toggleMute();
  document.getElementById("icon-sound-on").style.display = mutedNow
    ? "none"
    : "block";
  document.getElementById("icon-sound-off").style.display = mutedNow
    ? "block"
    : "none";
};

if (isMuted()) {
  document.getElementById("icon-sound-on").style.display = "none";
  document.getElementById("icon-sound-off").style.display = "block";
}

// ── PARTICLES ──
function spawnParticles(x, y, color, count = 8) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 4;
    state.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      r: 2 + Math.random() * 3,
      life: 1,
      color,
    });
  }
}

// ── INIT ──
function startGame() {
  scrStart.classList.add("hidden");
  scrOver.classList.add("hidden");
  gameWrap.classList.remove("hidden");

  resize();

  const cx = canvas.width / 2;
  const cy = canvas.height / 2;

  state = {
    player: { x: cx, y: cy, r: 14, vx: 0, vy: 0, invincible: 0, shielded: 0 },
    bullets: [],
    enemies: [],
    drops: [],
    particles: [],
    score: 0,
    lives: MAX_LIVES,
    level: 1,
    frame: 0,
    spawnInterval: 90,
    spawnTimer: 0,
    gameOver: false,
    scoreTimer: 0,
    weapon: "single",
    weaponTimer: 0,
    combo: 0,
    comboTimer: 0,
    shakeX: 0,
    shakeY: 0,
    boss: null,
    bossCount: 0,
    bossShootTimer: 0,
    bossBullets: [],
    // stats
    statKills: 0,
    statMaxCombo: 0,
    statDrops: 0,
  };

  updateLivesDots();
  document.getElementById("hud-score").textContent = "0";
  document.getElementById("hud-level").textContent = "1";
  updateWeaponHUD();
  document.getElementById("boss-hud").classList.remove("visible");
  paused = false;
  pauseOverlay.classList.add("hidden");
  document.getElementById("icon-pause").style.display = "block";
  document.getElementById("icon-play").style.display = "none";

  if (animId) cancelAnimationFrame(animId);
  loop();
}

// ── BOSS ──
function spawnBoss() {
  const s = state;
  const W = canvas.width;
  s.bossCount++;
  const maxHp = 80 + (s.bossCount - 1) * 40;
  s.boss = {
    x: W / 2,
    y: -60, // starts off-screen top
    r: 38,
    hp: maxHp,
    maxHp,
    phase: 1, // 1 = charge, 2 = spread
    vx: 0,
    vy: 1.5, // entering slowly
    entering: true,
    shootTimer: 0,
    angle: 0,
  };
  s.enemies = []; // clear normal enemies
  s.bossShootTimer = 0;
  document.getElementById("boss-name").textContent = `BOSS ${s.bossCount}`;
  document.getElementById("boss-hud").classList.add("visible");
  updateBossHPBar();
  playSound("boss_spawn");
  showToast(`⚠ BOSS ${s.bossCount}`, "#f97316");
  triggerShake(10);
}

function updateBossHPBar() {
  const b = (s) => state.boss;
  const boss = state.boss;
  if (!boss) return;
  const pct = (boss.hp / boss.maxHp) * 100;
  const fill = document.getElementById("boss-hp-fill");
  fill.style.width = pct + "%";
  fill.style.background =
    pct > 50
      ? "linear-gradient(90deg,#f97316,#ef4444)"
      : "linear-gradient(90deg,#ef4444,#dc2626)";
}

function drawBoss(boss) {
  const phase2 = boss.phase === 2;
  const col = phase2 ? "#ef4444" : "#f97316";
  const glow = phase2 ? "#dc2626" : "#ea580c";

  ctx.save();
  ctx.translate(boss.x, boss.y);
  boss.angle += phase2 ? 0.03 : 0.015;

  // outer ring
  ctx.strokeStyle = col;
  ctx.shadowColor = glow;
  ctx.shadowBlur = 30;
  ctx.lineWidth = 3;
  ctx.globalAlpha = 0.4 + Math.sin(boss.angle * 3) * 0.2;
  ctx.beginPath();
  ctx.arc(0, 0, boss.r + 12, 0, Math.PI * 2);
  ctx.stroke();

  // body  E8-point star shape
  ctx.globalAlpha = 1;
  ctx.fillStyle = col;
  ctx.shadowBlur = 24;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = boss.angle + ((Math.PI * 2) / 8) * i;
    const ri = i % 2 === 0 ? boss.r : boss.r * 0.55;
    const px = Math.cos(a) * ri;
    const py = Math.sin(a) * ri;
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();

  // core
  ctx.shadowBlur = 12;
  ctx.fillStyle = phase2 ? "#fca5a5" : "#fed7aa";
  ctx.beginPath();
  ctx.arc(0, 0, boss.r * 0.35, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function updateBoss() {
  const s = state;
  const boss = s.boss;
  const p = s.player;
  const W = canvas.width,
    H = canvas.height;

  // entering phase  Eslide in from top
  if (boss.entering) {
    boss.y += boss.vy;
    if (boss.y >= 100) {
      boss.entering = false;
      boss.vy = 0;
    }
    return;
  }

  // switch to phase 2 at 50% HP
  if (boss.phase === 1 && boss.hp <= boss.maxHp * 0.5) {
    boss.phase = 2;
    showToast("⚠ PHASE 2", "#ef4444");
    triggerShake(8);
  }

  const speed = boss.phase === 2 ? 2.2 : 1.4;
  const shootCd = boss.phase === 2 ? 55 : 90;
  const bulletCount = boss.phase === 2 ? 8 : 5;

  // move toward player with slight lag
  const ddx = p.x - boss.x;
  const ddy = p.y - boss.y;
  const mag = Math.sqrt(ddx * ddx + ddy * ddy) || 1;
  boss.vx += ((ddx / mag) * speed - boss.vx) * 0.04;
  boss.vy += ((ddy / mag) * speed - boss.vy) * 0.04;
  boss.x = Math.max(boss.r, Math.min(W - boss.r, boss.x + boss.vx));
  boss.y = Math.max(boss.r, Math.min(H * 0.7, boss.y + boss.vy));

  // shoot radial burst
  boss.shootTimer++;
  if (boss.shootTimer >= shootCd) {
    boss.shootTimer = 0;
    playSound("boss_shoot");
    for (let i = 0; i < bulletCount; i++) {
      const a = ((Math.PI * 2) / bulletCount) * i + boss.angle;
      s.bossBullets.push({
        x: boss.x,
        y: boss.y,
        vx: Math.cos(a) * 3.5,
        vy: Math.sin(a) * 3.5,
        r: 6,
      });
    }
  }

  // boss bullets hit player
  s.bossBullets = s.bossBullets.filter((bb) => {
    bb.x += bb.vx;
    bb.y += bb.vy;
    if (bb.x < -20 || bb.x > W + 20 || bb.y < -20 || bb.y > H + 20)
      return false;
    if (p.invincible <= 0 && dist(p, bb) < p.r + bb.r) {
      if (p.shielded > 0) {
        p.shielded = 0;
        p.invincible = INVINCIBLE_MS;
        triggerShake(6);
        playSound("hit");
        showToast("SHIELD BROKEN", "#10b981");
        spawnParticles(p.x, p.y, "#10b981", 14);
      } else {
        s.lives--;
        p.invincible = INVINCIBLE_MS;
        updateLivesDots();
        spawnParticles(p.x, p.y, "#a78bfa", 12);
        triggerShake(10);
        playSound("hit");
        gameWrap.classList.toggle("danger", s.lives === 1);
        if (s.lives <= 0) {
          endGame();
        }
      }
      return false;
    }
    return true;
  });

  // player bullets hit boss
  s.bullets = s.bullets.filter((b) => {
    if (dist(b, boss) < b.r + boss.r) {
      boss.hp--;
      updateBossHPBar();
      spawnParticles(b.x, b.y, boss.phase === 2 ? "#fca5a5" : "#fed7aa", 3);
      if (boss.hp <= 0) {
        // boss dead
        playSound("boss_die");
        triggerShake(20);
        spawnParticles(boss.x, boss.y, "#f97316", 40);
        spawnParticles(boss.x, boss.y, "#ffffff", 20);
        const combo = registerKill(boss.x, boss.y);
        s.score += 200 * Math.max(1, combo);
        s.statKills++;
        document.getElementById("hud-score").textContent = s.score;
        document.getElementById("boss-hud").classList.remove("visible");
        s.boss = null;
        s.bossBullets = [];
        // guaranteed drop  Ealways life if missing one, otherwise weapon
        if (s.lives < MAX_LIVES) {
          s.drops.push({
            x: boss.x,
            y: boss.y,
            r: 9,
            type: "life",
            color: "#f43f5e",
            life: 8000,
            pulse: 0,
          });
        } else {
          const cur = WEAPON_ORDER.indexOf(s.weapon);
          const nw = WEAPON_ORDER[Math.min(WEAPON_ORDER.length - 1, cur + 1)];
          s.drops.push({
            x: boss.x,
            y: boss.y,
            r: 9,
            type: "weapon",
            weapon: nw,
            color: WEAPONS[nw].color,
            life: 8000,
            pulse: 0,
          });
        }
        showToast("BOSS DEFEATED!", "#f97316");
        return false;
      }
      return false;
    }
    return true;
  });
}

// ── DRAW BOSS BULLETS ──
function drawBossBullet(bb) {
  ctx.save();
  ctx.shadowColor = "#f97316";
  ctx.shadowBlur = 14;
  ctx.fillStyle = "#fed7aa";
  ctx.beginPath();
  ctx.arc(bb.x, bb.y, bb.r, 0, Math.PI * 2);
  ctx.fill();
  // inner core
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(bb.x, bb.y, bb.r * 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// ── LEVEL THRESHOLDS ──
// Lv1ↁE: 400, Lv2ↁE: 1200, Lv3ↁE: 2000, +800 each level after
function thresholdForLevel(lv) {
  if (lv === 1) return 400;
  return 400 + (lv - 1) * 800;
}

// ── LEVEL UP ──
function levelUp() {
  state.level++;
  state.spawnInterval = Math.max(25, state.spawnInterval - 8);
  document.getElementById("hud-level").textContent = state.level;
  playSound("levelup");
  const badge = document.getElementById("level-badge");
  badge.textContent = `LEVEL ${state.level}`;
  badge.style.opacity = "1";
  setTimeout(() => {
    badge.style.opacity = "0";
  }, 1200);

  // boss every 4 levels
  if (state.level % 4 === 0 && !state.boss) {
    setTimeout(() => spawnBoss(), 600);
  }
}

// ── WEAPON HUD ──
function updateWeaponHUD() {
  const w = WEAPONS[state.weapon];
  const nameEl = document.getElementById("weapon-name");
  const bar = document.getElementById("weapon-timer-bar");
  const fill = document.getElementById("weapon-timer-fill");
  nameEl.textContent = w.name;
  nameEl.style.color = w.color;
  nameEl.style.textShadow = `0 0 12px ${w.color}`;
  if (state.weapon === "single") {
    bar.classList.add("hidden-bar");
  } else {
    bar.classList.remove("hidden-bar");
    const pct = (state.weaponTimer / WEAPON_DURATION) * 100;
    fill.style.width = pct + "%";
    fill.style.background = pct < 30 ? "#f87171" : w.color;
  }
}

// ── PICKUP TOAST ──
let toastTimeout = null;
function showToast(text, color) {
  const el = document.getElementById("pickup-toast");
  el.textContent = text;
  el.style.color = color;
  el.style.textShadow = `0 0 20px ${color}`;
  el.style.opacity = "1";
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    el.style.opacity = "0";
  }, 900);
}

// ── DROP SPAWN ──
function maybeSpawnDrop(x, y, enemyType) {
  const chance =
    enemyType === "large" ? 0.55 : enemyType === "fast" ? 0.32 : 0.18;
  if (Math.random() > chance) return;

  const roll = Math.random();

  // life drop: 10% chance, only if missing a life
  if (roll < 0.1 && state.lives < MAX_LIVES) {
    state.drops.push({
      x,
      y,
      r: 9,
      type: "life",
      color: "#f43f5e",
      life: 6000,
      pulse: 0,
    });
    return;
  }

  // shield drop: 20% chance
  if (roll < 0.3) {
    state.drops.push({
      x,
      y,
      r: 9,
      type: "shield",
      color: "#10b981",
      life: 5000,
      pulse: 0,
    });
    return;
  }

  // weapon drop
  const cur = WEAPON_ORDER.indexOf(state.weapon);
  const nextWeapon =
    cur < WEAPON_ORDER.length - 1 ? WEAPON_ORDER[cur + 1] : state.weapon;
  const dropColor = WEAPONS[nextWeapon].color;
  state.drops.push({
    x,
    y,
    r: 9,
    type: "weapon",
    weapon: nextWeapon,
    color: dropColor,
    life: 5000,
    pulse: 0,
  });
}

// ── DRAW DROP ──
function drawDrop(d) {
  d.pulse = (d.pulse + 0.07) % (Math.PI * 2);
  const glow = 10 + Math.sin(d.pulse) * 5;
  ctx.save();
  ctx.shadowColor = d.color;
  ctx.shadowBlur = glow;
  // outer ring
  ctx.strokeStyle = d.color;
  ctx.lineWidth = 1.5;
  ctx.globalAlpha = 0.6 + Math.sin(d.pulse) * 0.2;
  ctx.beginPath();
  ctx.arc(d.x, d.y, d.r + 4, 0, Math.PI * 2);
  ctx.stroke();
  // inner fill
  ctx.globalAlpha = 1;
  ctx.fillStyle = d.color;
  ctx.beginPath();
  ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
  ctx.fill();
  // icon letter
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#07080f";
  ctx.font = `bold ${Math.round(d.r * 1.1)}px 'JetBrains Mono', monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const icon =
    d.type === "life"
      ? "+"
      : d.type === "shield"
        ? "S"
        : d.weapon === "spread"
          ? "W"
          : "A";
  ctx.fillText(icon, d.x, d.y + 1);
  ctx.restore();
}

// ── COMBO ──
let comboTimeout = null;
function registerKill(x, y) {
  const s = state;
  s.combo++;
  s.statKills++;
  if (s.combo > s.statMaxCombo) s.statMaxCombo = s.combo;
  clearTimeout(comboTimeout);
  if (s.combo >= 2) {
    const el = document.getElementById("combo-display");
    el.textContent = `${s.combo} COMBO`;
    el.style.opacity = "1";
    el.style.fontSize = `clamp(${0.9 + s.combo * 0.1}rem, 3vw, ${1.2 + s.combo * 0.12}rem)`;
  }
  comboTimeout = setTimeout(() => {
    state.combo = 0;
    document.getElementById("combo-display").style.opacity = "0";
  }, COMBO_WINDOW);
  return s.combo;
}

// ── SCREEN SHAKE ──
function triggerShake(strength = 8) {
  state.shakeX = (Math.random() - 0.5) * strength * 2;
  state.shakeY = (Math.random() - 0.5) * strength * 2;
}

// ── LIVES ──
function updateLivesDots() {
  const el = document.getElementById("lives-dots");
  el.innerHTML = "";
  for (let i = 0; i < MAX_LIVES; i++) {
    const d = document.createElement("div");
    d.className = "life-dot" + (i >= state.lives ? " dead" : "");
    el.appendChild(d);
  }
}

// ── ENEMY FACTORY ──
function spawnEnemy() {
  const W = canvas.width,
    H = canvas.height;
  const edge = Math.floor(Math.random() * 4);
  let x, y, vx, vy;
  const speed =
    ENEMY_BASE_SPEED + (state.level - 1) * 0.3 + Math.random() * 0.8;
  const r = 8 + Math.random() * 10;

  if (edge === 0) {
    x = Math.random() * W;
    y = -r;
  } else if (edge === 1) {
    x = W + r;
    y = Math.random() * H;
  } else if (edge === 2) {
    x = Math.random() * W;
    y = H + r;
  } else {
    x = -r;
    y = Math.random() * H;
  }

  // aim toward player with slight random offset
  const dx = state.player.x - x + (Math.random() - 0.5) * 120;
  const dy = state.player.y - y + (Math.random() - 0.5) * 120;
  const mag = Math.sqrt(dx * dx + dy * dy) || 1;
  vx = (dx / mag) * speed;
  vy = (dy / mag) * speed;

  // enemy type
  const roll = Math.random();
  let type = "normal";
  if (state.level >= 3 && roll < 0.15) type = "fast";
  else if (state.level >= 5 && roll < 0.25) type = "large";

  state.enemies.push({
    x,
    y,
    r: type === "large" ? r * 1.8 : r,
    vx,
    vy,
    type,
    hp: type === "large" ? 3 : 1,
  });
}

// ── DRAW HELPERS ──
function glowCircle(x, y, r, color, glow = 15) {
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = glow;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawPlayer(p) {
  if (p.invincible > 0 && Math.floor(p.invincible / 100) % 2 === 0) return;

  ctx.save();
  ctx.translate(p.x, p.y);

  // body glow
  ctx.shadowColor = "#7c3aed";
  ctx.shadowBlur = 18;

  // triangle ship
  ctx.fillStyle = "#c4b5fd";
  ctx.beginPath();
  ctx.moveTo(0, -p.r);
  ctx.lineTo(p.r * 0.8, p.r * 0.7);
  ctx.lineTo(-p.r * 0.8, p.r * 0.7);
  ctx.closePath();
  ctx.fill();

  // cockpit
  ctx.shadowBlur = 8;
  ctx.fillStyle = "#a78bfa";
  ctx.beginPath();
  ctx.arc(0, -p.r * 0.2, p.r * 0.35, 0, Math.PI * 2);
  ctx.fill();

  // engine glow
  ctx.shadowColor = "#06b6d4";
  ctx.shadowBlur = 14;
  ctx.fillStyle = "#67e8f9";
  ctx.beginPath();
  ctx.arc(-p.r * 0.4, p.r * 0.55, 4, 0, Math.PI * 2);
  ctx.arc(p.r * 0.4, p.r * 0.55, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawBullet(b) {
  ctx.save();
  ctx.shadowColor = b.glow || "#67e8f9";
  ctx.shadowBlur = b.laser ? 18 : 10;
  ctx.fillStyle = b.color || "#e0f2fe";
  ctx.beginPath();
  if (b.laser) {
    // elongated capsule for laser
    ctx.roundRect(b.x - b.r * 0.5, b.y - b.r * 1.8, b.r, b.r * 3.2, b.r * 0.5);
  } else {
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
  }
  ctx.fill();
  ctx.restore();
}

function drawEnemy(e) {
  const colors = {
    normal: { fill: "#f87171", glow: "#ef4444" },
    fast: { fill: "#fbbf24", glow: "#f59e0b" },
    large: { fill: "#f472b6", glow: "#ec4899" },
  };
  const c = colors[e.type];
  ctx.save();
  ctx.shadowColor = c.glow;
  ctx.shadowBlur = 20;
  ctx.fillStyle = c.fill;

  if (e.type === "large") {
    // octagon-ish
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = ((Math.PI * 2) / 6) * i - Math.PI / 2;
      const mx = e.x + Math.cos(a) * e.r;
      const my = e.y + Math.sin(a) * e.r;
      i === 0 ? ctx.moveTo(mx, my) : ctx.lineTo(mx, my);
    }
    ctx.closePath();
  } else if (e.type === "fast") {
    // diamond
    ctx.beginPath();
    ctx.moveTo(e.x, e.y - e.r);
    ctx.lineTo(e.x + e.r, e.y);
    ctx.lineTo(e.x, e.y + e.r);
    ctx.lineTo(e.x - e.r, e.y);
    ctx.closePath();
  } else {
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
  }
  ctx.fill();
  ctx.restore();
}

// ── SHOOT ──
let lastShot = 0;
function tryShoot() {
  const now = Date.now();
  const w = WEAPONS[state.weapon];
  if (now - lastShot < w.firerate) return;
  lastShot = now;
  const p = state.player;
  state.bullets.push(...w.shoot(p));
  playSound("shoot");
}

// ── COLLISION ──
function dist(a, b) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

// ── MAIN LOOP ──
function loop() {
  const W = canvas.width,
    H = canvas.height;
  const s = state;

  // ── UPDATE ──
  s.frame++;
  s.scoreTimer++;
  if (s.scoreTimer % 6 === 0) {
    s.score += s.level;
    document.getElementById("hud-score").textContent = s.score;
  }

  // weapon timer  Estep down when expired
  if (s.weapon !== "single" && s.weaponTimer > 0) {
    s.weaponTimer -= 16;
    if (s.weaponTimer <= 0) {
      const idx = WEAPON_ORDER.indexOf(s.weapon);
      s.weapon = WEAPON_ORDER[Math.max(0, idx - 1)];
      s.weaponTimer = s.weapon !== "single" ? WEAPON_DURATION : 0;
      showToast(
        s.weapon === "single" ? "WEAPON LOST" : `▼ ${WEAPONS[s.weapon].name}`,
        s.weapon === "single" ? "#f87171" : WEAPONS[s.weapon].color,
      );
    }
    updateWeaponHUD();
  }

  // level up by explicit score thresholds (each level requires more score)
  if (!s.boss && s.score >= thresholdForLevel(s.level)) {
    levelUp();
  }

  // player movement
  const p = s.player;
  const spd = PLAYER_SPEED + state.level * 0.1;
  let dx = 0,
    dy = 0;

  if (keys["ArrowLeft"] || keys["a"] || keys["A"]) dx -= spd;
  if (keys["ArrowRight"] || keys["d"] || keys["D"]) dx += spd;
  if (keys["ArrowUp"] || keys["w"] || keys["W"]) dy -= spd;
  if (keys["ArrowDown"] || keys["s"] || keys["S"]) dy += spd;

  // touch joystick overrides keyboard if active
  if (touch.active) {
    dx = touch.dx * spd;
    dy = touch.dy * spd;
  }

  // normalize diagonal (keyboard only; touch already normalised)
  if (!touch.active && dx !== 0 && dy !== 0) {
    dx *= 0.707;
    dy *= 0.707;
  }

  p.x = Math.max(p.r, Math.min(W - p.r, p.x + dx));
  p.y = Math.max(p.r, Math.min(H - p.r, p.y + dy));

  // auto-fire every frame (firerate is throttled inside tryShoot)
  tryShoot();

  p.invincible = Math.max(0, p.invincible - 16);

  // spawn enemies (stop during boss)
  if (!s.boss) {
    s.spawnTimer++;
    if (s.spawnTimer >= s.spawnInterval) {
      s.spawnTimer = 0;
      spawnEnemy();
      if (s.level >= 6) spawnEnemy();
    }
  }

  // boss update
  if (s.boss) updateBoss();

  // move bullets
  s.bullets = s.bullets.filter((b) => {
    b.x += b.vx;
    b.y += b.vy;
    return b.x > -10 && b.x < W + 10 && b.y > -10 && b.y < H + 10;
  });

  // move enemies + bullet collision
  s.enemies = s.enemies.filter((e) => {
    e.x += e.vx;
    e.y += e.vy;

    // out of bounds
    if (e.x < -80 || e.x > W + 80 || e.y < -80 || e.y > H + 80) return false;

    // bullet hits
    for (let i = s.bullets.length - 1; i >= 0; i--) {
      const b = s.bullets[i];
      if (dist(b, e) < b.r + e.r) {
        s.bullets.splice(i, 1);
        e.hp--;
        spawnParticles(
          e.x,
          e.y,
          e.type === "fast"
            ? "#fbbf24"
            : e.type === "large"
              ? "#f472b6"
              : "#f87171",
          5,
        );
        if (e.hp <= 0) {
          const combo = registerKill(e.x, e.y);
          const mult = Math.max(1, combo);
          const base = e.type === "large" ? 30 : e.type === "fast" ? 20 : 10;
          s.score += base * mult;
          document.getElementById("hud-score").textContent = s.score;
          spawnParticles(e.x, e.y, "#ffffff", 10);
          maybeSpawnDrop(e.x, e.y, e.type);
          playSound("enemy_die");
          return false;
        }
        return true;
      }
    }

    // player collision
    if (p.invincible <= 0 && dist(p, e) < p.r + e.r * 0.8) {
      if (p.shielded > 0) {
        p.shielded = 0;
        p.invincible = INVINCIBLE_MS;
        triggerShake(6);
        playSound("hit");
        showToast("SHIELD BROKEN", "#10b981");
        spawnParticles(p.x, p.y, "#10b981", 14);
      } else {
        s.lives--;
        p.invincible = INVINCIBLE_MS;
        updateLivesDots();
        spawnParticles(p.x, p.y, "#a78bfa", 12);
        triggerShake(s.lives === 0 ? 18 : 10);
        playSound("hit");
        gameWrap.classList.toggle("danger", s.lives === 1);
        if (s.lives <= 0) {
          endGame();
        }
      }
      return false;
    }

    return true;
  });

  // particles
  s.particles = s.particles.filter((pt) => {
    pt.x += pt.vx;
    pt.y += pt.vy;
    pt.vy += 0.08;
    pt.life -= 0.025;
    return pt.life > 0;
  });

  // drops  Eage out + pickup
  s.drops = s.drops.filter((d) => {
    d.life -= 16;
    if (d.life <= 0) return false;
    if (dist(p, d) < p.r + d.r + 4) {
      if (d.type === "life") {
        s.lives = Math.min(MAX_LIVES, s.lives + 1);
        updateLivesDots();
        gameWrap.classList.remove("danger");
        spawnParticles(d.x, d.y, "#f43f5e", 20);
        triggerShake(3);
        playSound("life");
        showToast("LIFE +1", "#f43f5e");
        s.statDrops++;
      } else if (d.type === "shield") {
        p.shielded = 1;
        spawnParticles(d.x, d.y, "#10b981", 15);
        playSound("pickup");
        showToast("SHIELD!", "#10b981");
        s.statDrops++;
      } else {
        const cur = WEAPON_ORDER.indexOf(s.weapon);
        const next = WEAPON_ORDER.indexOf(d.weapon);
        if (next >= cur) {
          const upgraded = next > cur;
          s.weapon = d.weapon;
          s.weaponTimer = WEAPON_DURATION;
          spawnParticles(d.x, d.y, d.color, 15);
          playSound("pickup");
          showToast(
            upgraded
              ? `UP ${WEAPONS[d.weapon].name}!`
              : `KEEP ${WEAPONS[d.weapon].name}`,
            d.color,
          );
          updateWeaponHUD();
          s.statDrops++;
        }
      }
      return false;
    }
    return true;
  });

  // ── DRAW ──
  // decay shake
  s.shakeX *= SHAKE_DECAY;
  s.shakeY *= SHAKE_DECAY;
  ctx.clearRect(0, 0, W, H);
  ctx.save();
  ctx.translate(s.shakeX, s.shakeY);

  // background grid
  ctx.save();
  ctx.strokeStyle = "rgba(30,34,64,0.7)";
  ctx.lineWidth = 1;
  const gs = 60;
  for (let x = 0; x < W; x += gs) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  for (let y = 0; y < H; y += gs) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
  ctx.restore();

  // subtle vignette
  const grad = ctx.createRadialGradient(
    W / 2,
    H / 2,
    H * 0.3,
    W / 2,
    H / 2,
    H * 0.9,
  );
  grad.addColorStop(0, "rgba(0,0,0,0)");
  grad.addColorStop(1, "rgba(0,0,5,0.55)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // particles
  s.particles.forEach((pt) => {
    ctx.save();
    ctx.globalAlpha = pt.life;
    ctx.fillStyle = pt.color;
    ctx.shadowColor = pt.color;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, pt.r * pt.life, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  // drops
  s.drops.forEach(drawDrop);

  // enemies
  s.enemies.forEach(drawEnemy);

  // boss
  if (s.boss) {
    drawBoss(s.boss);
    s.bossBullets.forEach(drawBossBullet);
  }

  // bullets
  s.bullets.forEach(drawBullet);

  // player
  drawPlayer(p);

  // shield ring
  if (p.shielded > 0) {
    ctx.save();
    ctx.strokeStyle = "#10b981";
    ctx.shadowColor = "#10b981";
    ctx.shadowBlur = 18;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.7 + Math.sin(s.frame * 0.12) * 0.3;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r + 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore(); // end shake transform

  if (!s.gameOver) animId = requestAnimationFrame(loop);
}

function endGame() {
  state.gameOver = true;
  cancelAnimationFrame(animId);
  playSound("gameover");

  const isRecord = state.score > highScore;
  if (isRecord) {
    highScore = state.score;
    localStorage.setItem("dodge_hs", highScore);
  }

  setTimeout(() => {
    gameWrap.classList.add("hidden");
    document.getElementById("final-score").textContent = state.score;
    document.getElementById("hs-display2").textContent = highScore;
    document.getElementById("new-record").style.display = isRecord
      ? "block"
      : "none";
    document.getElementById("stat-kills").textContent = state.statKills;
    document.getElementById("stat-combo").textContent = state.statMaxCombo;
    document.getElementById("stat-drops").textContent = state.statDrops;
    scrOver.classList.remove("hidden");
  }, 400);
}

// init high score display
document.getElementById("hs-display").textContent = highScore;
