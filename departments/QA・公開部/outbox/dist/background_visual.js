/**
 * background_visual.js
 * 宇宙背景（星空スクロール）描画モジュール
 *
 * 座標系: Canvas左上原点（背景は全面塗りつぶしのため中心座標不要）
 * GDD準拠: 3レイヤー（遠景60個/中景30個/近景15個）
 *
 * グローバル: window.BackgroundVisual = { init, update, draw }
 */

// ---- 内部定数 ----
var LAYERS = [
  { count: 60, speed: 0.5, size: 1.0,  color: '#888888' },  // 遠景 Far
  { count: 30, speed: 1.5, size: 1.5,  color: '#cccccc' },  // 中景 Mid
  { count: 15, speed: 3.0, size: 2.0,  color: '#ffffff' }   // 近景 Near
];

var BG_COLOR = '#000011'; // GDD準拠（深宇宙の濃紺）

/**
 * stars 配列を初期化して返す（ゲーム開始時に1回呼ぶ）
 * @param {number} count    - 生成する星の総数（未使用、レイヤー定義から自動計算）
 * @param {number} canvasW
 * @param {number} canvasH
 * @returns {Array<{x:number, y:number, r:number, speed:number, color:string}>}
 */
function initStars(count, canvasW, canvasH) {
  var stars = [];
  LAYERS.forEach(function(layer) {
    for (var i = 0; i < layer.count; i++) {
      stars.push({
        x:     Math.random() * canvasW,
        y:     Math.random() * canvasH,
        r:     layer.size,
        speed: layer.speed,
        color: layer.color
      });
    }
  });
  return stars;
}

/**
 * 星の座標を1フレーム分更新する（drawBackground の前に呼ぶ）
 * @param {Array} stars
 * @param {number} canvasH
 */
function updateStars(stars, canvasH) {
  var canvasW = 400; // Canvas幅固定
  for (var i = 0; i < stars.length; i++) {
    stars[i].y += stars[i].speed;
    if (stars[i].y > canvasH) {
      stars[i].y = 0;
      stars[i].x = Math.random() * canvasW;
    }
  }
}

/**
 * 背景塗りつぶし + 星描画
 * @param {CanvasRenderingContext2D} ctx
 * @param {Array<{x:number, y:number, r:number, color:string}>} stars
 */
function drawBackground(ctx, stars) {
  // 背景塗りつぶし
  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, 400, 600);

  // 星描画
  for (var i = 0; i < stars.length; i++) {
    var s = stars[i];
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fillStyle = s.color;
    ctx.fill();
  }
}

// ---- エクスポート ----
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { initStars: initStars, updateStars: updateStars, drawBackground: drawBackground };
}
if (typeof window !== 'undefined') {
  window.BackgroundVisual = { init: initStars, update: updateStars, draw: drawBackground };
}
