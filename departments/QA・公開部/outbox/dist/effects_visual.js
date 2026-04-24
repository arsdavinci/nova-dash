/**
 * effects_visual.js
 * 爆発エフェクト描画モジュール
 *
 * 座標系: 中心座標基準 (x, y)
 * 3フェーズ:
 *   フェーズ1 (frame 0〜7)  : 輝く核
 *   フェーズ2 (frame 8〜14) : 炎の拡散
 *   フェーズ3 (frame 15〜19): フェードアウト
 *
 * グローバル: window.EffectsVisual = { drawExplosion }
 */

// 炎パーティクルの方向を決定論的に固定（毎フレーム同一パターン）
var _particleAngles = null;
function _getParticleAngles(count) {
  if (_particleAngles && _particleAngles.length === count) return _particleAngles;
  _particleAngles = [];
  for (var i = 0; i < count; i++) {
    _particleAngles.push((Math.PI * 2 / count) * i + (Math.sin(i * 1.3) * 0.4));
  }
  return _particleAngles;
}

/**
 * 爆発エフェクトを描画する
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x         - 爆発中心 X
 * @param {number} y         - 爆発中心 Y
 * @param {number} frame     - 現在の爆発フレーム（0 〜 maxFrame-1）
 * @param {number} maxFrame  - 爆発の総フレーム数（推奨：20）
 */
function drawExplosion(ctx, x, y, frame, maxFrame) {
  if (frame >= maxFrame) return;

  ctx.save();

  // フェーズ3: グローバルアルファでフェードアウト
  if (frame >= 15) {
    var fadeAlpha = (maxFrame - frame) / (maxFrame - 15);
    ctx.globalAlpha = Math.max(0, fadeAlpha);
  }

  ctx.translate(x, y);

  if (frame <= 7) {
    // ---- フェーズ1: 輝く核 ----
    var coreR = frame * 2 + 4;

    // 外縁の黄色い輪
    ctx.beginPath();
    ctx.arc(0, 0, coreR + 4, 0, Math.PI * 2);
    ctx.fillStyle = '#FFEE00';
    ctx.fill();

    // 中央の白い核
    ctx.beginPath();
    ctx.arc(0, 0, coreR, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();

    // 光芒（放射状の短い線）
    ctx.strokeStyle = 'rgba(255, 238, 0, 0.6)';
    ctx.lineWidth = 1.5;
    for (var i = 0; i < 8; i++) {
      var angle = (Math.PI * 2 / 8) * i;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * coreR,        Math.sin(angle) * coreR);
      ctx.lineTo(Math.cos(angle) * (coreR + 6),  Math.sin(angle) * (coreR + 6));
      ctx.stroke();
    }

  } else if (frame <= 14) {
    // ---- フェーズ2: 炎の拡散 ----
    var dist = (frame - 8) * 3;
    var particleCount = 8;
    var angles = _getParticleAngles(particleCount);

    for (var p = 0; p < particleCount; p++) {
      var pAngle = angles[p];
      var px = Math.cos(pAngle) * dist;
      var py = Math.sin(pAngle) * dist;

      // 三角形パーティクル
      var triSize = 8 - (frame - 8) * 0.5;
      var colorRand = p % 3;
      if      (colorRand === 0) ctx.fillStyle = '#FF6600';
      else if (colorRand === 1) ctx.fillStyle = '#FF2200';
      else                      ctx.fillStyle = '#FFAA00';

      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(
        px + Math.cos(pAngle + Math.PI * 0.7) * triSize,
        py + Math.sin(pAngle + Math.PI * 0.7) * triSize
      );
      ctx.lineTo(
        px + Math.cos(pAngle - Math.PI * 0.7) * triSize,
        py + Math.sin(pAngle - Math.PI * 0.7) * triSize
      );
      ctx.closePath();
      ctx.fill();
    }

    // 残留核（小さくなっていく）
    var residualR = Math.max(0, 18 - (frame - 7) * 2);
    if (residualR > 0) {
      ctx.beginPath();
      ctx.arc(0, 0, residualR, 0, Math.PI * 2);
      ctx.fillStyle = '#FF6600';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(0, 0, residualR * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = '#FFEE00';
      ctx.fill();
    }

  } else {
    // ---- フェーズ3: フェードアウト（煙・残骸） ----
    var smokeR = 16 + (frame - 15) * 3;
    ctx.beginPath();
    ctx.arc(0, 0, smokeR, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(120, 60, 20, 0.5)';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0, 0, smokeR * 0.6, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(60, 30, 10, 0.4)';
    ctx.fill();
  }

  ctx.restore();
}

// ---- エクスポート ----
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { drawExplosion: drawExplosion };
}
if (typeof window !== 'undefined') {
  window.EffectsVisual = { drawExplosion: drawExplosion };
}
