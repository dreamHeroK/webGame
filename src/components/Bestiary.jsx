import React from 'react'
import { MONSTER_TYPES } from '../data/monsters'
import './Bestiary.css'

const Bestiary = ({ gameState, getPlayerStats }) => {
  const bestiary = gameState.bestiary || {}
  const playerStats = getPlayerStats()
  
  // 计算总图鉴加成
  let totalBonusAttack = 0
  let totalBonusDefense = 0
  Object.values(bestiary).forEach(entry => {
    if (entry && entry.collected) {
      const perStack = entry.bonusPerStack || entry.bonus || {}
      const count = entry.count || 1
      totalBonusAttack += (perStack.attack || 0) * count
      totalBonusDefense += (perStack.defense || 0) * count
    }
  })

  const collectedCount = Object.values(bestiary).filter(e => e.collected).length
  const totalCount = MONSTER_TYPES.length

  return (
    <div className="bestiary">
      <h2>怪物图鉴</h2>
      <div className="bestiary-summary">
        <div className="summary-item">
          <span className="summary-label">收集进度:</span>
          <span className="summary-value">
            {collectedCount} / {totalCount}
          </span>
        </div>
        <div className="summary-item">
          <span className="summary-label">图鉴加成:</span>
          <span className="summary-value">
            攻击 +{totalBonusAttack} | 防御 +{totalBonusDefense}
          </span>
        </div>
      </div>
      <div className="bestiary-grid">
        {MONSTER_TYPES.map(monster => {
          const entry = bestiary[monster.id]
          const collected = entry && entry.collected
          const count = entry && entry.count ? entry.count : collected ? 1 : 0
          const perStack = entry && (entry.bonusPerStack || entry.bonus)
          const totalAttackBonus = collected ? (perStack?.attack || 0) * count : 0
          const totalDefenseBonus = collected ? (perStack?.defense || 0) * count : 0
          
          return (
            <div 
              key={monster.id} 
              className={`bestiary-card ${collected ? 'collected' : 'locked'}`}
            >
              <div className="monster-icon">
                {collected ? monster.icon : '❓'}
              </div>
              <div className="monster-name">
                {collected ? monster.name : '???'}
              </div>
              {collected && (
                <div className="monster-bonus">
                  <div className="bonus-item">
                    <span>总攻击 +{totalAttackBonus}</span>
                    <small className="bonus-note">({perStack?.attack || 0}/层 × {count})</small>
                  </div>
                  <div className="bonus-item">
                    <span>总防御 +{totalDefenseBonus}</span>
                    <small className="bonus-note">({perStack?.defense || 0}/层 × {count})</small>
                  </div>
                  <div className="bonus-item">
                    <span>收集次数 ×{count}</span>
                  </div>
                </div>
              )}
              {!collected && (
                <div className="monster-info-locked">
                  <div className="info-item">HP: ???</div>
                  <div className="info-item">攻击: ???</div>
                  <div className="info-item">防御: ???</div>
                </div>
              )}
              {collected && (
                <div className="monster-info">
                  <div className="info-item">HP: {monster.baseHp}</div>
                  <div className="info-item">攻击: {monster.baseAttack}</div>
                  <div className="info-item">防御: {monster.baseDefense}</div>
                  <div className="info-item drop-rate">
                    掉落率: {(monster.dropRate * 100).toFixed(0)}%
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Bestiary

