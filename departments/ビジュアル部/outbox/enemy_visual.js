/**
 * enemy_visual.js
 * 敵キャラクター（UFO・隕石）描画モジュール
 *
 * 座標系: 中心座標基準 (x, y)
 * GDD準拠サイズ: UFO 40×24px、隕石 36×36px
 *
 * グローバル: window.EnemyVisual = { draw }
 */

/**
 * 敵キャラクターを描画する
 * @param {CanvasRenderingContext2D} ctx
 * @param {'ufo' | 'meteor'} type - 敵の種類
 * @param {number} x      - 中心 X 座標
 * @param {number} y      - 中心 Y 座標
 * @param {number} width
 * @param {number} height
 * @param {number} frame  - アニメーションフレームカウント
 */
function drawEnemy(ctx, type, x, y, width, height, frame) {
  if (type === 'ufo') {
    _drawUFO(ctx, x, y, width, height, frame);
  } else if (type === 'meteor') {
    _drawMeteor(ctx, x, y, width, height, frame);
  }
}

// ---- UFO 描画 ----
function _drawUFO(ctx, x, y, width, height, frame) {
  ctx.save();
  ctx.translate(x, y);

  var w = width  || 40;
  var h = height || 24;
  var sx = w / 40;
  var sy = h / 24;

  // ---- ソーサー本体（下半球・楕円） ----
  ctx.fillStyle = '#555577';
  ctx.beginPath();
  ctx.ellipse(0, h * 0.2 * sy, w / 2, h * 0.45, 0, 0, Math.PI * 2);
  ctx.fill();

  // ソーサーハイライト
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.beginPath();
  ctx.ellipse(-w * 0.1, -h * 0.05, w * 0.25, h * 0.1, -0.3, 0, Math.PI * 2);
  ctx.fill();

  // ---- 上ドーム（キャノピー） ----
  ctx.fillStyle = 'rgba(0, 255, 120, 0.6)';
  ctx.beginPath();
  ctx.ellipse(0, -h * 0.15, w * 0.3, h * 0.45, 0, Math.PI, Math.PI * 2);
  ctx.fill();

  // ---- アクセントライト（点滅） ----
  var lightCount = 5;
  var lightR = 2.5 * Math.min(sx, sy);
  var saucerRX = w * 0.45;
  var saucerRY = h * 0.22;
  for (var i = 0; i < lightCount; i++) {
    var angle = (Math.PI * 2 / lightCount) * i;
    var lx = Math.cos(angle) * saucerRX;
    var ly = h * 0.2 * sy + Math.sin(angle) * saucerRY;

    // 点滅：フレームと灯の番号で交互切り替え
    var blink = (Math.floor((frame || 0) / 8) + i) % 2;
    ctx.fillStyle = blink === 0 ? '#FF4444' : '#FFFF44';
    ctx.beginPath();
    ctx.arc(lx, ly, lightR, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

// ---- 隕石 描画 ----
// 頂点オフセットをシード値で固定（毎フレーム同一形状を維持）
var _meteorVertices = null;
function _getMeteorVertices(vertexCount) {
  if (_meteorVertices) return _meteorVertices;
  _meteorVertices = [];
  for (var i = 0; i < vertexCount; i++) {
    // 擬似乱数（決定論的）でオフセット生成
    var t = i / vertexCount;
    var offset = 0.75 + 0.25 * Math.abs(Math.sin(i * 1.7 + 0.9) * Math.cos(i * 2.3));
    _meteorVertices.push(offset);
  }
  return _meteorVertices;
}

function _drawMeteor(ctx, x, y, width, height, frame) {
  ctx.save();
  ctx.translate(x, y);

  var size = Math.min(width || 36, height || 36);
  var rx = (width  || 36) / 2;
  var ry = (height || 36) / 2;

  // 緩やかに回転
  ctx.rotate((frame || 0) * 0.02);

  var vertexCount = 10;
  var offsets = _getMeteorVertices(vertexCount);

  // ---- 本体（不規則多角形） ----
  ctx.fillStyle = '#6B4226';
  ctx.beginPath();
  for (var i = 0; i < vertexCount; i++) {
    var angle = (Math.PI * 2 / vertexCount) * i - Math.PI / 2;
    var r = offsets[i];
    var px = Math.cos(angle) * rx * r;
    var py = Math.sin(angle) * ry * r;
    if (i === 0) ctx.moveTo(px, py);
    else         ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();

  // 暗面（影側）
  ctx.fillStyle = 'rgba(61, 31, 10, 0.5)';
  ctx.beginPath();
  for (var j = 0; j < vertexCount; j++) {
    var a2 = (Math.PI * 2 / vertexCount) * j - Math.PI / 2;
    if (Math.cos(a2) > 0.2) {
      var pxd = Math.cos(a2) * rx * offsets[j];
      var pyd = Math.sin(a2) * ry * offsets[j];
      if (j === 0) ctx.moveTo(pxd, pyd);
      else         ctx.lineTo(pxd, pyd);
    }
  }
  ctx.closePath();
  ctx.fill();

  // ---- クレーター（3個） ----
  var craters = [
    { ox: -rx * 0.2, oy: -ry * 0.1, rw: size * 0.12, rh: size * 0.08 },
    { ox:  rx * 0.3, oy:  ry * 0.2, rw: size * 0.10, rh: size * 0.07 },
    { ox: -rx * 0.1, oy:  ry * 0.3, rw: size * 0.08, rh: size * 0.06 }
  ];
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  for (var k = 0; k < craters.length; k++) {
    var c = craters[k];
    ctx.beginPath();
    ctx.ellipse(c.ox, c.oy, c.rw, c.rh, 0.3 * k, 0, Math.PI * 2);
    ctx.fill();
  }

  // ---- ハイライト（左上方向） ----
  ctx.fillStyle = 'rgba(255, 200, 150, 0.3)';
  ctx.beginPath();
  ctx.ellipse(-rx * 0.25, -ry * 0.25, size * 0.2, size * 0.12, -0.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// ---- エクスポート ----
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { drawEnemy: drawEnemy };
}
if (typeof window !== 'undefined') {
  window.EnemyVisual = { draw: drawEnemy };
}
