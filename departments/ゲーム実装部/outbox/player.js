// player.js — 自機クラス
// GDD §4 準拠

class Player {
  constructor() {
    // GDD §4: 幅32, 高さ48, 初期位置 x=184, y=500
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
   */
  takeDamage() {
    if (this.invincible > 0) return; // 無敵中は無視（念のため）
    this.hp--;
    this.invincible = this.invincibleMax;
    if (typeof Sound !== 'undefined') {
      Sound.playSE('hit');
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
   * 描画用バウンディングボックス
   */
  getBounds() {
    return { x: this.x, y: this.y, width: this.width, height: this.height };
  }

  draw(ctx) {
    // 無敵中の点滅（10frame周期：GDD §4）
    if (this.invincible > 0 && Math.floor(this.invincible / 5) % 2 === 0) {
      return; // 点滅の「消えているフレーム」はスキップ
    }

    if (typeof ShipVisual !== 'undefined') {
      ShipVisual.draw(ctx, this.x, this.y, this.invincible > 0);
    } else {
      // フォールバック：スペースシャトル風矩形描画
      const x = this.x;
      const y = this.y;
      const w = this.width;
      const h = this.height;

      // 機体本体（青白）
      ctx.fillStyle = '#00BFFF';
      ctx.fillRect(x + 8, y + 8, w - 16, h - 8);

      // ノーズ（先端三角形風）
      ctx.fillStyle = '#87CEEB';
      ctx.fillRect(x + 12, y, w - 24, 12);
      ctx.fillRect(x + 14, y - 4, w - 28, 8);

      // 左翼
      ctx.fillStyle = '#1E90FF';
      ctx.fillRect(x, y + 24, 10, 20);

      // 右翼
      ctx.fillRect(x + w - 10, y + 24, 10, 20);

      // エンジン噴射（フレームごとにランダムで炎を表現）
      ctx.fillStyle = Math.random() > 0.5 ? '#ff8800' : '#ffcc00';
      ctx.fillRect(x + 10, y + h - 2, 5, 6);
      ctx.fillRect(x + w - 15, y + h - 2, 5, 6);
    }
  }
}
