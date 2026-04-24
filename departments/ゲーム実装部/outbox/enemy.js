// enemy.js — 敵クラス
// GDD §6 準拠：UFO（type='ufo'）と隕石（type='meteor'）

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
  }

  update() {
    this.timer++;

    if (this.type === 'ufo') {
      // サイン波左右移動（GDD §6-1, parameters.md参照）
      // speedXAmpl=1.5, speedXFreq=0.04
      this.x = this.baseX + Math.sin(this.timer * 0.04) * 1.5 * 10;
      // X座標をCanvas内にクランプ
      this.x = Math.max(0, Math.min(400 - this.width, this.x));
      this.y += this.speedY;
    } else {
      // 隕石：直線降下 + 微小X移動
      this.x += this.speedX;
      this.y += this.speedY;
      // X端に当たったら反転（画面外に出ないように）
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
   * ダメージを受ける
   * @returns {number} 撃墜時のスコア加算値（生存中は0）
   */
  takeDamage() {
    this.hp--;
    if (this.hp <= 0) {
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

  draw(ctx) {
    if (this.type === 'ufo') {
      if (typeof EnemyVisual !== 'undefined' && EnemyVisual.drawUFO) {
        EnemyVisual.drawUFO(ctx, this.x, this.y, this.hp);
      } else {
        // フォールバック：UFO（薄緑楕円風矩形）
        ctx.fillStyle = '#44ff44';
        ctx.fillRect(this.x, this.y + 6, this.width, this.height - 12); // 胴体
        ctx.fillStyle = '#88ff88';
        ctx.fillRect(this.x + 8, this.y, this.width - 16, this.height); // コックピット
        // UFOのライト風
        ctx.fillStyle = '#ffff00';
        ctx.fillRect(this.x + 4,  this.y + 8, 6, 6);
        ctx.fillRect(this.x + 30, this.y + 8, 6, 6);
      }
    } else {
      // 隕石
      if (typeof EnemyVisual !== 'undefined' && EnemyVisual.drawMeteor) {
        EnemyVisual.drawMeteor(ctx, this.x, this.y, this.hp);
      } else {
        // フォールバック：隕石（HPに応じて色が変化）
        const ratio = this.hp / 3; // 1.0〜0.33
        if (ratio > 0.66) {
          ctx.fillStyle = '#aa8866'; // 通常（茶色系）
        } else if (ratio > 0.33) {
          ctx.fillStyle = '#cc6633'; // 半壊（オレンジ系）
        } else {
          ctx.fillStyle = '#ff4400'; // 瀕死（赤系）
        }
        ctx.fillRect(this.x, this.y, this.width, this.height);
        // 亀裂表現
        if (this.hp < 3) {
          ctx.fillStyle = 'rgba(0,0,0,0.4)';
          ctx.fillRect(this.x + 10, this.y + 5, 2, 20);
          ctx.fillRect(this.x + 20, this.y + 10, 2, 15);
        }
      }
    }
  }
}
