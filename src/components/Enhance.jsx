import React from 'react'
import { EQUIPMENT_SLOTS } from '../data/equipment'
import './Enhance.css'

const ENHANCEMENT_PERCENT_PER_LEVEL = 5
const ENHANCEMENT_COST_PER_LEVEL = 5

const getEnhancementCost = (level = 0) => (level + 1) * ENHANCEMENT_COST_PER_LEVEL

const Enhance = ({ gameState, strengthenSlot }) => {
  const slotEnhancements = gameState.slotEnhancements || {}
  const strengthenStones = gameState.strengthenStones || 0

  return (
    <div className="enhance">
      <div className="enhance-header">
        <h2>装备强化</h2>
        <div className="stone-counter">
          <span className="label">当前强化石</span>
          <span className="value">{strengthenStones.toLocaleString()}</span>
        </div>
      </div>

      <div className="enhance-grid">
        {EQUIPMENT_SLOTS.map(slot => {
          const level = slotEnhancements[slot] || 0
          const cost = getEnhancementCost(level)
          const percent = level * ENHANCEMENT_PERCENT_PER_LEVEL
          const canStrengthen = strengthenStones >= cost

          return (
            <div key={slot} className="enhance-card">
              <div className="card-header">
                <div className="slot-name">{slot}</div>
                <div className="slot-level">+{level}</div>
              </div>
              <div className="card-body">
                <div className="info-line">当前加成：+{percent}%</div>
                <div className="info-line">下级消耗：{cost} 强化石</div>
                <div className="info-line">效果：该部位装备的基础与词条属性提升</div>
              </div>
              <button
                className={`enhance-action ${canStrengthen ? '' : 'disabled'}`}
                onClick={() => canStrengthen && strengthenSlot(slot)}
                disabled={!canStrengthen}
              >
                {canStrengthen ? '强化' : '强化石不足'}
              </button>
            </div>
          )
        })}
      </div>

      <div className="enhance-hint">
        <ul>
          <li>强化是针对装备部位的，替换装备仍然保留加成</li>
          <li>强化石可通过分解装备或自动分解获得</li>
          <li>消耗数量线性增长：下一等级 ×5</li>
        </ul>
      </div>
    </div>
  )
}

export default Enhance


