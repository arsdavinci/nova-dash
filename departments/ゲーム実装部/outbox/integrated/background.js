// background.js — 星フィールドスクロール背景（統合版）
// BackgroundVisual モジュールへの薄いラッパー
// GDD §7 準拠

class Background {
  constructor() {
    // BackgroundVisual.init(count, canvasW, canvasH) で星配列を初期化
    // count 引数は内部で無視されレイヤー定義から自動計算される
    this.stars = BackgroundVisual.init(0, 400, 600);
  }

  update() {
    BackgroundVisual.update(this.stars, 600);
  }

  draw(ctx) {
    BackgroundVisual.draw(ctx, this.stars);
  }
}
