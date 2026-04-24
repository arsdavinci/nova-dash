// background.js — 星フィールドスクロール背景
// GDD §7 準拠：3レイヤー（遠景/中景/近景）

class Background {
  constructor() {
    this.stars = [];
    this._init();
  }

  _init() {
    this.stars = [];
    // GDD §7 の3レイヤー仕様に従って初期化
    const layers = [
      { count: 60, speed: 0.5, size: 1,   color: '#888888' }, // 遠景
      { count: 30, speed: 1.5, size: 1.5, color: '#cccccc' }, // 中景
      { count: 15, speed: 3.0, size: 2,   color: '#ffffff' }, // 近景
    ];

    layers.forEach(layer => {
      for (let i = 0; i < layer.count; i++) {
        this.stars.push({
          x: Math.random() * 400,
          y: Math.random() * 600,
          size: layer.size,
          speed: layer.speed,
          color: layer.color,
        });
      }
    });
  }

  update() {
    for (let i = 0; i < this.stars.length; i++) {
      const s = this.stars[i];
      s.y += s.speed;
      // 下端を超えたら上端に戻す
      if (s.y > 600) {
        s.y = 0;
        s.x = Math.random() * 400;
      }
    }
  }

  draw(ctx) {
    for (let i = 0; i < this.stars.length; i++) {
      const s = this.stars[i];
      ctx.fillStyle = s.color;
      ctx.fillRect(s.x, s.y, s.size, s.size);
    }
  }
}
