import React from 'react'
import { SKILL_LIST, SKILL_MAP, SKILL_TYPE } from '../data/skills'
import './Skills.css'

const Skills = ({ gameState, equipSkill, unequipSkill }) => {
  const skillsInventory = gameState.skillsInventory || {}
  const equippedSkills = gameState.equippedSkills || []
  const skillSlots = gameState.skillSlots || 3

  // 获取稀有度颜色
  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'common': return '#9e9e9e'
      case 'rare': return '#2196f3'
      case 'epic': return '#9c27b0'
      case 'legendary': return '#ff9800'
      default: return '#9e9e9e'
    }
  }

  // 获取稀有度名称
  const getRarityName = (rarity) => {
    switch (rarity) {
      case 'common': return '普通'
      case 'rare': return '稀有'
      case 'epic': return '史诗'
      case 'legendary': return '传说'
      default: return '普通'
    }
  }

  // 格式化效果描述
  const formatEffects = (effects, skillType) => {
    if (!effects) return ''
    const parts = []
    
    if (skillType === SKILL_TYPE.PASSIVE) {
      if (effects.attack) parts.push(`攻击 +${effects.attack}`)
      if (effects.defense) parts.push(`防御 +${effects.defense}`)
      if (effects.hp) parts.push(`生命 +${effects.hp}`)
      if (effects.critRate) parts.push(`暴击率 +${effects.critRate}%`)
      if (effects.critDamage) parts.push(`暴击伤害 +${effects.critDamage}%`)
      if (effects.multiTarget) parts.push(`攻击${effects.multiTargetCount || 3}个目标`)
    } else if (skillType === SKILL_TYPE.ACTIVE) {
      if (effects.damageMultiplier) {
        const target = effects.targetAll ? '所有敌人' : (effects.targetCount ? `${effects.targetCount}个敌人` : '单个敌人')
        parts.push(`对${target}造成${Math.floor(effects.damageMultiplier * 100)}%攻击力伤害`)
      }
      if (effects.heal) {
        parts.push(`恢复${Math.floor((effects.healPercent || 0.5) * 100)}%最大生命值`)
      }
      if (effects.control && effects.skipTurn) {
        parts.push(`使目标跳过${effects.skipTurn}回合`)
      }
    }
    
    return parts.join(', ')
  }

  const ownedSkills = SKILL_LIST.filter(skill => skillsInventory[skill.id] > 0)
  const passiveSkills = ownedSkills.filter(skill => skill.type === SKILL_TYPE.PASSIVE)
  const activeSkills = ownedSkills.filter(skill => skill.type === SKILL_TYPE.ACTIVE)
  const totalSkills = Object.values(skillsInventory).reduce((sum, count) => sum + count, 0)

  return (
    <div className="skills">
      <h2>技能系统</h2>
      
      <div className="skills-summary">
        <div className="summary-item">
          <span className="summary-label">拥有技能:</span>
          <span className="summary-value">{totalSkills} 个</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">已装备:</span>
          <span className="summary-value">
            {equippedSkills.length} / {skillSlots}
          </span>
        </div>
      </div>

      {/* 已装备技能区域 */}
      <div className="equipped-skills-section">
        <h3>已装备技能 ({equippedSkills.length}/{skillSlots})</h3>
        <div className="equipped-skills-grid">
          {equippedSkills.map((skillId, index) => {
            const skill = SKILL_MAP[skillId]
            if (!skill) return null
            return (
              <div key={skillId} className="skill-card equipped">
                <div className="skill-header">
                  <div className="skill-rarity" style={{ backgroundColor: getRarityColor(skill.rarity) }}>
                    {getRarityName(skill.rarity)}
                  </div>
                  <button
                    className="unequip-btn"
                    onClick={() => unequipSkill(skillId)}
                    title="卸下技能"
                  >
                    ✕
                  </button>
                </div>
                <div className="skill-name">
                  {skill.name}
                  <span className={`skill-type-badge ${skill.type === SKILL_TYPE.ACTIVE ? 'active' : 'passive'}`}>
                    {skill.type === SKILL_TYPE.ACTIVE ? '主动' : '被动'}
                  </span>
                </div>
                <div className="skill-description">{skill.description}</div>
                <div className="skill-effects">
                  {formatEffects(skill.effects, skill.type)}
                </div>
                {skill.type === SKILL_TYPE.ACTIVE && skill.cooldown && (
                  <div className="skill-cooldown">冷却: {skill.cooldown} 回合</div>
                )}
                <div className="skill-slot">槽位 {index + 1}</div>
              </div>
            )
          })}
          {equippedSkills.length < skillSlots && (
            Array.from({ length: skillSlots - equippedSkills.length }).map((_, index) => (
              <div key={`empty-${index}`} className="skill-card empty-slot">
                <div className="empty-slot-icon">📭</div>
                <div className="empty-slot-text">空槽位</div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 技能背包区域 */}
      <div className="skills-inventory-section">
        <h3>技能背包</h3>
        
        {/* 被动技能 */}
        {passiveSkills.length > 0 && (
          <div className="skill-category">
            <h4>被动技能</h4>
            <div className="skills-grid">
              {passiveSkills.map(skill => {
                const count = skillsInventory[skill.id] || 0
                const isEquipped = equippedSkills.includes(skill.id)
                const canEquip = !isEquipped && equippedSkills.length < skillSlots
                
                return (
                  <div 
                    key={skill.id} 
                    className={`skill-card inventory ${isEquipped ? 'equipped' : ''}`}
                  >
                    <div className="skill-header">
                      <div className="skill-rarity" style={{ backgroundColor: getRarityColor(skill.rarity) }}>
                        {getRarityName(skill.rarity)}
                      </div>
                      {count > 1 && (
                        <div className="skill-count">×{count}</div>
                      )}
                    </div>
                    <div className="skill-name">
                      {skill.name}
                      <span className="skill-type-badge passive">被动</span>
                    </div>
                    <div className="skill-description">{skill.description}</div>
                    <div className="skill-effects">
                      {formatEffects(skill.effects, skill.type)}
                    </div>
                    <div className="skill-actions">
                      {isEquipped ? (
                        <button
                          className="skill-btn unequip"
                          onClick={() => unequipSkill(skill.id)}
                        >
                          ✓ 已装备
                        </button>
                      ) : (
                        <button
                          className={`skill-btn equip ${canEquip ? '' : 'disabled'}`}
                          onClick={() => canEquip && equipSkill(skill.id)}
                          disabled={!canEquip}
                          title={!canEquip ? '技能槽位已满' : '装备技能'}
                        >
                          {canEquip ? '⚡ 装备' : '槽位已满'}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* 主动技能 */}
        {activeSkills.length > 0 && (
          <div className="skill-category">
            <h4>主动技能</h4>
            <div className="skills-grid">
              {activeSkills.map(skill => {
                const count = skillsInventory[skill.id] || 0
                const isEquipped = equippedSkills.includes(skill.id)
                const canEquip = !isEquipped && equippedSkills.length < skillSlots
                
                return (
                  <div 
                    key={skill.id} 
                    className={`skill-card inventory ${isEquipped ? 'equipped' : ''}`}
                  >
                    <div className="skill-header">
                      <div className="skill-rarity" style={{ backgroundColor: getRarityColor(skill.rarity) }}>
                        {getRarityName(skill.rarity)}
                      </div>
                      {count > 1 && (
                        <div className="skill-count">×{count}</div>
                      )}
                    </div>
                    <div className="skill-name">
                      {skill.name}
                      <span className="skill-type-badge active">主动</span>
                    </div>
                    <div className="skill-description">{skill.description}</div>
                    <div className="skill-effects">
                      {formatEffects(skill.effects, skill.type)}
                    </div>
                    {skill.cooldown && (
                      <div className="skill-cooldown">冷却: {skill.cooldown} 回合</div>
                    )}
                    <div className="skill-actions">
                      {isEquipped ? (
                        <button
                          className="skill-btn unequip"
                          onClick={() => unequipSkill(skill.id)}
                        >
                          ✓ 已装备
                        </button>
                      ) : (
                        <button
                          className={`skill-btn equip ${canEquip ? '' : 'disabled'}`}
                          onClick={() => canEquip && equipSkill(skill.id)}
                          disabled={!canEquip}
                          title={!canEquip ? '技能槽位已满' : '装备技能'}
                        >
                          {canEquip ? '⚡ 装备' : '槽位已满'}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {ownedSkills.length === 0 && (
          <div className="no-skills">
            <div className="no-skills-icon">📘</div>
            <div className="no-skills-text">暂无技能</div>
            <div className="no-skills-hint">击败怪物有概率掉落技能</div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Skills

