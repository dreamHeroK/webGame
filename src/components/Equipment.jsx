import React from 'react'
import { EQUIPMENT_SLOTS } from '../hooks/useGameState'
import './Equipment.css'

const Equipment = ({ gameState, upgradeEquipment, getEquipmentUpgradeCost }) => {
  const slotIcons = {
    武器: '⚔️',
    头盔: '🪖',
    护甲: '🛡️',
    护腿: '🦵',
    靴子: '👢',
    饰品: '💍'
  }

  return (
    <div className="equipment">
      <h2>装备</h2>
      <p className="section-description">升级装备可以增加点击力量</p>
      <div className="equipment-grid">
        {EQUIPMENT_SLOTS.map(slot => {
          const equipment = gameState.equipment[slot]
          const level = equipment.level || 0
          const { resourceType, cost } = getEquipmentUpgradeCost(slot)
          const canAfford = gameState.resources[resourceType] >= cost

          return (
            <div key={slot} className="equipment-item">
              <div className="equipment-icon">{slotIcons[slot]}</div>
              <div className="equipment-info">
                <div className="equipment-name">{slot}</div>
                <div className="equipment-level">等级: {level}</div>
                {level > 0 && (
                  <div className="equipment-stats">
                    <div className="stat-line">
                      <span className="stat-icon">⚔️</span>
                      <span>攻击: {equipment.attack || 0}</span>
                    </div>
                    <div className="stat-line">
                      <span className="stat-icon">🛡️</span>
                      <span>防御: {equipment.defense || 0}</span>
                    </div>
                  </div>
                )}
              </div>
              <button
                className={`upgrade-btn ${canAfford ? '' : 'disabled'}`}
                onClick={() => upgradeEquipment(slot)}
                disabled={!canAfford}
              >
                升级 ({cost.toLocaleString()} {resourceType})
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Equipment

