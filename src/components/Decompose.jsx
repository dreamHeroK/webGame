import React, { useState } from 'react'
import { EQUIPMENT_QUALITIES } from '../data/equipment'
import './Decompose.css'

const Decompose = ({ gameState, decomposeEquipmentBatch, setAutoDecompose }) => {
  const [maxQuality, setMaxQuality] = useState(gameState.autoDecompose.maxQuality || 0)
  const [maxLevel, setMaxLevel] = useState(gameState.autoDecompose.maxLevel || 1)

  // 计算符合分解条件的装备数量
  const getDecomposableCount = () => {
    return gameState.inventory.filter(eq => 
      eq.qualityIndex <= maxQuality && eq.level <= maxLevel
    ).length
  }

  const handleDecompose = () => {
    decomposeEquipmentBatch(maxQuality, maxLevel)
  }

  const handleToggleAutoDecompose = () => {
    setAutoDecompose(
      !gameState.autoDecompose.enabled,
      maxQuality,
      maxLevel
    )
  }

  return (
    <div className="decompose">
      <h2>装备分解</h2>
      <div className="decompose-stats">
        <span className="stat-label">当前强化石:</span>
        <span className="stat-value">{(gameState.strengthenStones || 0).toLocaleString()}</span>
      </div>
      
      {/* 自动分解设置 */}
      <div className="auto-decompose-section">
        <h3>自动分解设置</h3>
        <div className="auto-decompose-toggle">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={gameState.autoDecompose.enabled}
              onChange={handleToggleAutoDecompose}
            />
            <span>启用自动分解</span>
          </label>
          {gameState.autoDecompose.enabled && (
            <div className="auto-decompose-info">
              <span className="info-text">
                自动分解：品质 ≤ {EQUIPMENT_QUALITIES[maxQuality].name}，等级 ≤ {maxLevel}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 手动分解设置 */}
      <div className="manual-decompose-section">
        <h3>手动分解</h3>
        <div className="decompose-settings">
          <div className="setting-group">
            <label>最大品质:</label>
            <select 
              value={maxQuality} 
              onChange={(e) => {
                const val = parseInt(e.target.value)
                setMaxQuality(val)
                if (gameState.autoDecompose.enabled) {
                  setAutoDecompose(true, val, maxLevel)
                }
              }}
            >
              {EQUIPMENT_QUALITIES.map((quality, index) => (
                <option key={index} value={index}>{quality.name}</option>
              ))}
            </select>
          </div>
          <div className="setting-group">
            <label>最大等级:</label>
            <input
              type="number"
              min="1"
              max="100"
              value={maxLevel}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 1
                setMaxLevel(val)
                if (gameState.autoDecompose.enabled) {
                  setAutoDecompose(true, maxQuality, val)
                }
              }}
            />
          </div>
        </div>
        <div className="decompose-info">
          <div className="info-item">
            <span className="info-label">符合条件:</span>
            <span className="info-value">{getDecomposableCount()} 件装备</span>
          </div>
        </div>
        <button
          className="decompose-btn"
          onClick={handleDecompose}
          disabled={getDecomposableCount() === 0}
        >
          分解符合条件的装备 ({getDecomposableCount()})
        </button>
      </div>

      {/* 分解说明 */}
      <div className="decompose-help">
        <h4>说明</h4>
        <ul>
          <li>自动分解：击败怪物获得的装备如果符合条件会自动分解，不会进入背包</li>
          <li>手动分解：可以批量分解背包中符合条件的所有装备</li>
          <li>每件装备分解可获得一定数量的强化石，强化石用于提升装备部位效果</li>
          <li>分解后装备将永久消失，请谨慎操作</li>
        </ul>
      </div>
    </div>
  )
}

export default Decompose

