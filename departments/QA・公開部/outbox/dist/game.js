// game.js — ゲームメインループ・状態管理（統合版）
// GDD §2,3,8,9,11,12 準拠
// ビジュアル部・サウンド部モジュールを統合済み

// ============================================================
// 状態定義
// ============================================================
const STATE = {
  TITLE:    'title',
  PLAYING:  'playing',
  CLEAR:    'clear',
  GAMEOVER: 'gameover',
};

// ============================================================
// 敵出現イベントキュー（timeline.md 準拠）
// ============================================================
const SPAWN_EVENTS = [
  { frame: 120,  type: 'ufo',    x: null  },
  { frame: 240,  type: 'ufo',    x: null  },
  { frame: 290,  type: 'ufo',    x: null  },
  { frame: 360,  type: 'meteor', x: null  },
  { frame: 480,  type: 'ufo',    x: 100   },
  { frame: 530,  type: 'ufo',    x: 300   },
  { frame: 600,  type: 'ufo',    x: null  },
  { frame: 630,  type: 'ufo',    x: null  },
  { frame: 660,  type: 'ufo',    x: null  },
  { frame: 720,  type: 'meteor', x: null  },
  { frame: 780,  type: 'meteor', x: null  },
  { frame: 840,  type: 'ufo',    x: null  },
  { frame: 870,  type: 'ufo',    x: null  },
  { frame: 880,  type: 'meteor', x: null  },
  { frame: 960,  type: 'ufo',    x: null  },
  { frame: 990,  type: 'ufo',    x: null  },
  { frame: 1020, type: 'ufo',    x: null  },
  { frame: 1080, type: 'meteor', x: 30    },
  { frame: 1110, type: 'meteor', x: 330   },
  { frame: 1200, type: 'ufo',    x: null  },
  { frame: 1218, type: 'ufo',    x: null  },
  { frame: 1236, type: 'ufo',    x: null  },
  { frame: 1254, type: 'ufo',    x: null  },
  { frame: 1320, type: 'meteor', x: null  },
  { frame: 1380, type: 'meteor', x: null  },
  { frame: 1440, type: 'meteor', x: null  },
  { frame: 1440, type: 'ufo',    x: null  },
  { frame: 1470, type: 'ufo',    x: null  },
  { frame: 1500, type: 'meteor', x: null  },
  { frame: 1560, type: 'ufo',    x: null  },
  { frame: 1578, type: 'ufo',    x: null  },
  { frame: 1596, type: 'ufo',    x: null  },
  { frame: 1620, type: 'meteor', x: null  },
];

// 難易度フェーズ速度倍率
function getSpeedMultiplier(currentFrame) {
  if (currentFrame >= 1200) return 1.69; // フェーズ3
  if (currentFrame >= 600)  return 1.30; // フェーズ2
  return 1.00;                            // フェーズ1
}

// ============================================================
// ゲーム変数
// ============================================================
let canvas, ctx;
let currentState = STATE.TITLE;
let keys = {};
let keyJustPressed = {};

let player;
let bullets   = [];
let enemies   = [];
let background;
let score     = 0;
let gameFrame = 0;
let spawnEventIndex = 0;

// ゴールオブジェクト
let goal = null;

// SoundManager インスタンス（DOMContentLoaded で生成）
let sound = null;
let soundResumed = false; // ユーザー操作後の resume 済みフラグ

// ============================================================
// ゴールクラス（インライン定義）
// ============================================================
class Goal {
  constructor() {
    this.width  = 64;
    this.height = 64;
    this.x      = 168; // (400-64)/2 ← 左上X
    this.y      = -64;
    this.speedY = 2.0;
    this.active = true;
  }

  update() {
    this.y += this.speedY;
  }

  getHitbox() {
    return { x: this.x + 2, y: this.y + 2, width: 60, height: 60 };
  }

  draw(ctx, frame) {
    // ObjectsVisual.drawGoal は中心座標を要求
    const cx = this.x + this.width  / 2;
    const cy = this.y + this.height / 2;
    ObjectsVisual.drawGoal(ctx, cx, cy, frame);
  }
}

// ============================================================
// 初期化
// ============================================================
function initGame() {
  player     = new Player();
  bullets    = [];
  enemies    = [];
  background = new Background();
  score      = 0;
  gameFrame  = 0;
  spawnEventIndex = 0;
  goal       = null;

  if (sound) {
    sound.playBGM();
  }
}

// ============================================================
// 入力管理
// ============================================================
window.addEventListener('keydown', (e) => {
  if (!keys[e.key]) {
    keyJustPressed[e.key] = true;
  }
  keys[e.key] = true;

  // ブラウザ自動再生ポリシー対応：初回キー操作で AudioContext を resume
  if (!soundResumed && sound) {
    sound.resume();
    soundResumed = true;
  }

  // ページスクロール防止（矢印キー）
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
    e.preventDefault();
  }
  // スペースキーのスクロール防止
  if (e.key === ' ') {
    e.preventDefault();
  }
});

