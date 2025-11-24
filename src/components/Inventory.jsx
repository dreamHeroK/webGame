import React, { useState } from 'react'
import { EQUIPMENT_SLOTS, EQUIPMENT_ICONS, getQualityColor } from '../data/equipment'
import './Inventory.css'

const Inventory = ({ gameState, equipItem, unequipItem, decomposeEquipment }) => {
  const [filterSlot, setFilterSlot] = useState('全部')
  const [filterQuality, setFilterQuality] = useState('全部')
  const [sortBy, setSortBy] = useState('level') // level, quality, attack, defense

  // 过滤装备
  const filteredInventory = gameState.inventory.filter(equip => {
    if (filterSlot !== '全部' && equip.slot !== filterSlot) return false
    if (filterQuality !== '全部' && equip.quality !== filterQuality) return false
    return true
  })

  // 排序装备
  const sortedInventory = [...filteredInventory].sort((a, b) => {
    switch (sortBy) {
      case 'level':
        return b.level - a.level
      case 'quality':
        return b.qualityIndex - a.qualityIndex
      case 'attack':
        return (b.attack || 0) - (a.attack || 0)
      case 'defense':
        return (b.defense || 0) - (a.defense || 0)
      default:
        return 0
    }
  })

  return (
    <div className="inventory">
      <div className="inventory-header">
        <h2>背包</h2>
        <div className="inventory-count">
          {gameState.inventory.length} / 100
        </div>
      </div>

      {/* 已装备的装备 */}
      <div className="equipped-section">
        <h3>已装备</h3>
        <div className="equipped-grid">
          {EQUIPMENT_SLOTS.map(slot => {
            const equipped = gameState.equipped[slot]
            return (
              <div key={slot} className="equipped-slot">
                <div className="slot-label">{slot}</div>
                {equipped ? (
                  <div 
                    className="equipped-item"
                    style={{ borderColor: getQualityColor(equipped.quality) }}
                    onClick={() => unequipItem(slot)}
                    title="点击卸下"
                  >
                    <div className="item-icon">{equipped.icon}</div>
                    <div className="item-name" style={{ color: getQualityColor(equipped.quality) }}>
                      {equipped.name}
                    </div>
                    <div className="item-level">Lv.{equipped.level}</div>
                  </div>
                ) : (
                  <div className="empty-slot">
                    <div className="empty-icon">{EQUIPMENT_ICONS[slot]}</div>
                    <div className="empty-text">未装备</div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 过滤和排序 */}
      <div className="inventory-filters">
        <div className="filter-group">
          <label>位置:</label>
          <select value={filterSlot} onChange={(e) => setFilterSlot(e.target.value)}>
            <option>全部</option>
            {EQUIPMENT_SLOTS.map(slot => (
              <option key={slot} value={slot}>{slot}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>品质:</label>
          <select value={filterQuality} onChange={(e) => setFilterQuality(e.target.value)}>
            <option>全部</option>
            <option>普通</option>
            <option>优秀</option>
            <option>精良</option>
            <option>史诗</option>
            <option>传说</option>
            <option>神话</option>
          </select>
        </div>
        <div className="filter-group">
          <label>排序:</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="level">等级</option>
            <option value="quality">品质</option>
            <option value="attack">攻击力</option>
            <option value="defense">防御力</option>
          </select>
        </div>
      </div>

      {/* 背包列表 */}
      <div className="inventory-list">
        {sortedInventory.length > 0 ? (
          <div className="inventory-grid">
            {sortedInventory.map(equip => (
              <div
                key={equip.id}
                className="inventory-item"
                style={{ borderColor: getQualityColor(equip.quality) }}
              >
                <div className="item-header">
                  <div className="item-icon">{equip.icon}</div>
                  <div className="item-info">
                    <div className="item-name" style={{ color: getQualityColor(equip.quality) }}>
                      {equip.name}
                    </div>
                    <div className="item-level">Lv.{equip.level}</div>
                  </div>
                </div>
                <div className="item-stats">
                  {equip.attack > 0 && (
                    <div className="stat-line">
                      <span className="stat-icon">⚔️</span>
                      <span>攻击: {equip.attack}</span>
                    </div>
                  )}
                  {equip.defense > 0 && (
                    <div className="stat-line">
                      <span className="stat-icon">🛡️</span>
                      <span>防御: {equip.defense}</span>
                    </div>
                  )}
                  {equip.hp > 0 && (
                    <div className="stat-line">
                      <span className="stat-icon">❤️</span>
                      <span>生命: {equip.hp}</span>
                    </div>
                  )}
                  {equip.critRate > 0 && (
                    <div className="stat-line">
                      <span className="stat-icon">💥</span>
                      <span>暴击: {equip.critRate}%</span>
                    </div>
                  )}
                  {equip.critDamage > 0 && (
                    <div className="stat-line">
                      <span className="stat-icon">🔥</span>
                      <span>暴伤: {equip.critDamage}%</span>
                    </div>
                  )}
                  {equip.affixes && Object.entries(equip.affixes).map(([affix, value]) => (
                    <div key={affix} className="affix-line">
                      {affix}: +{value}
                    </div>
                  ))}
                </div>
                <div className="item-actions">
                  <button
                    className="equip-btn"
                    onClick={() => equipItem(equip.id)}
                  >
                    装备
                  </button>
                  <button
                    className="decompose-btn"
                    onClick={() => decomposeEquipment(equip.id)}
                  >
                    分解
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-inventory">
            <div className="empty-icon">📦</div>
            <div className="empty-text">背包为空</div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Inventory

