// player.js — 自機クラス（統合版）
// GDD §4 準拠
// ShipVisual.draw(ctx, cx, cy, width, height, frame) は中心座標を要求する

class Player {
  constructor() {
    // GDD §4: 幅32, 高さ48, 初期位置 x=184, y=500（左上座標）
    this.width  = 32;
    this.height = 48;
    this.x      = 184; // 左上X
    this.y      = 500; // 左上Y
    this.speedX = 4;   // px/frame
    this.speedY = 4;   // px/frame
    this.hp     = 3;
    // 無敵時間カウンタ（0=通常、>0=無敵中）
    this.invincible     = 0;
    this.invincibleMax  = 120; // 2秒 @ 60fps
    // 射撃クールダウンカウンタ
    this.shootCooldown  = 0;
    this.shootInterval  = 10; // GDD §5: 10frame
  }

  /**
   * 毎フレーム更新
   * @param {Object} keys - キー状態テーブル
   */
  update(keys) {
    // 移動
    if (keys['ArrowLeft'])  this.x -= this.speedX;
    if (keys['ArrowRight']) this.x += this.speedX;
    if (keys['ArrowUp'])    this.y -= this.speedY;
    if (keys['ArrowDown'])  this.y += this.speedY;

    // Canvas境界クランプ（GDD §4: Canvas内に収める）
    this.x = Math.max(0, Math.min(400 - this.width,  this.x));
    this.y = Math.max(0, Math.min(600 - this.height, this.y));

    // 無敵時間カウントダウン
    if (this.invincible > 0) {
      this.invincible--;
    }

    // 射撃クールダウンカウントダウン
    if (this.shootCooldown > 0) {
      this.shootCooldown--;
    }
  }

  /**
   * 弾を発射する。クールダウン中は null を返す。
   * @returns {Bullet|null}
   */
  shoot() {
    if (this.shootCooldown > 0) return null;
    this.shootCooldown = this.shootInterval;
    // 発射位置：自機の上端中央（GDD §5）
    const bx = this.x + this.width / 2;
    const by = this.y;
    return new Bullet(bx, by);
  }

  /**
   * 被弾処理
   * @param {SoundManager} sound
   */
  takeDamage(sound) {
    if (this.invincible > 0) return; // 無敵中は無視
    this.hp--;
    this.invincible = this.invincibleMax;
    if (sound) {
      sound.playSE('playerHit');
    }
  }

  /**
   * 衝突判定用ヒットボックス（GDD §4: 28×44, 中央揃え）
   */
  getHitbox() {
    return {
      x:      this.x + 2,  // hitboxOffsetX=2
      y:      this.y + 2,  // hitboxOffsetY=2
      width:  28,
      height: 44,
    };
  }

  /**
   * 描画用バウンディングボックス（左上座標基準）
   */
  getBounds() {
    return { x: this.x, y: this.y, width: this.width, height: this.height };
  }

  /**
   * 描画
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} frameCount - ゲームフレームカウンタ（炎アニメ用）
   */
  draw(ctx, frameCount) {
    // 無敵中の点滅（5frame周期：GDD §4）
    if (this.invincible > 0 && Math.floor(this.invincible / 5) % 2 === 0) {
      return; // 点滅の「消えているフレーム」はスキップ
    }

    // ShipVisual.draw は中心座標を要求
    // this.x/this.y は左上座標なので中心に変換
    const cx = this.x + this.width  / 2;
    const cy = this.y + this.height / 2;
    ShipVisual.draw(ctx, cx, cy, this.width, this.height, frameCount || 0);
  }
}
