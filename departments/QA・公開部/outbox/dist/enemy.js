// enemy.js — 敵クラス（統合版）
// GDD §6 準拠：UFO（type='ufo'）と隕石（type='meteor'）
// EnemyVisual.draw(ctx, type, cx, cy, width, height, frame) は中心座標を要求する

class Enemy {
  /**
   * @param {string} type - 'ufo' | 'meteor'
   * @param {number} x    - 出現X座標（左上基準）
   * @param {number} speedMultiplier - 難易度フェーズ倍率
   */
  constructor(type, x, speedMultiplier) {
    this.type   = type;
    this.active = true;
    this.timer  = 0; // UFOのサイン波計算用

    if (type === 'ufo') {
      // GDD §6-1 UFO
      this.width  = 40;
      this.height = 24;
      this.y      = -24;
      this.x      = x !== undefined ? x : Math.random() * (400 - 40);
      this.baseX  = this.x;
      this.speedY = 2.0 * (speedMultiplier || 1.0);
      this.hp     = 1;
      this.score  = 100;
      // 当たり判定オフセット（GDD §6-1）
      this.hitboxOffsetX = 2;
      this.hitboxOffsetY = 2;
      this.hitboxWidth   = 36;
      this.hitboxHeight  = 20;
    } else {
      // GDD §6-2 隕石
      this.width  = 36;
      this.height = 36;
      this.y      = -36;
      this.x      = x !== undefined ? x : Math.random() * (400 - 36);
      this.speedY = 3.0 * (speedMultiplier || 1.0);
      // ランダムX速度 (-1 〜 +1)
      this.speedX = -1.0 + Math.random() * 2.0;
      this.hp     = 3;
      this.score  = 300;
      // 当たり判定オフセット（GDD §6-2）
      this.hitboxOffsetX = 2;
      this.hitboxOffsetY = 2;
      this.hitboxWidth   = 32;
      this.hitboxHeight  = 32;
    }

    // 爆発エフェクト管理
    this.exploding      = false; // 爆発中フラグ
    this.explosionFrame = 0;     // 爆発の進行フレーム（0〜19）
    this.explosionMaxFrame = 20;
    this.explosionCX    = 0;     // 爆発中心X（中心座標）
    this.explosionCY    = 0;     // 爆発中心Y（中心座標）
  }

  update() {
    this.timer++;

    if (this.type === 'ufo') {
      // サイン波左右移動（GDD §6-1, parameters.md参照）
      this.x = this.baseX + Math.sin(this.timer * 0.04) * 1.5 * 10;
      // X座標をCanvas内にクランプ
      this.x = Math.max(0, Math.min(400 - this.width, this.x));
      this.y += this.speedY;
    } else {
      // 隕石：直線降下 + 微小X移動
      this.x += this.speedX;
      this.y += this.speedY;
      // X端に当たったら反転
      if (this.x < 0) {
        this.x = 0;
        this.speedX *= -1;
      }
      if (this.x + this.width > 400) {
        this.x = 400 - this.width;
        this.speedX *= -1;
      }
    }

    // 画面下端を超えたら消滅（GDD §6-1 y>624, §6-2 y>636）
    const limit = this.type === 'ufo' ? 624 : 636;
    if (this.y > limit) {
      this.active = false;
    }
  }

  /**
   * 爆発エフェクトのフレームを進める
   * active=false になっても爆発中は描画させるため game.js 側で管理
   */
  updateExplosion() {
    if (this.exploding) {
      this.explosionFrame++;
      if (this.explosionFrame >= this.explosionMaxFrame) {
        this.exploding = false;
      }
    }
  }

  /**
   * ダメージを受ける
   * @returns {number} 撃墜時のスコア加算値（生存中は0）
   */
  takeDamage() {
    this.hp--;
    if (this.hp <= 0) {
      // 撃墜時：爆発エフェクト開始
      this.exploding      = true;
      this.explosionFrame = 0;
      this.explosionCX    = this.x + this.width  / 2;
      this.explosionCY    = this.y + this.height / 2;
      this.active = false;
      return this.score;
    }
    return 0;
  }

  /**
   * 描画用バウンディングボックス（左上座標基準）
   */
  getBounds() {
    return { x: this.x, y: this.y, width: this.width, height: this.height };
  }

  /**
   * 衝突判定用ヒットボックス（GDD §6 の当たり判定サイズ）
   */
  getHitbox() {
    return {
      x:      this.x + this.hitboxOffsetX,
      y:      this.y + this.hitboxOffsetY,
      width:  this.hitboxWidth,
      height: this.hitboxHeight,
    };
  }

  /**
   * 描画
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} frameCount - ゲームフレームカウンタ（アニメ用）
   */
  draw(ctx, frameCount) {
    if (!this.active && !this.exploding) return;

    if (this.active) {
      // EnemyVisual.draw は中心座標を要求
      const cx = this.x + this.width  / 2;
      const cy = this.y + this.height / 2;
      EnemyVisual.draw(ctx, this.type, cx, cy, this.width, this.height, frameCount || 0);
    }

    // 爆発エフェクト描画（active=false でも exploding 中は描画）
    if (this.exploding) {
      EffectsVisual.drawExplosion(
        ctx,
        this.explosionCX,
        this.explosionCY,
        this.explosionFrame,
        this.explosionMaxFrame
      );
    }
  }
}
