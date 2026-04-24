/**
 * objects_visual.js
 * プレイヤー弾・ゴールオブジェクト描画モジュール
 *
 * 座標系: 中心座標基準 (x, y)
 * GDD準拠:
 *   弾  - 6×16px、色 #00ffff（シアン）
 *   ゴール - 64×64px（宇宙ステーション風）
 *
 * グローバル: window.ObjectsVisual = { drawBullet, drawGoal }
 */

/**
 * プレイヤーの弾を描画する
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x - 中心 X 座標
 * @param {number} y - 中心 Y 座標
 */
function drawBullet(ctx, x, y) {
  var bw = 6;
  var bh = 16;

  ctx.save();

  // グロー効果
  ctx.shadowColor = '#00ffff';
  ctx.shadowBlur  = 8;

  // メイン弾体（シアン）GDD準拠色
  ctx.fillStyle = '#00ffff';
  ctx.fillRect(x - bw / 2, y - bh / 2, bw, bh);

  // 発光コア（白）
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(x - 2, y - bh / 2 + 2, 4, bh - 4);

  ctx.restore();
}

/**
 * ゴールオブジェクト（宇宙ステーション風）を描画する
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x     - 中心 X 座標
 * @param {number} y     - 中心 Y 座標
 * @param {number} frame - アニメーションフレームカウント（波紋エフェクト用）
 */
function drawGoal(ctx, x, y, frame) {
  var gw = 64;
  var gh = 64;
  var hw = gw / 2;
  var hh = gh / 2;

  ctx.save();
  ctx.translate(x, y);

  // ---- 波紋エフェクト（同心矩形、外側から拡散） ----
  var waveCount = 3;
  for (var i = 0; i < waveCount; i++) {
    // 位相をずらして複数波紋
    var t = ((frame + i * 20) % 60) / 60; // 0〜1 のループ
    var expand = t * 30;
    var alpha  = 0.4 * (1 - t);
    ctx.strokeStyle = 'rgba(0,255,255,' + alpha + ')';
    ctx.lineWidth   = 1.5;
    ctx.strokeRect(
      -(hw + expand),
      -(hh + expand),
      gw + expand * 2,
      gh + expand * 2
    );
  }

  // ---- ソーラーパネル（左右の横長矩形） ----
  var panelW = 28;
  var panelH = 10;
  ctx.fillStyle = '#2244AA';
  ctx.fillRect(-(hw + panelW), -panelH / 2, panelW, panelH); // 左
  ctx.fillRect(  hw,           -panelH / 2, panelW, panelH); // 右

  // ソーラーパネル詳細線
  ctx.strokeStyle = '#4488FF';
  ctx.lineWidth = 1;
  for (var j = 0; j < 4; j++) {
    var lx = -(hw + panelW) + (j + 1) * (panelW / 4);
    ctx.beginPath();
    ctx.moveTo(lx, -panelH / 2);
    ctx.lineTo(lx,  panelH / 2);
    ctx.stroke();
    var rx = hw + (j + 1) * (panelW / 4);
    ctx.beginPath();
    ctx.moveTo(rx, -panelH / 2);
    ctx.lineTo(rx,  panelH / 2);
    ctx.stroke();
  }

  // ---- 本体内部（薄シアン塗りつぶし） ----
  ctx.fillStyle = 'rgba(0,255,255,0.15)';
  ctx.fillRect(-hw, -hh, gw, gh);

  // ---- 本体詳細（ステーション構造物） ----
  // 中央モジュール
  ctx.fillStyle = '#AABBCC';
  ctx.fillRect(-hw + 8, -hh + 8, gw - 16, gh - 16);

  // ドッキングポート（円）
  ctx.fillStyle = '#CCDDEE';
  ctx.beginPath();
  ctx.arc(0, 0, 12, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#334455';
  ctx.beginPath();
  ctx.arc(0, 0, 8, 0, Math.PI * 2);
  ctx.fill();

  // ドッキングポート光（点滅）
  var dockBlink = Math.floor((frame || 0) / 15) % 2;
  ctx.fillStyle = dockBlink === 0 ? 'rgba(0,255,255,0.8)' : 'rgba(255,255,0,0.6)';
  ctx.beginPath();
  ctx.arc(0, 0, 4, 0, Math.PI * 2);
  ctx.fill();

  // ---- 外枠（シアン） ----
  ctx.strokeStyle = '#00FFFF';
  ctx.lineWidth   = 3;
  ctx.strokeRect(-hw, -hh, gw, gh);

  // ---- テキスト「GOAL」 ----
  ctx.fillStyle  = '#FFFFFF';
  ctx.font       = 'bold 11px monospace';
  ctx.textAlign  = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('GOAL', 0, hh - 4);

  ctx.restore();
}

// ---- エクスポート ----
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { drawBullet: drawBullet, drawGoal: drawGoal };
}
if (typeof window !== 'undefined') {
  window.ObjectsVisual = { drawBullet: drawBullet, drawGoal: drawGoal };
}
