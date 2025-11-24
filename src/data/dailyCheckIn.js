// 签到系统数据
export const DAILY_REWARDS = {
  // 每日签到奖励（基础属性）
  daily: {
    attack: 10,
    defense: 5,
    hp: 50
  },
  // 每7天奖励（稀有属性）
  weekly: {
    critRate: 1,
    critDamage: 5,
    attack: 50,
    defense: 30
  },
  // 每30天奖励（技能格子）
  monthly: {
    skillSlot: 1
  }
}

// 获取签到奖励
export const getCheckInReward = (consecutiveDays) => {
  const rewards = {
    attack: 0,
    defense: 0,
    hp: 0,
    critRate: 0,
    critDamage: 0,
    skillSlot: 0
  }

  // 每日基础奖励
  rewards.attack += DAILY_REWARDS.daily.attack
  rewards.defense += DAILY_REWARDS.daily.defense
  rewards.hp += DAILY_REWARDS.daily.hp

  // 每7天额外奖励
  if (consecutiveDays % 7 === 0) {
    rewards.critRate += DAILY_REWARDS.weekly.critRate
    rewards.critDamage += DAILY_REWARDS.weekly.critDamage
    rewards.attack += DAILY_REWARDS.weekly.attack
    rewards.defense += DAILY_REWARDS.weekly.defense
  }

  // 每30天额外奖励
  if (consecutiveDays % 30 === 0) {
    rewards.skillSlot += DAILY_REWARDS.monthly.skillSlot
  }

  return rewards
}

// 检查是否可以签到
export const canCheckIn = (lastCheckInDate) => {
  if (!lastCheckInDate) return true
  
  const lastDate = new Date(lastCheckInDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  lastDate.setHours(0, 0, 0, 0)
  
  const diffTime = today - lastDate
  const diffDays = diffTime / (1000 * 60 * 60 * 24)
  
  // 如果超过1天未签到，重置连续天数
  if (diffDays > 1) return true
  
  // 如果今天已经签到过，返回false
  if (diffDays === 0) return false
  
  return true
}

// 获取连续签到天数
export const getConsecutiveDays = (lastCheckInDate, consecutiveDays) => {
  if (!lastCheckInDate) return 1
  
  const lastDate = new Date(lastCheckInDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  lastDate.setHours(0, 0, 0, 0)
  
  const diffTime = today - lastDate
  const diffDays = diffTime / (1000 * 60 * 60 * 24)
  
  // 如果超过1天未签到，重置为1
  if (diffDays > 1) return 1
  
  // 如果今天已经签到，返回原连续天数
  if (diffDays === 0) return consecutiveDays
  
  // 如果昨天签到，连续天数+1
  if (diffDays === 1) return consecutiveDays + 1
  
  return 1
}

