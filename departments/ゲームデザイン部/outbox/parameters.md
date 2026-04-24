# パラメータ一覧 — 宇宙シューティング

バージョン: 1.0  
作成: ゲームデザイン部  
用途: ゲーム実装部がそのまま JS 定数として使用可能

---

## JavaScript 定数定義（そのまま使用可）

```javascript
// ============================================================
// CANVAS
// ============================================================
const CANVAS_WIDTH  = 400;
const CANVAS_HEIGHT = 600;
const FPS           = 60;

// ============================================================
// PLAYER（自機: スペースシャトル）
// ============================================================
const PLAYER = {
  width:            32,        // px
  height:           48,        // px
  initX:            184,       // 初期位置X（中央揃え: (400-32)/2）
  initY:            500,       // 初期位置Y
  speedX:           4,         // px/frame（左右移動速度）
  speedY:           4,         // px/frame（上下移動速度）
  hp:               3,         // 初期HP
  invincibleFrames: 120,       // 被弾後の無敵時間（2秒）
  hitboxOffsetX:    2,         // 当たり判定 左オフセット
  hitboxOffsetY:    2,         // 当たり判定 上オフセット
  hitboxWidth:      28,        // 当たり判定 幅
  hitboxHeight:     44,        // 当たり判定 高さ
};

// ============================================================
// BULLET（自機の弾）
// ============================================================
const BULLET = {
  width:    6,         // px
  height:   16,        // px
  speed:    -12,       // px/frame（負=上方向）
  cooldown: 10,        // frame（発射間隔）
  color:    '#00ffff', // シアン
};

// ============================================================
// ENEMY_UFO（敵A: UFO）
// ============================================================
const ENEMY_UFO = {
  width:       40,     // px
  height:      24,     // px
  speedY:      2.0,    // px/frame（初期・フェーズ1）
  speedXAmpl:  1.5,    // px/frame（左右揺れの振幅）
  speedXFreq:  0.04,   // ラジアン/frame（サイン波の周波数）
  hp:          1,      // HP
  score:       100,    // 撃墜スコア
  hitboxOffsetX: 2,
  hitboxOffsetY: 2,
  hitboxWidth:  36,
  hitboxHeight: 20,
};

// ============================================================
// ENEMY_METEOR（敵B: 隕石）
// ============================================================
const ENEMY_METEOR = {
  width:       36,     // px
  height:      36,     // px
  speedY:      3.0,    // px/frame（初期・フェーズ1）
  speedXMin:   -1.0,   // px/frame（左右速度 下限）
  speedXMax:    1.0,   // px/frame（左右速度 上限）
  hp:          3,      // HP（弾3発で撃墜）
  score:       300,    // 撃墜スコア
  hitboxOffsetX: 2,
  hitboxOffsetY: 2,
  hitboxWidth:  32,
  hitboxHeight: 32,
};

// ============================================================
// DIFFICULTY（難易度フェーズ速度倍率）
// ============================================================
const DIFFICULTY = {
  phase1: { startFrame: 0,    speedMultiplier: 1.00 },
  phase2: { startFrame: 600,  speedMultiplier: 1.30 },  // 10秒
  phase3: { startFrame: 1200, speedMultiplier: 1.69 },  // 20秒（1.3×1.3）
};

// ============================================================
// STARS（背景星フィールド）
// ============================================================
const STARS = [
  // 遠景（Far）
  { layer: 'far',  count: 60, speed: 0.5, size: 1,   color: '#888888' },
  // 中景（Mid）
  { layer: 'mid',  count: 30, speed: 1.5, size: 1.5, color: '#cccccc' },
  // 近景（Near）
  { layer: 'near', count: 15, speed: 3.0, size: 2,   color: '#ffffff' },
];

// ============================================================
// GOAL（ゴール: 宇宙ステーション）
// ============================================================
const GOAL = {
  width:          64,      // px
  height:         64,      // px
  initX:          168,     // 初期位置X（中央揃え: (400-64)/2）
  initY:          -64,     // 初期位置Y（画面外上部）
  speedY:         2.0,     // px/frame（降下速度）
  appearFrame:    1800,    // 出現フレーム（30秒 × 60fps）
  hitboxOffsetX:  2,
  hitboxOffsetY:  2,
  hitboxWidth:    60,
  hitboxHeight:   60,
};

// ============================================================
// SCORE（スコア加算値）
// ============================================================
const SCORE = {
  ufo:             100,    // UFO撃墜
  meteor:          300,    // 隕石撃墜
  clearBonus:      1000,   // クリアボーナス
  hpBonus:         200,    // 残HP1につき加算
};

// ============================================================
// HUD（UI表示設定）
// ============================================================
const HUD = {
  height:   30,            // HUDバーの高さ（px）
  font:     '14px monospace',
  color:    '#ffffff',
  scoreX:   8,             // スコア表示X
  timeX:    160,           // 残り時間表示X
  hpX:      320,           // HP表示X
  y:        20,            // テキストのベースラインY
};

// ============================================================
// GAME DURATION
// ============================================================
const GAME_DURATION_FRAMES = 1800;  // 30秒 × 60fps（ゴール出現タイミング）
const ENEMY_STOP_FRAME     = 1680;  // 28秒（敵の新規出現を停止するフレーム）
```

