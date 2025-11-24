import React, { useState, useEffect, useRef } from 'react'
import { useGameState } from './hooks/useGameState'
import Battle from './components/Battle'
import Inventory from './components/Inventory'
import Decompose from './components/Decompose'
import Bestiary from './components/Bestiary'
import Skills from './components/Skills'
import StageSelect from './components/StageSelect'
import './App.css'

function App() {
  const [activePanel, setActivePanel] = useState('inventory')
  const [showStageSelect, setShowStageSelect] = useState(false)
  const cheatStreakRef = useRef(0)
  const {
    gameState,
    getPlayerStats,
    spawnMonster,
    attackMonster,
    nextStage,
    selectStage,
    startAutoBattle,
    stopAutoBattle,
    startRest,
    equipItem,
    unequipItem,
    decomposeEquipment,
    decomposeEquipmentBatch,
    setAutoDecompose,
    handleCheatCode,
    setAutoAdvance,
    equipSkill,
    unequipSkill
  } = useGameState()

  const playerStats = getPlayerStats()

  // 隐藏密码监听：连续按下三次“k”
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key.toLowerCase() === 'k') {
        cheatStreakRef.current += 1
        if (cheatStreakRef.current >= 3) {
          handleCheatCode()
          cheatStreakRef.current = 0
          alert('🎉 隐藏密码激活！获得5000攻击力和5000防御力！')
        }
      } else {
        cheatStreakRef.current = 0
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [handleCheatCode])

  return (
    <div className="app">
      <div className="app-container">
        <div className="battle-top">
          <div className="player-stats-bar">
            <div className="stat-item">
              <span className="stat-icon">⭐</span>
              <span className="stat-label">等级:</span>
              <span className="stat-value">Lv.{gameState.playerLevel || 1}</span>
            </div>
            <div className="stat-item">
              <span className="stat-icon">📈</span>
              <span className="stat-label">经验:</span>
              <span className="stat-value">
                {(gameState.playerExp || 0).toLocaleString()} / {(gameState.expToNextLevel || 100).toLocaleString()}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-icon">⚔️</span>
              <span className="stat-label">攻击:</span>
              <span className="stat-value">{playerStats.attack}</span>
            </div>
            <div className="stat-item">
              <span className="stat-icon">🛡️</span>
              <span className="stat-label">防御:</span>
              <span className="stat-value">{playerStats.defense}</span>
            </div>
            <div className="stat-item">
              <span className="stat-icon">❤️</span>
              <span className="stat-label">血量:</span>
              <span className="stat-value">{Math.min(gameState.playerHp ?? playerStats.maxHp, playerStats.maxHp)} / {playerStats.maxHp}</span>
            </div>
            <div className="stat-item">
              <span className="stat-icon">💥</span>
              <span className="stat-label">暴击:</span>
              <span className="stat-value">{(playerStats.critRate || 0).toFixed(1)}%</span>
            </div>
            <div className="stat-item">
              <span className="stat-icon">🔥</span>
              <span className="stat-label">暴伤:</span>
              <span className="stat-value">{Math.round(playerStats.critDamage || 150)}%</span>
            </div>
          </div>

          <Battle
            gameState={gameState}
            getPlayerStats={getPlayerStats}
            attackMonster={attackMonster}
            spawnMonster={spawnMonster}
            nextStage={nextStage}
            startAutoBattle={startAutoBattle}
            stopAutoBattle={stopAutoBattle}
            startRest={startRest}
            onStageClick={() => setShowStageSelect(true)}
          />
        </div>

        {showStageSelect && (
          <div className="stage-select-overlay">
            <div className="stage-select-modal">
              <button
                className="stage-close-btn"
                onClick={() => setShowStageSelect(false)}
                aria-label="关闭关卡选择"
              >
                ✕
              </button>
              <StageSelect
                gameState={gameState}
                selectStage={selectStage}
                onSelectStage={() => setShowStageSelect(false)}
              />
            </div>
          </div>
        )}

        <div className="panel-section">
          {activePanel === 'inventory' && (
            <Inventory
              gameState={gameState}
              equipItem={equipItem}
              unequipItem={unequipItem}
              decomposeEquipment={decomposeEquipment}
            />
          )}
          {activePanel === 'decompose' && (
            <Decompose
              gameState={gameState}
              decomposeEquipmentBatch={decomposeEquipmentBatch}
              setAutoDecompose={setAutoDecompose}
            />
          )}
          {activePanel === 'bestiary' && (
            <Bestiary
              gameState={gameState}
              getPlayerStats={getPlayerStats}
            />
          )}
          {activePanel === 'skills' && (
            <Skills
              gameState={gameState}
              equipSkill={equipSkill}
              unequipSkill={unequipSkill}
            />
          )}
        </div>
      </div>

      <div className="bottom-nav">
        <button
          className={`bottom-nav-btn ${activePanel === 'inventory' ? 'active' : ''}`}
          onClick={() => setActivePanel('inventory')}
        >
          📦 背包
        </button>
        <button
          className={`bottom-nav-btn ${activePanel === 'decompose' ? 'active' : ''}`}
          onClick={() => setActivePanel('decompose')}
        >
          🔨 分解
        </button>
        <button
          className={`bottom-nav-btn ${activePanel === 'bestiary' ? 'active' : ''}`}
          onClick={() => setActivePanel('bestiary')}
        >
          📖 图鉴
        </button>
        <button
          className={`bottom-nav-btn ${activePanel === 'skills' ? 'active' : ''}`}
          onClick={() => setActivePanel('skills')}
        >
          ⚡ 技能
        </button>
        <button
          className="bottom-nav-btn"
          onClick={() => setShowStageSelect(true)}
        >
          🗺️ 关卡
        </button>
        <div className="bottom-nav-divider" />
        <div className="farm-toggle">
          <button
            className={`farm-btn ${gameState.autoAdvance !== false ? 'active' : ''}`}
            onClick={() => setAutoAdvance(true)}
          >
            自动闯关
          </button>
          <button
            className={`farm-btn ${gameState.autoAdvance === false ? 'active' : ''}`}
            onClick={() => setAutoAdvance(false)}
          >
            当前关卡
          </button>
        </div>
      </div>
    </div>
  )
}

export default App