window.addEventListener('keyup', (e) => {
  keys[e.key] = false;
});

// クリック操作でも resume（スマートフォン対応・念のため）
window.addEventListener('click', () => {
  if (!soundResumed && sound) {
    sound.resume();
    soundResumed = true;
  }
});

// ============================================================
// ゲームループ
// ============================================================
let lastTimestamp = 0;

function gameLoop(timestamp) {
  lastTimestamp = timestamp;

  // 背景は background.draw() 内で fillRect するので、ここでの塗りつぶしは不要
  // ただし背景モジュールが呼ばれる前の安全のため残す
  ctx.fillStyle = '#000011';
  ctx.fillRect(0, 0, 400, 600);

  switch (currentState) {
    case STATE.TITLE:
      updateTitle();
      drawTitle();
      break;

    case STATE.PLAYING:
      updatePlaying();
      drawPlaying();
      break;

    case STATE.CLEAR:
      updateResult(STATE.CLEAR);
      drawClear();
      break;

    case STATE.GAMEOVER:
      updateResult(STATE.GAMEOVER);
      drawGameOver();
      break;
  }

  // フレーム末尾にkeyJustPressedをリセット
  keyJustPressed = {};

  requestAnimationFrame(gameLoop);
}

// ============================================================
// タイトル
// ============================================================
function updateTitle() {
  background.update();

  if (keyJustPressed[' '] || keyJustPressed['Enter']) {
    initGame();
    currentState = STATE.PLAYING;
  }
}

function drawTitle() {
  background.draw(ctx);

  // タイトルロゴ
  ctx.fillStyle = '#ffffff';
  ctx.font      = 'bold 32px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('SPACE SHUTTLE', 200, 200);

  ctx.font = '16px monospace';
  ctx.fillStyle = '#aaaaaa';
  ctx.fillText('- Shoot UFOs & Meteors -', 200, 240);

  // 操作説明
  ctx.font = '14px monospace';
  ctx.fillStyle = '#888888';
  ctx.fillText('ARROW KEYS: Move', 200, 310);
  ctx.fillText('A KEY: Shoot', 200, 330);

  // 点滅テキスト
  if (Math.floor(Date.now() / 500) % 2 === 0) {
    ctx.fillStyle = '#ffffff';
    ctx.font      = '18px monospace';
    ctx.fillText('PRESS SPACE / ENTER', 200, 400);
  }

  ctx.textAlign = 'left';
}

// ============================================================
// プレイ中
// ============================================================
function updatePlaying() {
  gameFrame++;

  // 背景更新
  background.update();

  // 自機更新
  player.update(keys);

  // 射撃処理
  if (keys['a'] || keys['A']) {
    const b = player.shoot();
    if (b) {
      bullets.push(b);
      if (sound) sound.playSE('shoot');
    }
  }

  // 弾更新
  for (let i = 0; i < bullets.length; i++) {
    bullets[i].update();
  }
  bullets = bullets.filter(b => b.active);

  // 敵スポーン（timeline.md のイベントキュー）
  while (
    spawnEventIndex < SPAWN_EVENTS.length &&
    gameFrame >= SPAWN_EVENTS[spawnEventIndex].frame
  ) {
    const ev = SPAWN_EVENTS[spawnEventIndex];
    spawnEventIndex++;

    if (gameFrame <= 1680) { // ENEMY_STOP_FRAME
      const multiplier = getSpeedMultiplier(gameFrame);
      let spawnX = ev.x;
      if (spawnX === null) {
        const enemyW = ev.type === 'ufo' ? 40 : 36;
        spawnX = Math.random() * (400 - enemyW);
      }
      enemies.push(new Enemy(ev.type, spawnX, multiplier));
    }
  }

  // 敵更新（active=false でも exploding 中のものは保持）
  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i];
    if (e.active) {
      e.update();
    }
    // 爆発エフェクトのフレーム更新
    e.updateExplosion();
  }
  // active=false かつ exploding=false の敵を除去
  enemies = enemies.filter(e => e.active || e.exploding);

  // 衝突判定：弾 vs 敵（active な敵のみ）
  checkBulletEnemyCollisions(
    bullets,
    enemies.filter(e => e.active),
    (bullet, enemy) => {
      bullet.active = false;
      const gained = enemy.takeDamage();
      if (gained > 0) {
        score += gained;
        if (sound) sound.playSE('explosion');
      }
    }
  );

  // 衝突判定：自機 vs 敵（active な敵のみ）
  if (player.invincible === 0) {
    const playerHitbox = player.getHitbox();
    const activeEnemies = enemies.filter(e => e.active);
    for (let i = 0; i < activeEnemies.length; i++) {
      const e = activeEnemies[i];
      if (isColliding(playerHitbox, e.getBounds())) {
        player.takeDamage(sound); // sound を渡してSE再生
        break; // 1フレームに1ダメージまで
      }
    }
  }

  // ゴール処理
  if (gameFrame >= 1800 && goal === null) {
    goal = new Goal();
  }
  if (goal && goal.active) {
    goal.update();
  }

  // クリア判定（自機 vs ゴール）
  if (goal && goal.active && checkPlayerGoalCollision(player, goal)) {
    score += 1000 + player.hp * 200; // クリアボーナス＋残HPボーナス
    if (sound) {
      sound.stopBGM();
      sound.playSE('clear');
    }
    currentState = STATE.CLEAR;
    return;
  }

  // ゲームオーバー判定
  if (player.hp <= 0) {
    if (sound) {
      sound.stopBGM();
      sound.playSE('gameover');
    }
    currentState = STATE.GAMEOVER;
    return;
  }
}