---

## パラメータ補足説明

### UFO の左右移動（サイン波）

```javascript
// 実装例: phase に timer や個別カウンタを使う
enemy.x = enemy.baseX + Math.sin(enemy.timer * ENEMY_UFO.speedXFreq) * ENEMY_UFO.speedXAmpl * 10;
// または speedX を毎フレーム sin で更新
enemy.x += Math.sin(enemy.timer * ENEMY_UFO.speedXFreq) * ENEMY_UFO.speedXAmpl;
```

### 難易度フェーズ適用

```javascript
// 現在フェーズの速度倍率を取得
function getSpeedMultiplier(currentFrame) {
  if (currentFrame >= DIFFICULTY.phase3.startFrame) return DIFFICULTY.phase3.speedMultiplier;
  if (currentFrame >= DIFFICULTY.phase2.startFrame) return DIFFICULTY.phase2.speedMultiplier;
  return DIFFICULTY.phase1.speedMultiplier;
}

// 敵生成時に適用
const multiplier = getSpeedMultiplier(gameFrame);
newEnemy.speedY = ENEMY_UFO.speedY * multiplier;
```

### 隕石のランダムX速度

```javascript
const speedX = ENEMY_METEOR.speedXMin + Math.random() * (ENEMY_METEOR.speedXMax - ENEMY_METEOR.speedXMin);
```

### 星フィールドの初期化

```javascript
// 各レイヤーの星を初期化（ランダム配置）
STARS.forEach(layer => {
  for (let i = 0; i < layer.count; i++) {
    stars.push({
      x: Math.random() * CANVAS_WIDTH,
      y: Math.random() * CANVAS_HEIGHT,
      size: layer.size,
      speed: layer.speed,
      color: layer.color,
    });
  }
});
```

---

## 数値調整ガイド（QA・バランス調整用）

| 調整したい点 | 変更パラメータ |
|---|---|
| 自機が速すぎ/遅すぎ | `PLAYER.speedX` / `PLAYER.speedY` |
| 弾が遅い | `BULLET.speed`（絶対値を大きく） |
| 連射が速すぎ/遅すぎ | `BULLET.cooldown` |
| 敵が簡単すぎ | `ENEMY_UFO.speedY` / `ENEMY_METEOR.speedY` を上げる |
| 中盤が急に難しくなる | `DIFFICULTY.phase2.speedMultiplier` を下げる |
| ゲームが短すぎ/長すぎ | `GAME_DURATION_FRAMES` を変更（1秒=60f） |
| 星の流れが速すぎ | `STARS[n].speed` を下げる |
