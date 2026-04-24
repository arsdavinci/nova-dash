/**
 * ship_visual.js
 * 自機（スペースシャトル）描画モジュール
 *
 * 座標系: 中心座標基準 (x, y)
 * GDD準拠サイズ: 32×48px（デフォルト想定）
 * 仕様書準拠配色: 白胴体、薄グレー翼、オレンジ炎
 *
 * グローバル: window.ShipVisual = { draw }
 */

/**
 * 自機（スペースシャトル）を描画する
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x      - 中心 X 座標
 * @param {number} y      - 中心 Y 座標
 * @param {number} width  - 描画幅（デフォルト想定 32）
 * @param {number} height - 描画高（デフォルト想定 48）
 * @param {number} frame  - アニメーションフレームカウント（炎の揺れに使用）
 */
function drawShip(ctx, x, y, width, height, frame) {
  ctx.save();
  ctx.translate(x, y);

  var w = width  || 32;
  var h = height || 48;

  // スケール係数（基準サイズ32×48に対する比率）
  var sx = w / 32;
  var sy = h / 48;

  // ---- エンジン炎（最背面に描画） ----
  var flameH = (Math.sin((frame || 0) * 0.3) * 2 + 10) * sy;
  var flameW = 10 * sx;
  var flameTipY = h / 2 + flameH; // 中心座標基準で下方向がプラス

  var grad = ctx.createLinearGradient(0, h / 2, 0, flameTipY);
  grad.addColorStop(0, '#FFEE44');
  grad.addColorStop(1, 'rgba(255, 102, 0, 0)');

  ctx.beginPath();
  ctx.moveTo(-flameW / 2, h / 2);
  ctx.lineTo( flameW / 2, h / 2);
  ctx.lineTo(0, flameTipY);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // ---- エンジン排気口 ----
  var exhaustW = 10 * sx;
  var exhaustH = 6  * sy;
  ctx.fillStyle = '#888888';
  ctx.fillRect(-exhaustW / 2, h / 2 - exhaustH, exhaustW, exhaustH);

  // ---- 翼（左右） ----
  // 胴体幅: 16px、翼は外側に14px広がる
  var bodyHalfW = (16 / 2) * sx;
  var wingSpan  = 14 * sx;
  var wingTopY  = (-h / 2) + (12 * sy); // ノーズコーン直下から
  var wingBotY  =  (h / 2) - exhaustH;  // 排気口上端まで

  ctx.fillStyle = '#CCCCCC';

  // 左翼
  ctx.beginPath();
  ctx.moveTo(-bodyHalfW, wingTopY);
  ctx.lineTo(-bodyHalfW - wingSpan, wingBotY);
  ctx.lineTo(-bodyHalfW, wingBotY);
  ctx.closePath();
  ctx.fill();

  // 右翼
  ctx.beginPath();
  ctx.moveTo(bodyHalfW, wingTopY);
  ctx.lineTo(bodyHalfW + wingSpan, wingBotY);
  ctx.lineTo(bodyHalfW, wingBotY);
  ctx.closePath();
  ctx.fill();

  // ---- 胴体（白い角丸矩形） ----
  var bodyW = 16 * sx;
  var bodyH = 38 * sy;
  var bodyX = -bodyW / 2;
  var bodyY = -h / 2 + (12 * sy); // ノーズコーン高さ分下げる
  var radius = 4 * Math.min(sx, sy);

  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(bodyX, bodyY, bodyW, bodyH, radius);
  } else {
    // roundRect 非対応ブラウザ用フォールバック
    ctx.moveTo(bodyX + radius, bodyY);
    ctx.lineTo(bodyX + bodyW - radius, bodyY);
    ctx.arcTo(bodyX + bodyW, bodyY, bodyX + bodyW, bodyY + radius, radius);
    ctx.lineTo(bodyX + bodyW, bodyY + bodyH - radius);
    ctx.arcTo(bodyX + bodyW, bodyY + bodyH, bodyX + bodyW - radius, bodyY + bodyH, radius);
    ctx.lineTo(bodyX + radius, bodyY + bodyH);
    ctx.arcTo(bodyX, bodyY + bodyH, bodyX, bodyY + bodyH - radius, radius);
    ctx.lineTo(bodyX, bodyY + radius);
    ctx.arcTo(bodyX, bodyY, bodyX + radius, bodyY, radius);
    ctx.closePath();
  }
  ctx.fill();

  // ---- ノーズコーン（先端の三角形） ----
  var noseH = 12 * sy;
  var noseHalfW = bodyHalfW;

  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.moveTo(0, -h / 2);                    // 先端
  ctx.lineTo(-noseHalfW, -h / 2 + noseH);  // 左基部
  ctx.lineTo( noseHalfW, -h / 2 + noseH);  // 右基部
  ctx.closePath();
  ctx.fill();

  // ---- コックピット窓（アクセント） ----
  var windowR = 5 * Math.min(sx, sy);
  ctx.fillStyle = 'rgba(0, 200, 255, 0.7)';
  ctx.beginPath();
  ctx.arc(0, bodyY + bodyH * 0.2, windowR, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// ---- エクスポート ----
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { drawShip: drawShip };
}
if (typeof window !== 'undefined') {
  window.ShipVisual = { draw: drawShip };
}