function drawPlaying() {
  background.draw(ctx);

  // 弾描画
  for (let i = 0; i < bullets.length; i++) {
    bullets[i].draw(ctx);
  }

  // 敵描画（active でも exploding でも draw を呼ぶ）
  for (let i = 0; i < enemies.length; i++) {
    enemies[i].draw(ctx, gameFrame);
  }

  // ゴール描画
  if (goal && goal.active) {
    goal.draw(ctx, gameFrame);
  }

  // 自機描画（frameCount を渡して炎アニメ）
  player.draw(ctx, gameFrame);

  // HUD描画
  drawHUD();
}

// ============================================================
// HUD
// ============================================================
function drawHUD() {
  ctx.font      = '14px monospace';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';

  // スコア（6桁ゼロ埋め）GDD §11
  const scoreStr = String(score).padStart(6, '0');
  ctx.fillText('SCORE: ' + scoreStr, 8, 20);

  // 残り時間（GDD §11: TIME表示）
  const remainSec = Math.max(0, Math.ceil((1800 - gameFrame) / 60));
  const timeStr   = String(remainSec).padStart(2, '0');
  ctx.fillText('TIME: ' + timeStr, 160, 20);

  // HP（●×残HP）GDD §11
  let hpStr = 'HP: ';
  for (let i = 0; i < 3; i++) {
    hpStr += i < player.hp ? '●' : '○';
  }
  ctx.fillText(hpStr, 320, 20);

  ctx.textAlign = 'left';
}

// ============================================================
// クリア画面
// ============================================================
function updateResult(state) {
  background.update();
  if (keyJustPressed['r'] || keyJustPressed['R']) {
    currentState = STATE.TITLE;
  }
}

function drawClear() {
  background.draw(ctx);

  ctx.textAlign = 'center';

  ctx.fillStyle = '#ffff00';
  ctx.font      = 'bold 36px monospace';
  ctx.fillText('MISSION CLEAR!', 200, 220);

  ctx.fillStyle = '#ffffff';
  ctx.font      = '20px monospace';
  const finalScore = String(score).padStart(6, '0');
  ctx.fillText('SCORE: ' + finalScore, 200, 290);

  ctx.fillStyle = '#aaaaaa';
  ctx.font      = '14px monospace';
  ctx.fillText('PRESS R TO RETRY', 200, 360);

  ctx.textAlign = 'left';
}

// ============================================================
// ゲームオーバー画面
// ============================================================
function drawGameOver() {
  background.draw(ctx);

  ctx.textAlign = 'center';

  ctx.fillStyle = '#ff4444';
  ctx.font      = 'bold 40px monospace';
  ctx.fillText('GAME OVER', 200, 220);

  ctx.fillStyle = '#ffffff';
  ctx.font      = '20px monospace';
  const finalScore = String(score).padStart(6, '0');
  ctx.fillText('SCORE: ' + finalScore, 200, 290);

  ctx.fillStyle = '#aaaaaa';
  ctx.font      = '14px monospace';
  ctx.fillText('PRESS R TO RETRY', 200, 360);

  ctx.textAlign = 'left';
}

// ============================================================
// エントリーポイント
// ============================================================
window.addEventListener('DOMContentLoaded', () => {
  canvas = document.getElementById('gameCanvas');
  ctx    = canvas.getContext('2d');

  // SoundManager を初期化（AudioContext は suspended のまま待機）
  sound = new SoundManager();

  // 背景を初期化（タイトル画面で星を流すため）
  background = new Background();

  requestAnimationFrame(gameLoop);
});
