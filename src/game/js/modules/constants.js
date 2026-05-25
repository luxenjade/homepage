export const MAX_LIVES = 3;
export const PLAYER_SPEED = 4.5;
export const BULLET_SPEED = 9;
export const ENEMY_BASE_SPEED = 1.8;
export const INVINCIBLE_MS = 1500;

export const WEAPONS = {
  single: {
    name: "SINGLE",
    color: "#67e8f9",
    firerate: 220,
    shoot(p) {
      return [
        {
          x: p.x,
          y: p.y - p.r,
          vx: 0,
          vy: -BULLET_SPEED,
          r: 4,
          color: "#e0f2fe",
          glow: "#67e8f9",
        },
      ];
    },
  },
  spread: {
    name: "SPREAD",
    color: "#a78bfa",
    firerate: 180,
    shoot(p) {
      return [
        {
          x: p.x,
          y: p.y - p.r,
          vx: 0,
          vy: -BULLET_SPEED,
          r: 4,
          color: "#c4b5fd",
          glow: "#7c3aed",
        },
        {
          x: p.x - 8,
          y: p.y - p.r,
          vx: -BULLET_SPEED * 0.45,
          vy: -BULLET_SPEED * 0.9,
          r: 3,
          color: "#c4b5fd",
          glow: "#7c3aed",
        },
        {
          x: p.x + 8,
          y: p.y - p.r,
          vx: BULLET_SPEED * 0.45,
          vy: -BULLET_SPEED * 0.9,
          r: 3,
          color: "#c4b5fd",
          glow: "#7c3aed",
        },
      ];
    },
  },
  laser: {
    name: "LASER",
    color: "#f472b6",
    firerate: 80,
    shoot(p) {
      return [
        {
          x: p.x,
          y: p.y - p.r,
          vx: 0,
          vy: -BULLET_SPEED * 1.6,
          r: 5,
          color: "#fce7f3",
          glow: "#ec4899",
          laser: true,
        },
      ];
    },
  },
  laserSpread: {
    name: "HYPER",
    color: "#fb923c",
    firerate: 90,
    shoot(p) {
      return [
        {
          x: p.x,
          y: p.y - p.r,
          vx: 0,
          vy: -BULLET_SPEED * 1.6,
          r: 5,
          color: "#fed7aa",
          glow: "#f97316",
          laser: true,
        },
        {
          x: p.x - 8,
          y: p.y - p.r,
          vx: -BULLET_SPEED * 0.45,
          vy: -BULLET_SPEED * 0.9,
          r: 3,
          color: "#fed7aa",
          glow: "#f97316",
        },
        {
          x: p.x + 8,
          y: p.y - p.r,
          vx: BULLET_SPEED * 0.45,
          vy: -BULLET_SPEED * 0.9,
          r: 3,
          color: "#fed7aa",
          glow: "#f97316",
        },
      ];
    },
  },
};

export const WEAPON_ORDER = ["single", "spread", "laser", "laserSpread"];
export const WEAPON_DURATION = 15000;
export const COMBO_WINDOW = 2500;
export const SHAKE_DECAY = 0.85;
