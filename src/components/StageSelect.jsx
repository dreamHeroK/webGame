import React from 'react'
import './StageSelect.css'

const StageSelect = ({ gameState, selectStage, onSelectStage }) => {
  const maxStage = gameState.maxStageReached || 1
  const currentStage = gameState.currentStage || 1

  const handleSelect = (stage, isUnlocked) => {
    if (!isUnlocked) return
    selectStage(stage)
    if (onSelectStage) {
      onSelectStage(stage)
    }
  }

  return (
    <div className="stage-select">
      <h2>关卡选择</h2>
      <p className="stage-select-desc">选择已通关的关卡进行重复挑战</p>
      <div className="stage-grid">
        {Array.from({ length: Math.max(maxStage, 10) }, (_, i) => i + 1).map(stage => {
          const isUnlocked = stage <= maxStage
          const isCurrent = stage === currentStage
          
          return (
            <button
              key={stage}
              className={`stage-button ${isCurrent ? 'current' : ''} ${!isUnlocked ? 'locked' : ''}`}
              onClick={() => handleSelect(stage, isUnlocked)}
              disabled={!isUnlocked}
            >
              <div className="stage-number">{stage}</div>
              {isCurrent && <div className="current-badge">当前</div>}
              {!isUnlocked && <div className="locked-badge">未解锁</div>}
            </button>
          )
        })}
      </div>
      <div className="stage-info-text">
        <p>已通关最高关卡: <strong>{maxStage}</strong></p>
        <p>当前关卡: <strong>{currentStage}</strong></p>
      </div>
    </div>
  )
}

export default StageSelect

