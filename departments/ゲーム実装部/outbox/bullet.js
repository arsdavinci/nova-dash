// bullet.js — 弾クラス
// GDD §5 準拠

class Bullet {
  /**
   * @param {number} x - 発射位置X（中央）
   * @param {number} y - 発射位置Y（自機上端）
   */
  constructor(x, y) {
    // GDD §5: width=6, height=16, speed=-12px/frame
    this.width  = 6;
    this.height = 16;
    // 左上座標に変換（x は中央から）
    this.x = x - this.width / 2;
    this.y = y - this.height;
    this.speedY = -12;
    this.active = true;
  }

  update() {
    this.y += this.speedY;
    // 画面外（上）に出たら消滅
    if (this.y + this.height < 0) {
      this.active = false;
    }
  }

  /**
   * 衝突判定用バウンディングボックス（左上座標基準）
   */
  getBounds() {
    return { x: this.x, y: this.y, width: this.width, height: this.height };
  }

  draw(ctx) {
    if (typeof BulletVisual !== 'undefined') {
      BulletVisual.draw(ctx, this.x, this.y, this.width, this.height);
    } else {
      // フォールバック：シアン色の矩形
      ctx.fillStyle = '#00ffff';
      ctx.fillRect(this.x, this.y, this.width, this.height);
      // 弾の光彩（グロー効果）
      ctx.fillStyle = 'rgba(0, 200, 255, 0.4)';
      ctx.fillRect(this.x - 1, this.y, this.width + 2, this.height);
    }
  }
}
