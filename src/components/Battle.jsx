import React from 'react'
import { MONSTERS_PER_BOSS } from '../data/bosses'
import './Battle.css'

const Battle = ({ 
  gameState, 
  getPlayerStats, 
  attackMonster, 
  spawnMonster, 
  nextStage,
  startAutoBattle,
  stopAutoBattle,
  startRest,
  onStageClick
}) => {
  const playerStats = getPlayerStats()
  const enemies = gameState.currentEnemies || []
  const aliveEnemies = enemies.filter(e => e.hp > 0)
  const currentTarget = gameState.currentMonster
  const hasEnemies = aliveEnemies.length > 0
  const playerMaxHp = playerStats.maxHp || 100
  const currentPlayerHp = gameState.playerHp ?? playerMaxHp
  const playerHp = Math.min(currentPlayerHp, playerMaxHp)
  const hpPercent = Math.max(0, Math.min(100, (playerHp / playerMaxHp) * 100))

  return (
    <div className="battle">
      <div className="battle-header">
        <h2>战斗</h2>
        <div className="stage-info" onClick={onStageClick}>
          关卡 {gameState.currentStage || 1}
          {gameState.isBoss && <span className="boss-badge">BOSS</span>}
          <span className="stage-click-hint">点击切换</span>
        </div>
      </div>

      {/* Boss进度条 */}
      {!gameState.isBoss && (
        <div className="boss-progress-section">
          <div className="boss-progress-label">
            Boss进度: {gameState.bossProgress || 0} / {MONSTERS_PER_BOSS}
          </div>
          <div className="boss-progress-bar">
            <div 
              className="boss-progress-fill"
              style={{ width: `${((gameState.bossProgress || 0) / MONSTERS_PER_BOSS) * 100}%` }}
            ></div>
          </div>
          {gameState.bossProgress >= MONSTERS_PER_BOSS && (
            <div className="boss-ready">⚡ Boss已就绪！下次战斗将召唤Boss！</div>
          )}
        </div>
      )}

      <div className="battle-area">
        {/* 玩家信息 */}
        <div className="player-info">
          <div className="character-card player">
            <div className="character-icon">⚔️</div>
            <div className="character-name">玩家 Lv.{gameState.playerLevel || 1}</div>
            <div className="hp-bar-container">
              <div className="hp-bar-label">HP: {playerHp} / {playerMaxHp}</div>
              <div className="hp-bar">
                <div 
                  className="hp-bar-fill player-hp" 
                  style={{ width: `${hpPercent}%` }}
                ></div>
              </div>
            </div>
            <div className="character-stats">
              <div className="stat-item">
                <span className="stat-label">攻击:</span>
                <span className="stat-value">{playerStats.attack}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">防御:</span>
                <span className="stat-value">{playerStats.defense}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">暴击率:</span>
                <span className="stat-value">{(playerStats.critRate || 0).toFixed(1)}%</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">暴击伤害:</span>
                <span className="stat-value">{Math.round(playerStats.critDamage || 150)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* 战斗按钮 */}
        <div className="battle-controls">
          {gameState.isAutoBattle ? (
            <button className="stop-auto-btn" onClick={stopAutoBattle}>
              ⏹️ 停止自动战斗
            </button>
          ) : (
            <>
              {hasEnemies ? (
                <>
                  <button 
                    className="attack-btn" 
                    onClick={attackMonster}
                    disabled={gameState.isResting}
                  >
                    ⚔️ 攻击
                  </button>
                  <button 
                    className="auto-battle-btn" 
                    onClick={startAutoBattle}
                    disabled={gameState.isResting || playerHp <= 0}
                  >
                    🔄 自动战斗
                  </button>
                </>
              ) : (
                <button 
                  className="spawn-btn" 
                  onClick={spawnMonster}
                  disabled={gameState.isResting}
                >
                  🎯 生成怪物
                </button>
              )}
              {!hasEnemies && gameState.currentStage > 1 && (
                <button 
                  className="next-stage-btn" 
                  onClick={nextStage}
                  disabled={gameState.isResting}
                >
                  ⬆️ 下一关
                </button>
              )}
            </>
          )}
          {gameState.isResting ? (
            <div className="resting-status">
              <div className="rest-progress-bar">
                <div 
                  className="rest-progress-fill"
                  style={{ width: `${(gameState.restProgress / 5) * 100}%` }}
                ></div>
              </div>
              <div className="rest-text">
                休息中... {gameState.restProgress.toFixed(1)} / 5.0 秒
              </div>
            </div>
          ) : (
            <button 
              className="rest-btn" 
              onClick={startRest}
              disabled={gameState.isAutoBattle || playerHp >= playerMaxHp}
            >
              💚 休息回血
            </button>
          )}
        </div>

        {/* 怪物信息 */}
        <div className="monster-info">
          {hasEnemies ? (
            <div className="enemies-container">
              {aliveEnemies.map((enemy) => {
                const isCurrentTarget = currentTarget && currentTarget.id === enemy.id
                const enemyHpPercent = Math.max(0, Math.min(100, (enemy.hp / enemy.maxHp) * 100))
                const isBoss = enemy.isBossLeader || gameState.isBoss
                
                return (
                  <div 
                    key={enemy.id} 
                    className={`character-card monster ${isCurrentTarget ? 'current-target' : ''} ${isBoss ? 'boss' : ''}`}
                  >
                    {isBoss && <div className="boss-label">BOSS</div>}
                    {isCurrentTarget && <div className="target-indicator">🎯 目标</div>}
                    <div className="character-icon">{enemy.icon}</div>
                    <div className="character-name">{enemy.name}</div>
                    <div className="hp-bar-container">
                      <div className="hp-bar-label">
                        HP: {enemy.hp} / {enemy.maxHp}
                      </div>
                      <div className="hp-bar">
                        <div 
                          className="hp-bar-fill monster-hp" 
                          style={{ width: `${enemyHpPercent}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="character-stats">
                      <div className="stat-item">
                        <span className="stat-label">攻击:</span>
                        <span className="stat-value">{enemy.attack}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">防御:</span>
                        <span className="stat-value">{enemy.defense}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">暴击率:</span>
                        <span className="stat-value">{enemy.critRate || 0}%</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">暴击伤害:</span>
                        <span className="stat-value">{enemy.critDamage || 150}%</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="no-monster">
              <div className="no-monster-icon">💤</div>
              <div className="no-monster-text">暂无怪物</div>
            </div>
          )}
        </div>
      </div>

      {/* 战斗日志 */}
      <div className="battle-log">
        <h3>战斗日志</h3>
        <div className="log-content">
          {gameState.battleLog && gameState.battleLog.length > 0 ? (
            gameState.battleLog.slice().reverse().map((log, index) => (
              <div key={index} className="log-entry">
                {log}
              </div>
            ))
          ) : (
            <div className="log-entry empty">暂无战斗记录</div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Battle

