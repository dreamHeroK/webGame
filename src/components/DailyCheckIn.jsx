import React from 'react'
import { canCheckIn, getConsecutiveDays } from '../data/dailyCheckIn'
import './DailyCheckIn.css'

const DailyCheckIn = ({ gameState, performCheckIn }) => {
  const checkIn = gameState.checkIn || {}
  const lastDate = checkIn.lastCheckInDate
  const consecutiveDays = checkIn.consecutiveDays || 0
  const canCheckInToday = canCheckIn(lastDate)
  const nextConsecutiveDays = getConsecutiveDays(lastDate, consecutiveDays)
  
  const bonus = checkIn.bonus || {}
  const isWeeklyReward = nextConsecutiveDays % 7 === 0 && nextConsecutiveDays > 0
  const isMonthlyReward = nextConsecutiveDays % 30 === 0 && nextConsecutiveDays > 0

  return (
    <div className="daily-check-in">
      <h2>每日签到</h2>
      
      <div className="check-in-status">
        <div className="consecutive-days">
          <div className="days-label">连续签到</div>
          <div className="days-value">{consecutiveDays} 天</div>
        </div>
        <div className="total-check-ins">
          <div className="total-label">累计签到</div>
          <div className="total-value">{checkIn.totalCheckIns || 0} 天</div>
        </div>
      </div>

      <div className="check-in-button-section">
        {canCheckInToday ? (
          <button 
            className="check-in-btn available"
            onClick={performCheckIn}
          >
            <div className="check-in-icon">📅</div>
            <div className="check-in-text">立即签到</div>
            {isWeeklyReward && (
              <div className="special-reward">🎁 7天奖励</div>
            )}
            {isMonthlyReward && (
              <div className="special-reward">🎉 30天奖励</div>
            )}
          </button>
        ) : (
          <button className="check-in-btn completed" disabled>
            <div className="check-in-icon">✓</div>
            <div className="check-in-text">今日已签到</div>
          </button>
        )}
      </div>

      <div className="reward-preview">
        <h3>今日奖励预览</h3>
        <div className="reward-list">
          <div className="reward-item">
            <span className="reward-icon">⚔️</span>
            <span className="reward-label">攻击力:</span>
            <span className="reward-value">+10</span>
          </div>
          <div className="reward-item">
            <span className="reward-icon">🛡️</span>
            <span className="reward-label">防御力:</span>
            <span className="reward-value">+5</span>
          </div>
          <div className="reward-item">
            <span className="reward-icon">❤️</span>
            <span className="reward-label">生命值:</span>
            <span className="reward-value">+50</span>
          </div>
          {isWeeklyReward && (
            <>
              <div className="reward-item special">
                <span className="reward-icon">💥</span>
                <span className="reward-label">暴击率:</span>
                <span className="reward-value">+1%</span>
              </div>
              <div className="reward-item special">
                <span className="reward-icon">🔥</span>
                <span className="reward-label">暴击伤害:</span>
                <span className="reward-value">+5%</span>
              </div>
              <div className="reward-item special">
                <span className="reward-icon">⚔️</span>
                <span className="reward-label">攻击力:</span>
                <span className="reward-value">+50</span>
              </div>
              <div className="reward-item special">
                <span className="reward-icon">🛡️</span>
                <span className="reward-label">防御力:</span>
                <span className="reward-value">+30</span>
              </div>
            </>
          )}
          {isMonthlyReward && (
            <div className="reward-item special monthly">
              <span className="reward-icon">⚡</span>
              <span className="reward-label">技能槽位:</span>
              <span className="reward-value">+1</span>
            </div>
          )}
        </div>
      </div>

      <div className="bonus-summary">
        <h3>累计奖励</h3>
        <div className="bonus-stats">
          <div className="bonus-stat">
            <span className="stat-label">攻击力:</span>
            <span className="stat-value">+{bonus.attack || 0}</span>
          </div>
          <div className="bonus-stat">
            <span className="stat-label">防御力:</span>
            <span className="stat-value">+{bonus.defense || 0}</span>
          </div>
          <div className="bonus-stat">
            <span className="stat-label">生命值:</span>
            <span className="stat-value">+{bonus.hp || 0}</span>
          </div>
          <div className="bonus-stat">
            <span className="stat-label">暴击率:</span>
            <span className="stat-value">+{bonus.critRate || 0}%</span>
          </div>
          <div className="bonus-stat">
            <span className="stat-label">暴击伤害:</span>
            <span className="stat-value">+{bonus.critDamage || 0}%</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DailyCheckIn

