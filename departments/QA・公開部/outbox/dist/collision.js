// collision.js — AABB衝突判定モジュール
// 純粋関数のみ。クラスに依存しない。
// 他のすべての .js より先に読み込む。

/**
 * AABB（軸平行境界ボックス）衝突判定
 * @param {Object} a - { x, y, width, height }（左上座標基準）
 * @param {Object} b - { x, y, width, height }（左上座標基準）
 * @returns {boolean}
 */
function isColliding(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

/**
 * 弾 vs 敵 の一括衝突判定
 * @param {Bullet[]} bullets
 * @param {Enemy[]} enemies
 * @param {Function} onHit - (bullet, enemy) => void
 */
function checkBulletEnemyCollisions(bullets, enemies, onHit) {
  for (let i = 0; i < bullets.length; i++) {
    const b = bullets[i];
    if (!b.active) continue;
    for (let j = 0; j < enemies.length; j++) {
      const e = enemies[j];
      if (!e.active) continue;
      if (isColliding(b.getBounds(), e.getHitbox())) {
        onHit(b, e);
      }
    }
  }
}

/**
 * 自機 vs 敵 の一括衝突判定
 * @param {Player} player
 * @param {Enemy[]} enemies
 * @param {Function} onHit - (enemy) => void
 */
function checkPlayerEnemyCollisions(player, enemies, onHit) {
  if (player.invincible > 0) return; // 無敵中はスキップ
  const playerBox = player.getHitbox();
  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i];
    if (!e.active) continue;
    if (isColliding(playerBox, e.getBounds())) {
      onHit(e);
    }
  }
}

/**
 * 自機 vs ゴール の衝突判定
 * @param {Player} player
 * @param {Object} goal - { x, y, active, getHitbox() }
 * @returns {boolean}
 */
function checkPlayerGoalCollision(player, goal) {
  if (!goal || !goal.active) return false;
  return isColliding(player.getHitbox(), goal.getHitbox());
}
