import React from 'react'
import { RESOURCE_TYPES } from '../hooks/useGameState'
import './TechUpgrade.css'

const TechUpgrade = ({ gameState, upgradeTech, getTechUpgradeCost }) => {
  return (
    <div className="tech-upgrade">
      <h2>科技升级</h2>
      <p className="section-description">升级科技可以每秒自动生产资源</p>
      <div className="tech-list">
        {RESOURCE_TYPES.map(resource => {
          const level = gameState.techLevels[resource] || 0
          const cost = getTechUpgradeCost(resource)
          const canAfford = gameState.resources[resource] >= cost
          const production = gameState.autoProduction[resource] || 0

          return (
            <div key={resource} className="tech-item">
              <div className="tech-info">
                <div className="tech-header">
                  <span className="tech-name">{resource} 科技</span>
                  <span className="tech-level">Lv.{level}</span>
                </div>
                <div className="tech-stats">
                  <span>生产: {production}/秒</span>
                </div>
              </div>
              <button
                className={`upgrade-btn ${canAfford ? '' : 'disabled'}`}
                onClick={() => upgradeTech(resource)}
                disabled={!canAfford}
              >
                升级 ({cost.toLocaleString()} {resource})
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default TechUpgrade

