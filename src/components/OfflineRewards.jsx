import React from 'react'
import './OfflineRewards.css'

const OfflineRewards = ({ offlineRewards, onClaim, onClose }) => {
  if (!offlineRewards) return null

  const { exp, equipment, skills, monstersKilled, offlineMinutes } = offlineRewards

  const formatTime = (minutes) => {
    if (minutes < 60) return `${minutes}分钟`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`
  }

  return (
    <div className="offline-rewards-overlay">
      <div className="offline-rewards-modal">
        <div className="offline-rewards-header">
          <h2>📦 离线收益</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        
        <div className="offline-rewards-content">
          <div className="offline-time">
            <div className="time-icon">⏰</div>
            <div className="time-text">离线时间：{formatTime(offlineMinutes)}</div>
          </div>

          <div className="rewards-list">
            <div className="reward-item">
              <div className="reward-icon">👹</div>
              <div className="reward-info">
                <div className="reward-label">击杀怪物</div>
                <div className="reward-value">{monstersKilled} 只</div>
              </div>
            </div>

            {exp > 0 && (
              <div className="reward-item">
                <div className="reward-icon">⭐</div>
                <div className="reward-info">
                  <div className="reward-label">获得经验</div>
                  <div className="reward-value">{exp.toLocaleString()} 点</div>
                </div>
              </div>
            )}

            {equipment > 0 && (
              <div className="reward-item">
                <div className="reward-icon">⚔️</div>
                <div className="reward-info">
                  <div className="reward-label">获得装备</div>
                  <div className="reward-value">{equipment} 件</div>
                </div>
              </div>
            )}

            {skills > 0 && (
              <div className="reward-item">
                <div className="reward-icon">📘</div>
                <div className="reward-info">
                  <div className="reward-label">获得技能</div>
                  <div className="reward-value">{skills} 个</div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="offline-rewards-footer">
          <button className="claim-btn" onClick={onClaim}>
            领取奖励
          </button>
        </div>
      </div>
    </div>
  )
}

export default OfflineRewards

