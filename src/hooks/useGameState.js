import { useState, useEffect, useCallback } from 'react'
import { MONSTER_TYPES, getMonsterStats, randomMonsterType } from '../data/monsters'
import { EQUIPMENT_SLOTS, generateEquipment } from '../data/equipment'
import { getBossForStage, getBossStats, MONSTERS_PER_BOSS } from '../data/bosses'
import { SKILL_LIST, SKILL_MAP, getRandomSkillDrop, SKILL_DROP_RATE, SKILL_TYPE } from '../data/skills'
import { getCheckInReward, canCheckIn, getConsecutiveDays } from '../data/dailyCheckIn'

// 背包最大容量
const MAX_INVENTORY_SIZE = 100

// 装备掉落率
// const EQUIPMENT_DROP_RATE = 0.3 // 30%掉落率
const EQUIPMENT_DROP_RATE = 1

const BASE_PLAYER_HP = 100
const BASE_CRIT_RATE = 5
const BASE_CRIT_DAMAGE = 150
const BASE_MAX_EQUIPPED_SKILLS = 3
const BOSS_MINION_COUNT = 2

// randomMonsterType 已从 monsters.js 导入

const createEnemyFromType = (monsterType, stage, overrides = {}) => {
  const stats = getMonsterStats(monsterType, stage)
  return {
    id: `${monsterType.id}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    typeId: monsterType.id,
    name: overrides.name || monsterType.name,
    icon: overrides.icon || monsterType.icon,
    dropRate: monsterType.dropRate,
    baseAttack: monsterType.baseAttack,
    baseDefense: monsterType.baseDefense,
    stage,
    ...stats,
    ...overrides
  }
}

const cloneEnemies = (enemies = []) => enemies.map(enemy => ({ ...enemy }))

const createEnemyWave = (stage, spawnBoss) => {
  if (spawnBoss) {
    const bossType = getBossForStage(stage)
    const boss = createEnemyFromType(bossType, stage, { isBossLeader: true })
    const adds = Array.from({ length: BOSS_MINION_COUNT }, () =>
      createEnemyFromType(randomMonsterType(), stage, { isBossAdd: true })
    )
    return [boss, ...adds]
  }

  const count = Math.floor(Math.random() * 3) + 1
  return Array.from({ length: count }, () =>
    createEnemyFromType(randomMonsterType(), stage)
  )
}

const hasAliveEnemies = (enemies = []) => enemies.some(enemy => enemy.hp > 0)

const appendLog = (logs = [], message) => [...logs.slice(-9), message]

const createEquipmentDrop = (stage, minQualityIndex = 0) => {
  const slot = EQUIPMENT_SLOTS[Math.floor(Math.random() * EQUIPMENT_SLOTS.length)]
  return generateEquipment(slot, stage, minQualityIndex)
}

const addEquipmentToState = (state, equipment, message) => {
  if (!equipment) {
    return {
      ...state,
      battleLog: appendLog(state.battleLog, message || '未掉落装备')
    }
  }

  const autoSettings = state.autoDecompose || {}
  if (
    autoSettings.enabled &&
    equipment.qualityIndex <= autoSettings.maxQuality &&
    equipment.level <= autoSettings.maxLevel
  ) {
    return {
      ...state,
      battleLog: appendLog(state.battleLog, `${equipment.name}被自动分解`)
    }
  }

  if ((state.inventory || []).length >= MAX_INVENTORY_SIZE) {
    return {
      ...state,
      battleLog: appendLog(state.battleLog, `${equipment.name}因为背包已满而丢失`)
    }
  }

  return {
    ...state,
    inventory: [...(state.inventory || []), equipment],
    battleLog: appendLog(
      state.battleLog,
      message || `获得装备：${equipment.name}`
    )
  }
}

const addSkillToState = (state, skillId, message) => {
  const skill = SKILL_MAP[skillId]
  if (!skill) return state

  const skillsInventory = { ...(state.skillsInventory || {}) }
  skillsInventory[skillId] = (skillsInventory[skillId] || 0) + 1

  return {
    ...state,
    skillsInventory,
    battleLog: appendLog(
      state.battleLog,
      message || `📘 获得新技能：${skill.name}`
    )
  }
}

const spawnEnemyWaveState = (state) => {
  const stage = state.currentStage || 1
  const shouldSpawnBoss = state.bossProgress >= MONSTERS_PER_BOSS && !state.isBoss
  const enemies = createEnemyWave(stage, shouldSpawnBoss)
  return {
    ...state,
    currentEnemies: enemies,
    currentMonster: enemies[0] || null,
    isBoss: shouldSpawnBoss,
    bossProgress: shouldSpawnBoss ? 0 : state.bossProgress,
    waveEnemyCount: enemies.length // 记录波次初始敌人数量
  }
}

const getExpForLevel = (level = 1) => 100 + (Math.max(level, 1) - 1) * 50
const getExperienceReward = (stage = 1, isBoss = false) =>
  Math.max(10, Math.floor(stage * (isBoss ? 60 : 20)))

// 根据波次敌人数量计算经验倍率
const getWaveExpMultiplier = (enemyCount, isBoss) => {
  if (isBoss) {
    // Boss波（3只：Boss + 2小怪）= 1.8x
    return 1.8
  }
  // 普通波：1只=1x, 2只=1.2x, 3只=1.5x
  if (enemyCount === 1) return 1.0
  if (enemyCount === 2) return 1.2
  if (enemyCount >= 3) return 1.5
  return 1.0
}

// 根据波次敌人数量计算额外掉落次数
const getWaveExtraDrops = (enemyCount, isBoss) => {
  if (isBoss) {
    // Boss波额外掉落1次装备和1次技能
    return { equipment: 1, skill: 1 }
  }
  // 普通波：2只额外掉落0.3次装备，3只额外掉落0.5次装备和0.3次技能
  if (enemyCount === 2) {
    return { equipment: Math.random() < 0.3 ? 1 : 0, skill: 0 }
  }
  if (enemyCount >= 3) {
    return {
      equipment: Math.random() < 0.5 ? 1 : 0,
      skill: Math.random() < 0.3 ? 1 : 0
    }
  }
  return { equipment: 0, skill: 0 }
}

// 初始状态
const initialState = {
  // 已装备的装备（6个位置）
  equipped: {
    武器: null,
    头盔: null,
    护甲: null,
    护腿: null,
    靴子: null,
    饰品: null
  },
  // 背包（最多100件装备）
  inventory: [],
  skillsInventory: {},
  equippedSkills: [],
  // 战斗相关
  currentStage: 1,
  maxStageReached: 1, // 已通关的最高关卡
  currentEnemies: [],
  isBoss: false, // 当前是否为Boss
  bossProgress: 0, // Boss进度条（0-10，击杀10个小怪后召唤Boss）
  monstersKilled: 0, // 当前关卡击杀的小怪数量
  waveEnemyCount: 0, // 当前波次的初始敌人数量
  playerLevel: 1,
  playerExp: 0,
  expToNextLevel: 100,
  playerHp: BASE_PLAYER_HP,
  autoAdvance: true,
  isAutoBattle: false,
  isResting: false,
  restProgress: 0,
  // 图鉴
  bestiary: {},
  // 战斗日志
  battleLog: [],
  // 自动分解设置
  autoDecompose: {
    enabled: false,
    maxQuality: 0, // 0=普通, 1=优秀, 2=精良, 3=史诗, 4=传说, 5=神话
    maxLevel: 1
  },
  // 隐藏密码奖励
  cheatBonus: {
    attack: 0,
    defense: 0
  },
  // 超稀有怪物奖励（永久属性加成）
  ultraRareBonus: {
    attack: 0,
    defense: 0,
    hp: 0,
    critRate: 0,
    critDamage: 0
  },
  // 签到系统
  checkIn: {
    lastCheckInDate: null,
    consecutiveDays: 0,
    totalCheckIns: 0,
    bonus: {
      attack: 0,
      defense: 0,
      hp: 0,
      critRate: 0,
      critDamage: 0
    }
  },
  // 技能系统
  skillCooldowns: {}, // { skillId: remainingCooldown }
  skillSlots: BASE_MAX_EQUIPPED_SKILLS, // 技能槽位数量（可通过签到增加）
  // 战斗状态
  enemySkipTurns: {}, // { enemyId: skipCount } 控制技能效果
  enemySkillCooldowns: {}, // { enemyId: { skillId: cooldown } } 怪物技能冷却
  // 在线时间跟踪
  onlineTime: 0, // 累计在线时间（秒）
  lastOnlineTime: null, // 最后在线时间戳
  canRevive: false, // 是否可以复活（在线30分钟后）
  // 离线挂机
  lastOfflineTime: null, // 最后离线时间
  offlineRewards: null // 离线收益 { exp, equipment, skills, monstersKilled }
}

export const useGameState = () => {
  const [gameState, setGameState] = useState(() => {
    const saved = localStorage.getItem('gameState')
    if (saved) {
      const parsed = JSON.parse(saved)
      return {
        ...initialState,
        ...parsed,
        equipped: { ...initialState.equipped, ...(parsed.equipped || {}) },
        inventory: parsed.inventory || [],
        bestiary: parsed.bestiary || {},
        autoDecompose: { ...initialState.autoDecompose, ...(parsed.autoDecompose || {}) },
        cheatBonus: parsed.cheatBonus || initialState.cheatBonus,
        maxStageReached: parsed.maxStageReached || parsed.currentStage || 1,
        bossProgress: parsed.bossProgress || 0,
        monstersKilled: parsed.monstersKilled || 0,
        isBoss: parsed.isBoss || false,
        playerLevel: parsed.playerLevel || initialState.playerLevel,
        playerExp: parsed.playerExp || initialState.playerExp,
        expToNextLevel:
          parsed.expToNextLevel ||
          getExpForLevel(parsed.playerLevel || initialState.playerLevel),
        playerHp:
          parsed.playerHp ?? initialState.playerHp,
        autoAdvance:
          typeof parsed.autoAdvance === 'boolean'
            ? parsed.autoAdvance
            : initialState.autoAdvance,
        currentEnemies: parsed.currentEnemies || (parsed.currentMonster ? [parsed.currentMonster] : []),
        skillsInventory: parsed.skillsInventory || initialState.skillsInventory,
        equippedSkills: parsed.equippedSkills || initialState.equippedSkills,
        checkIn: parsed.checkIn || initialState.checkIn,
        skillCooldowns: parsed.skillCooldowns || initialState.skillCooldowns,
        skillSlots: parsed.skillSlots || initialState.skillSlots,
        enemySkipTurns: parsed.enemySkipTurns || initialState.enemySkipTurns,
        enemySkillCooldowns: parsed.enemySkillCooldowns || initialState.enemySkillCooldowns,
        onlineTime: parsed.onlineTime || initialState.onlineTime,
        lastOnlineTime: parsed.lastOnlineTime || initialState.lastOnlineTime,
        canRevive: parsed.canRevive || initialState.canRevive,
        lastOfflineTime: parsed.lastOfflineTime || initialState.lastOfflineTime,
        offlineRewards: parsed.offlineRewards || initialState.offlineRewards,
        ultraRareBonus: parsed.ultraRareBonus || initialState.ultraRareBonus
      }
    }
    return initialState
  })

  // 保存游戏状态
  useEffect(() => {
    localStorage.setItem('gameState', JSON.stringify(gameState))
  }, [gameState])

  // 在线时间跟踪
  useEffect(() => {
    const interval = setInterval(() => {
      setGameState(prev => {
        const newOnlineTime = (prev.onlineTime || 0) + 1
        const canRevive = newOnlineTime >= 1800 // 30分钟 = 1800秒
        
        return {
          ...prev,
          onlineTime: newOnlineTime,
          lastOnlineTime: Date.now(),
          canRevive: canRevive || prev.canRevive // 一旦达到30分钟，保持可复活状态
        }
      })
    }, 1000) // 每秒更新一次

    return () => clearInterval(interval)
  }, [])

  // 检查离线收益（组件加载时）
  useEffect(() => {
    setGameState(prev => {
      const lastOffline = prev.lastOfflineTime
      if (!lastOffline) {
        // 首次加载，记录当前时间
        return {
          ...prev,
          lastOfflineTime: Date.now()
        }
      }

      const now = Date.now()
      const offlineSeconds = Math.floor((now - lastOffline) / 1000)
      
      // 如果离线时间超过1分钟，计算离线收益
      if (offlineSeconds > 60) {
        const offlineMinutes = Math.floor(offlineSeconds / 60)
        const maxOfflineMinutes = Math.min(offlineMinutes, 1440) // 最多24小时
        
        const stage = prev.currentStage || 1
        const playerLevel = prev.playerLevel || 1
        
        // 计算离线收益
        // 假设离线时每分钟击杀1个怪物
        const monstersKilled = maxOfflineMinutes
        const expGain = monstersKilled * getExperienceReward(stage, false)
        const equipmentDrops = Math.floor(monstersKilled * 0.3) // 30%掉落率
        
        const offlineRewards = {
          exp: expGain,
          equipment: equipmentDrops,
          skills: Math.floor(monstersKilled * SKILL_DROP_RATE),
          monstersKilled: monstersKilled,
          offlineMinutes: maxOfflineMinutes
        }
        
        return {
          ...prev,
          offlineRewards,
          lastOfflineTime: now
        }
      }
      
      return prev
    })
  }, []) // 只在组件加载时执行一次

  // 计算玩家总属性
  const calculatePlayerStats = useCallback((state) => {
    const level = state.playerLevel || 1
    let totalAttack = level * 5
    let totalDefense = level * 3
    let bonusHp = level * 50
    let bonusCritRate = Math.min(50, (level - 1) * 0.2)
    let bonusCritDamage = (level - 1) * 2
    
    // 从已装备的装备计算属性
    Object.values(state.equipped || {}).forEach(equip => {
      if (equip) {
        totalAttack += equip.attack || 0
        totalDefense += equip.defense || 0
        bonusHp += equip.hp || 0
        bonusCritRate += equip.critRate || 0
        bonusCritDamage += equip.critDamage || 0
        
        // 计算词条属性
        if (equip.affixes) {
          Object.entries(equip.affixes).forEach(([affixType, value]) => {
            if (affixType === '攻击力') totalAttack += value
            else if (affixType === '防御力') totalDefense += value
            else if (affixType === '生命值') bonusHp += value
            else if (affixType === '暴击率') bonusCritRate += value
            else if (affixType === '暴击伤害') bonusCritDamage += value
          })
        }
      }
    })
    
    // 图鉴加成
    Object.values(state.bestiary || {}).forEach(entry => {
      if (entry && entry.collected) {
        const perStack = entry.bonusPerStack || entry.bonus || {}
        const count = entry.count || 1
        totalAttack += (perStack.attack || 0) * count
        totalDefense += (perStack.defense || 0) * count
      }
    })
    
    // 隐藏密码加成
    if (state.cheatBonus) {
      totalAttack += state.cheatBonus.attack || 0
      totalDefense += state.cheatBonus.defense || 0
    }

    // 签到奖励加成
    if (state.checkIn && state.checkIn.bonus) {
      totalAttack += state.checkIn.bonus.attack || 0
      totalDefense += state.checkIn.bonus.defense || 0
      bonusHp += state.checkIn.bonus.hp || 0
      bonusCritRate += state.checkIn.bonus.critRate || 0
      bonusCritDamage += state.checkIn.bonus.critDamage || 0
    }

    // 超稀有怪物奖励加成（永久属性）
    if (state.ultraRareBonus) {
      totalAttack += state.ultraRareBonus.attack || 0
      totalDefense += state.ultraRareBonus.defense || 0
      bonusHp += state.ultraRareBonus.hp || 0
      bonusCritRate += state.ultraRareBonus.critRate || 0
      bonusCritDamage += state.ultraRareBonus.critDamage || 0
    }

    // 被动技能加成（只计算被动技能）
    ;(state.equippedSkills || []).forEach(skillId => {
      const skill = SKILL_MAP[skillId]
      if (skill && skill.type === SKILL_TYPE.PASSIVE && skill.effects) {
        const effects = skill.effects
        totalAttack += effects.attack || 0
        totalDefense += effects.defense || 0
        bonusHp += effects.hp || 0
        bonusCritRate += effects.critRate || 0
        bonusCritDamage += effects.critDamage || 0
      }
    })
    
    return { 
      attack: totalAttack, 
      defense: totalDefense, 
      maxHp: BASE_PLAYER_HP + bonusHp, 
      critRate: BASE_CRIT_RATE + bonusCritRate, 
      critDamage: BASE_CRIT_DAMAGE + bonusCritDamage 
    }
  }, [])

  // 获取玩家属性
  const getPlayerStats = useCallback(() => {
    return calculatePlayerStats(gameState)
  }, [gameState, calculatePlayerStats])

  // 添加装备到背包
  const addEquipmentToInventory = useCallback((equipment) => {
    if (!equipment) return
    setGameState(prev => addEquipmentToState(prev, equipment))
  }, [])

  // 装备物品
  const equipItem = useCallback((equipmentId) => {
    setGameState(prev => {
      const equipment = prev.inventory.find(eq => eq.id === equipmentId)
      if (!equipment) return prev
      
      const slot = equipment.slot
      const oldEquipment = prev.equipped[slot]
      
      const newInventory = prev.inventory.filter(eq => eq.id !== equipmentId)
      if (oldEquipment) {
        newInventory.push(oldEquipment)
      }
      
      return {
        ...prev,
        equipped: {
          ...prev.equipped,
          [slot]: equipment
        },
        inventory: newInventory
      }
    })
  }, [])

  // 卸下装备
  const unequipItem = useCallback((slot) => {
    setGameState(prev => {
      const equipment = prev.equipped[slot]
      if (!equipment) return prev
      
      if (prev.inventory.length >= MAX_INVENTORY_SIZE) {
        return prev // 背包已满
      }
      
      return {
        ...prev,
        equipped: {
          ...prev.equipped,
          [slot]: null
        },
        inventory: [...prev.inventory, equipment]
      }
    })
  }, [])

  // 分解装备
  const decomposeEquipment = useCallback((equipmentId) => {
    setGameState(prev => {
      return {
        ...prev,
        inventory: prev.inventory.filter(eq => eq.id !== equipmentId)
      }
    })
  }, [])

  // 批量分解装备
  const decomposeEquipmentBatch = useCallback((maxQuality, maxLevel) => {
    setGameState(prev => {
      return {
        ...prev,
        inventory: prev.inventory.filter(eq => 
          !(eq.qualityIndex <= maxQuality && eq.level <= maxLevel)
        )
      }
    })
  }, [])

  // 设置自动分解
  const setAutoDecompose = useCallback((enabled, maxQuality, maxLevel) => {
    setGameState(prev => ({
      ...prev,
      autoDecompose: {
        enabled,
        maxQuality,
        maxLevel
      }
    }))
  }, [])

  const addSkillToInventory = useCallback((skillId) => {
    if (!SKILL_MAP[skillId]) return
    setGameState(prev => addSkillToState(prev, skillId))
  }, [])

  const equipSkill = useCallback((skillId) => {
    if (!SKILL_MAP[skillId]) return
    setGameState(prev => {
      if (!prev.skillsInventory?.[skillId]) return prev
      const equipped = prev.equippedSkills || []
      if (equipped.includes(skillId)) return prev
      const maxSlots = prev.skillSlots || BASE_MAX_EQUIPPED_SKILLS
      if (equipped.length >= maxSlots) return prev
      return {
        ...prev,
        equippedSkills: [...equipped, skillId]
      }
    })
  }, [])

  const unequipSkill = useCallback((skillId) => {
    setGameState(prev => {
      const equipped = prev.equippedSkills || []
      if (!equipped.includes(skillId)) return prev
      return {
        ...prev,
        equippedSkills: equipped.filter(id => id !== skillId)
      }
    })
  }, [])

  // 生成新怪物波次（支持多只敌人）
  const spawnMonster = useCallback(() => {
    setGameState(prev => spawnEnemyWaveState(prev))
  }, [])

  // 选择关卡
  const selectStage = useCallback((stage) => {
    setGameState(prev => {
      if (stage > prev.maxStageReached) {
        return prev // 不能选择未通关的关卡
      }
      const maxHp = calculatePlayerStats(prev).maxHp
      
      return {
        ...prev,
        currentStage: stage,
        currentEnemies: [],
        currentMonster: null,
        bossProgress: 0,
        monstersKilled: 0,
        isBoss: false,
        playerHp: maxHp
      }
    })
  }, [calculatePlayerStats])

  // 掉落装备
  const dropEquipment = useCallback((stage, minQualityIndex = 0) => {
    return createEquipmentDrop(stage, minQualityIndex)
  }, [])

  const applyExperience = useCallback((state, expGain) => {
    if (!expGain || expGain <= 0) {
      return state
    }

    let newState = {
      ...state,
      playerLevel: state.playerLevel || 1,
      playerExp: (state.playerExp || 0) + expGain,
      expToNextLevel: state.expToNextLevel || getExpForLevel(state.playerLevel || 1)
    }

    while (newState.playerExp >= newState.expToNextLevel) {
      newState.playerExp -= newState.expToNextLevel
      newState.playerLevel += 1
      newState.expToNextLevel = getExpForLevel(newState.playerLevel)
      const statsAfterLevel = calculatePlayerStats(newState)
      newState.playerHp = statsAfterLevel.maxHp
      newState.battleLog = [
        ...(newState.battleLog || []).slice(-9),
        `⭐ 等级提升至 Lv.${newState.playerLevel}!`
      ]
    }

    return newState
  }, [calculatePlayerStats])

  const handleEnemyDefeat = useCallback(
    (state, enemy, updatedEnemies, playerStats) => {
      let newState = { ...state }
      const stage = newState.currentStage || 1

      // 检查是否为超稀有怪物
      const monsterType = MONSTER_TYPES.find(m => m.id === enemy.typeId)
      const isUltraRare = monsterType && monsterType.isUltraRare

      // 超稀有怪物必定掉落装备和技能，且掉落高品质装备
      const dropRate = enemy.isBossLeader ? 0.8 : (isUltraRare ? 1 : EQUIPMENT_DROP_RATE)
      if (Math.random() <= dropRate) {
        const minQuality = enemy.isBossLeader ? 3 : (isUltraRare ? 4 : 0) // 超稀有怪物至少掉落传说品质
        const equipment = createEquipmentDrop(stage, minQuality)
        newState = addEquipmentToState(
          newState,
          equipment,
          `${enemy.name}掉落了${equipment.name}`
        )
      } else {
        newState = {
          ...newState,
          battleLog: appendLog(newState.battleLog, `${enemy.name}未掉落装备`)
        }
      }

      // 超稀有怪物必定掉落技能
      const skillDropRate = isUltraRare ? 1 : SKILL_DROP_RATE
      if (Math.random() <= skillDropRate) {
        const skill = getRandomSkillDrop()
        newState = addSkillToState(
          newState,
          skill.id,
          `📘 获得技能：${skill.name}`
        )
      }

      // 超稀有怪物掉落稀有属性（永久加成）
      if (isUltraRare && monsterType.rareDrop) {
        const rareDrop = monsterType.rareDrop
        const ultraRareBonus = { ...(newState.ultraRareBonus || {}) }
        
        ultraRareBonus.attack = (ultraRareBonus.attack || 0) + (rareDrop.attack || 0)
        ultraRareBonus.defense = (ultraRareBonus.defense || 0) + (rareDrop.defense || 0)
        ultraRareBonus.hp = (ultraRareBonus.hp || 0) + (rareDrop.hp || 0)
        ultraRareBonus.critRate = (ultraRareBonus.critRate || 0) + (rareDrop.critRate || 0)
        ultraRareBonus.critDamage = (ultraRareBonus.critDamage || 0) + (rareDrop.critDamage || 0)
        
        newState.ultraRareBonus = ultraRareBonus
        
        const bonusText = [
          rareDrop.attack ? `攻击+${rareDrop.attack}` : '',
          rareDrop.defense ? `防御+${rareDrop.defense}` : '',
          rareDrop.hp ? `生命+${rareDrop.hp}` : '',
          rareDrop.critRate ? `暴击率+${rareDrop.critRate}%` : '',
          rareDrop.critDamage ? `暴击伤害+${rareDrop.critDamage}%` : ''
        ].filter(Boolean).join('、')
        
        newState.battleLog = appendLog(
          newState.battleLog,
          `🌟 击败超稀有怪物${enemy.name}！获得永久属性加成：${bonusText}！`
        )
      }

      const attackBonus = Math.max(
        1,
        Math.floor((enemy.baseAttack || enemy.attack || 1) * 0.1)
      )
      const defenseBonus = Math.max(
        1,
        Math.floor((enemy.baseDefense || enemy.defense || 1) * 0.1)
      )
      const bestiary = { ...(newState.bestiary || {}) }
      const existingEntry = bestiary[enemy.typeId]
      if (!existingEntry) {
        bestiary[enemy.typeId] = {
          collected: true,
          count: 1,
          bonusPerStack: {
            attack: attackBonus,
            defense: defenseBonus
          }
        }
        newState.battleLog = appendLog(
          newState.battleLog,
          `🎉 收集到新图鉴：${enemy.name}！`
        )
      } else {
        const perStack = existingEntry.bonusPerStack || existingEntry.bonus || {
          attack: attackBonus,
          defense: defenseBonus
        }
        const newCount = (existingEntry.count || 1) + 1
        bestiary[enemy.typeId] = {
          ...existingEntry,
          collected: true,
          count: newCount,
          bonusPerStack: perStack
        }
        newState.battleLog = appendLog(
          newState.battleLog,
          `✨ 图鉴强化：${enemy.name} ×${newCount}`
        )
      }
      newState.bestiary = bestiary

      newState = applyExperience(
        newState,
        getExperienceReward(stage, !!enemy.isBossLeader)
      )

      if (!state.isBoss || enemy.isBossAdd) {
        const progress = Math.min(
          (newState.bossProgress || 0) + 1,
          MONSTERS_PER_BOSS
        )
        newState.bossProgress = progress
        newState.monstersKilled = (newState.monstersKilled || 0) + 1
        if (progress >= MONSTERS_PER_BOSS && !state.isBoss) {
          newState.battleLog = appendLog(
            newState.battleLog,
            `⚡ Boss进度条已满！下次战斗将召唤Boss！`
          )
        }
      }

      updatedEnemies =
        updatedEnemies?.map(e =>
          e.id === enemy.id ? { ...e, hp: 0 } : e
        ) || []

      const nextAlive = updatedEnemies.find(e => e.hp > 0)
      if (nextAlive) {
        newState.currentEnemies = updatedEnemies
        newState.currentMonster = nextAlive
      } else {
        // 波次结束，根据初始敌人数量给予额外奖励
        const waveEnemyCount = state.waveEnemyCount || 1
        const isBossWave = state.isBoss
        
        // 计算波次经验倍率奖励
        const expMultiplier = getWaveExpMultiplier(waveEnemyCount, isBossWave)
        const baseExp = getExperienceReward(stage, isBossWave)
        const waveBonusExp = Math.floor(baseExp * (expMultiplier - 1))
        if (waveBonusExp > 0) {
          newState = applyExperience(newState, waveBonusExp)
          newState.battleLog = appendLog(
            newState.battleLog,
            `✨ 波次奖励：额外获得 ${waveBonusExp} 经验值（${waveEnemyCount}只敌人 ×${expMultiplier.toFixed(1)}倍率）`
          )
        }
        
        // 额外掉落奖励
        const extraDrops = getWaveExtraDrops(waveEnemyCount, isBossWave)
        if (extraDrops.equipment > 0) {
          const extraEquipment = createEquipmentDrop(stage, isBossWave ? 3 : 0)
          newState = addEquipmentToState(
            newState,
            extraEquipment,
            `🎁 波次奖励：获得额外装备 ${extraEquipment.name}`
          )
        }
        if (extraDrops.skill > 0) {
          const extraSkill = getRandomSkillDrop()
          newState = addSkillToState(
            newState,
            extraSkill.id,
            `🎁 波次奖励：获得额外技能 ${extraSkill.name}`
          )
        }
        
        newState.currentEnemies = []
        newState.currentMonster = null
        newState.waveEnemyCount = 0 // 重置波次计数
        
        if (state.isBoss) {
          const shouldAdvance = state.autoAdvance !== false
          newState.battleLog = appendLog(
            newState.battleLog,
            shouldAdvance
              ? `🎊 Boss被击败！自动进入下一关！`
              : '🔁 Boss被击败！保持当前关卡继续刷取。'
          )
          if (shouldAdvance) {
            newState.currentStage = (state.currentStage || 1) + 1
            newState.maxStageReached = Math.max(
              state.maxStageReached || 1,
              newState.currentStage
            )
          }
          newState.bossProgress = 0
          newState.monstersKilled = 0
          newState.isBoss = false
          newState.playerHp = playerStats.maxHp
        }
      }

      return newState
    },
    [applyExperience]
  )

  const performPlayerAttack = useCallback((prev) => {
    const enemies = cloneEnemies(prev.currentEnemies || [])
    const aliveEnemies = enemies.filter(enemy => enemy.hp > 0)
    if (aliveEnemies.length === 0) {
      return prev
    }

    const playerStats = calculatePlayerStats(prev)
    
    // 检查是否有多重箭被动技能
    const multiShotSkill = (prev.equippedSkills || []).find(skillId => {
      const skill = SKILL_MAP[skillId]
      return skill && skill.type === SKILL_TYPE.PASSIVE && skill.effects?.multiTarget
    })
    const multiShotData = multiShotSkill ? SKILL_MAP[multiShotSkill] : null
    
    const multiTargetCount = multiShotData 
      ? (multiShotData.effects.multiTargetCount || 3)
      : 1
    
    // 选择目标（多重箭攻击多个目标）
    const targets = aliveEnemies.slice(0, multiTargetCount)
    const primaryTarget = targets[0]
    
    let totalDamage = 0
    let logMessages = []
    const attackLabel = multiShotData ? `【被动·${multiShotData.name}】` : '【普通攻击】'
    
    // 对每个目标造成伤害
    targets.forEach(target => {
      const targetIndex = enemies.findIndex(enemy => enemy.id === target.id)
      if (targetIndex === -1) return
      
      const baseDamage = Math.max(1, playerStats.attack - target.defense)
      const critChance = (playerStats.critRate || 0) / 100
      const critDamageMultiplier = (playerStats.critDamage || 150) / 100
      const didCrit = Math.random() < critChance
      const damage = Math.max(
        1,
        Math.floor(baseDamage * (didCrit ? critDamageMultiplier : 1))
      )
      
      const newHp = Math.max(0, target.hp - damage)
      enemies[targetIndex] = { ...target, hp: newHp }
      totalDamage += damage
      
      logMessages.push(
        `${attackLabel}你对${target.name}造成了${damage}点伤害${didCrit ? ' (暴击!)' : ''}！`
      )
    })
    
    // 更新技能冷却（每回合减少1）
    const newCooldowns = { ...(prev.skillCooldowns || {}) }
    Object.keys(newCooldowns).forEach(skillId => {
      if (newCooldowns[skillId] > 0) {
        newCooldowns[skillId] = Math.max(0, newCooldowns[skillId] - 1)
      }
    })
    
    let logState = prev.battleLog
    logMessages.forEach(msg => {
      logState = appendLog(logState, msg)
    })

    let newState = {
      ...prev,
      currentEnemies: enemies,
      currentMonster: enemies.find(enemy => enemy.hp > 0) || null,
      skillCooldowns: newCooldowns,
      battleLog: logState
    }
    
    // 检查是否有敌人被击败
    enemies.forEach(enemy => {
      if (enemy.hp <= 0 && enemy.hp !== -1) {
        enemy.hp = -1 // 标记为已处理
        newState = handleEnemyDefeat(newState, enemy, enemies, playerStats)
      }
    })
    
    // 怪物反击（检查是否跳过回合）
    const skipTurns = prev.enemySkipTurns || {}
    const shouldSkipTurn = skipTurns[primaryTarget?.id] > 0
    
    if (shouldSkipTurn) {
      // 减少跳过回合数
      const newSkipTurns = { ...skipTurns }
      newSkipTurns[primaryTarget.id] = Math.max(0, newSkipTurns[primaryTarget.id] - 1)
      if (newSkipTurns[primaryTarget.id] === 0) {
        delete newSkipTurns[primaryTarget.id]
      }
      newState.enemySkipTurns = newSkipTurns
      newState.battleLog = appendLog(
        newState.battleLog,
        `🐑 ${primaryTarget.name}被控制，跳过本回合！`
      )
    } else if (primaryTarget && primaryTarget.hp > 0) {
      // 正常反击
      const monsterBaseDamage = Math.max(1, primaryTarget.attack - playerStats.defense)
      const monsterCritChance = (primaryTarget.critRate || 0) / 100
      const monsterCritDamage = (primaryTarget.critDamage || 150) / 100
      const monsterDidCrit = Math.random() < monsterCritChance
      
      // 检查怪物天生技能
      const monsterType = MONSTER_TYPES.find(m => m.id === primaryTarget.typeId)
      let finalMonsterDamage = monsterBaseDamage
      if (monsterType?.innateSkill) {
        const skill = monsterType.innateSkill
        if (skill.trigger === 'attack' && Math.random() < (skill.chance || 0)) {
          finalMonsterDamage = Math.floor(monsterBaseDamage * (skill.effect.damageMultiplier || 1))
          newState.battleLog = appendLog(
            newState.battleLog,
            `⚡ ${primaryTarget.name}使用了${skill.name}！`
          )
        }
      }
      
      const monsterDamage = Math.max(
        1,
        Math.floor(finalMonsterDamage * (monsterDidCrit ? monsterCritDamage : 1))
      )
      
      const newPlayerHp = Math.max(
        0,
        (prev.playerHp ?? playerStats.maxHp) - monsterDamage
      )
      newState.playerHp = newPlayerHp
      newState.battleLog = appendLog(
        newState.battleLog,
        `${primaryTarget.name}对你造成了${monsterDamage}点伤害${
          monsterDidCrit ? ' (暴击!)' : ''
        }！`
      )

      if (newPlayerHp <= 0) {
        const canRevive = newState.canRevive || false
        newState.battleLog = appendLog(
          newState.battleLog,
          canRevive 
            ? '💀 你被击败了！可以复活继续战斗！'
            : '💀 你被击败了！在线30分钟后可复活继续战斗！'
        )
        newState.currentEnemies = []
        newState.currentMonster = null
        newState.isAutoBattle = false
        newState.isResting = true
        newState.restProgress = 0
      }
    }

    return newState
  }, [calculatePlayerStats, handleEnemyDefeat])

  // 攻击怪物
  const attackMonster = useCallback(() => {
    setGameState(prev => performPlayerAttack(prev))
  }, [performPlayerAttack])

  // 进入下一关
  const nextStage = useCallback(() => {
    setGameState(prev => {
      const maxHp = calculatePlayerStats(prev).maxHp
      return {
        ...prev,
        currentStage: (prev.currentStage || 1) + 1,
        currentEnemies: [],
        currentMonster: null,
        playerHp: maxHp
      }
    })
  }, [calculatePlayerStats])

  // 开始自动战斗
  const startAutoBattle = useCallback(() => {
    setGameState(prev => {
      let newState = {
        ...prev,
        isAutoBattle: true,
        isResting: false,
        restProgress: 0
      }

      if (!hasAliveEnemies(newState.currentEnemies) && newState.playerHp > 0) {
        newState = spawnEnemyWaveState(newState)
      }

      return newState
    })
  }, [])

  // 停止自动战斗
  const stopAutoBattle = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      isAutoBattle: false
    }))
  }, [])

  // 开始休息
  const startRest = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      isResting: true,
      isAutoBattle: false,
      restProgress: 0
    }))
  }, [])

  // 自动战斗逻辑
  useEffect(() => {
    if (!gameState.isAutoBattle) return

    const interval = setInterval(() => {
      setGameState(prev => {
        if (prev.playerHp <= 0) {
          return {
            ...prev,
            isAutoBattle: false,
            isResting: true,
            restProgress: 0
          }
        }

        if (!prev.currentMonster) {
          return spawnEnemyWaveState(prev)
        }

        return performPlayerAttack(prev)
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [gameState.isAutoBattle, performPlayerAttack])

  // 休息逻辑
  useEffect(() => {
    if (!gameState.isResting) return

    const interval = setInterval(() => {
      setGameState(prev => {
        if (!prev.isResting) return prev

        const newProgress = Math.min(prev.restProgress + 0.1, 5)
        
        if (newProgress >= 5) {
          const maxHp = calculatePlayerStats(prev).maxHp
          return {
            ...prev,
            isResting: false,
            restProgress: 0,
            playerHp: maxHp,
            battleLog: [
              ...(prev.battleLog || []).slice(-9),
              '💚 休息完成，血量已回满！'
            ]
          }
        }

        return {
          ...prev,
          restProgress: newProgress
        }
      })
    }, 100)

    return () => clearInterval(interval)
  }, [gameState.isResting, calculatePlayerStats])

  // 初始化时生成第一个怪物
  useEffect(() => {
    if (!gameState.currentMonster && gameState.currentStage && !gameState.isAutoBattle) {
      spawnMonster()
    }
  }, [gameState.currentMonster, gameState.currentStage, gameState.isAutoBattle, spawnMonster])

  // 隐藏密码功能
  const handleCheatCode = useCallback(() => {
    setGameState(prev => {
      if (prev.cheatBonus && prev.cheatBonus.attack >= 5000) {
        return prev // 已经激活过了
      }
      
      const newState = {
        ...prev,
        cheatBonus: {
          attack: 5000,
          defense: 5000
        }
      }
      const maxHp = calculatePlayerStats(newState).maxHp
      return {
        ...newState,
        playerHp: Math.min(newState.playerHp ?? maxHp, maxHp)
      }
    })
  }, [calculatePlayerStats])

  const setAutoAdvance = useCallback((value) => {
    setGameState(prev => ({
      ...prev,
      autoAdvance: value
    }))
  }, [])

  // 签到功能
  const performCheckIn = useCallback(() => {
    setGameState(prev => {
      const checkIn = prev.checkIn || {}
      const lastDate = checkIn.lastCheckInDate
      
      if (!canCheckIn(lastDate)) {
        return prev // 今天已经签到过了
      }
      
      const consecutiveDays = getConsecutiveDays(lastDate, checkIn.consecutiveDays || 0)
      const reward = getCheckInReward(consecutiveDays)
      
      const newBonus = {
        attack: (checkIn.bonus?.attack || 0) + reward.attack,
        defense: (checkIn.bonus?.defense || 0) + reward.defense,
        hp: (checkIn.bonus?.hp || 0) + reward.hp,
        critRate: (checkIn.bonus?.critRate || 0) + reward.critRate,
        critDamage: (checkIn.bonus?.critDamage || 0) + reward.critDamage
      }
      
      const newSkillSlots = (prev.skillSlots || BASE_MAX_EQUIPPED_SKILLS) + reward.skillSlot
      
      return {
        ...prev,
        checkIn: {
          lastCheckInDate: new Date().toISOString(),
          consecutiveDays,
          totalCheckIns: (checkIn.totalCheckIns || 0) + 1,
          bonus: newBonus
        },
        skillSlots: newSkillSlots,
        battleLog: appendLog(
          prev.battleLog,
          `📅 签到成功！连续签到 ${consecutiveDays} 天！` +
          (consecutiveDays % 7 === 0 ? ' 🎁 获得7天奖励！' : '') +
          (consecutiveDays % 30 === 0 ? ' 🎉 获得30天奖励！技能槽位+1！' : '')
        )
      }
    })
  }, [])

  // 释放主动技能
  const castActiveSkill = useCallback((skillId, targetEnemyId = null) => {
    setGameState(prev => {
      const skill = SKILL_MAP[skillId]
      if (!skill || skill.type !== SKILL_TYPE.ACTIVE) return prev
      
      // 检查是否装备了该技能
      if (!prev.equippedSkills?.includes(skillId)) return prev
      
      // 检查冷却时间
      const cooldown = prev.skillCooldowns?.[skillId] || 0
      if (cooldown > 0) return prev
      
      const playerStats = calculatePlayerStats(prev)
      const enemies = cloneEnemies(prev.currentEnemies || [])
      const aliveEnemies = enemies.filter(e => e.hp > 0)
      
      if (aliveEnemies.length === 0) return prev
      
      let newState = { ...prev }
      let logMessages = []
      
      // 根据技能效果执行
      if (skill.effects.heal) {
        // 治疗技能
        const healAmount = Math.floor(playerStats.maxHp * (skill.effects.healPercent || 0.5))
        const newHp = Math.min(
          (prev.playerHp ?? playerStats.maxHp) + healAmount,
          playerStats.maxHp
        )
        newState.playerHp = newHp
        logMessages.push(`【主动技能·${skill.name}】💚 恢复 ${healAmount} 点生命值！`)
      } else if (skill.effects.control && skill.effects.skipTurn) {
        // 控制技能（变羊术等）
        const target = targetEnemyId 
          ? enemies.find(e => e.id === targetEnemyId)
          : aliveEnemies[0]
        
        if (target) {
          const skipTurns = { ...(prev.enemySkipTurns || {}) }
          skipTurns[target.id] = (skipTurns[target.id] || 0) + skill.effects.skipTurn
          newState.enemySkipTurns = skipTurns
          logMessages.push(`【主动技能·${skill.name}】🐑 ${target.name}将跳过 ${skill.effects.skipTurn} 回合！`)
        }
      } else {
        // 伤害技能
        const damageMultiplier = skill.effects.damageMultiplier || 1.0
        const baseDamage = Math.max(1, playerStats.attack)
        const skillDamage = Math.floor(baseDamage * damageMultiplier)
        
        if (skill.effects.targetAll) {
          // 群体伤害
          let totalDamage = 0
          aliveEnemies.forEach(enemy => {
            const actualDamage = Math.max(1, skillDamage - enemy.defense)
            const enemyIndex = enemies.findIndex(e => e.id === enemy.id)
            if (enemyIndex >= 0) {
              enemies[enemyIndex].hp = Math.max(0, enemy.hp - actualDamage)
              totalDamage += actualDamage
            }
          })
          logMessages.push(`【主动技能·${skill.name}】🔥 对所有敌人造成 ${totalDamage} 点伤害！`)
        } else {
          // 单体或指定数量目标
          const targetCount = skill.effects.targetCount || 1
          const targets = targetEnemyId
            ? [enemies.find(e => e.id === targetEnemyId)].filter(Boolean)
            : aliveEnemies.slice(0, targetCount)
          
          targets.forEach(target => {
            if (!target) return
            const actualDamage = Math.max(1, skillDamage - target.defense)
            const enemyIndex = enemies.findIndex(e => e.id === target.id)
            if (enemyIndex >= 0) {
              enemies[enemyIndex].hp = Math.max(0, target.hp - actualDamage)
              logMessages.push(`【主动技能·${skill.name}】⚡ 对${target.name}造成 ${actualDamage} 点伤害！`)
            }
          })
        }
        
        newState.currentEnemies = enemies
        newState.currentMonster = enemies.find(e => e.hp > 0) || null
      }
      
      // 设置冷却时间
      const newCooldowns = { ...(prev.skillCooldowns || {}) }
      newCooldowns[skillId] = skill.cooldown || 0
      newState.skillCooldowns = newCooldowns
      
      // 更新日志
      let updatedLog = prev.battleLog
      logMessages.forEach(msg => {
        updatedLog = appendLog(updatedLog, msg)
      })
      newState.battleLog = updatedLog
      
      // 检查是否有敌人被击败
      enemies.forEach(enemy => {
        if (enemy.hp <= 0 && enemy.hp !== -1) {
          enemy.hp = -1 // 标记为已处理
          newState = handleEnemyDefeat(newState, enemy, enemies, playerStats)
        }
      })
      
      return newState
    })
  }, [calculatePlayerStats, handleEnemyDefeat])

  // 技能冷却倒计时（每回合减少）
  useEffect(() => {
    if (!gameState.isAutoBattle && gameState.currentEnemies?.length > 0) {
      // 在手动战斗时，冷却在攻击后减少
      return
    }
    
    const interval = setInterval(() => {
      setGameState(prev => {
        const cooldowns = { ...(prev.skillCooldowns || {}) }
        let updated = false
        
        Object.keys(cooldowns).forEach(skillId => {
          if (cooldowns[skillId] > 0) {
            cooldowns[skillId] = Math.max(0, cooldowns[skillId] - 1)
            updated = true
          }
        })
        
        if (!updated) return prev
        
        return {
          ...prev,
          skillCooldowns: cooldowns
        }
      })
    }, 1000) // 每秒检查一次（在自动战斗中）
    
    return () => clearInterval(interval)
  }, [gameState.isAutoBattle, gameState.currentEnemies])

  // 复活功能（在线30分钟后可用）
  const reviveAndContinueAutoBattle = useCallback(() => {
    setGameState(prev => {
      if (!prev.canRevive || prev.playerHp > 0) return prev
      
      const playerStats = calculatePlayerStats(prev)
      const hasEnemies = hasAliveEnemies(prev.currentEnemies)
      
      let newState = {
        ...prev,
        playerHp: playerStats.maxHp,
        isResting: false,
        restProgress: 0,
        canRevive: false, // 使用后重置
        battleLog: appendLog(
          prev.battleLog,
          '✨ 复活成功！自动继续战斗！'
        )
      }
      
      // 如果没有敌人，生成新的敌人
      if (!hasEnemies) {
        newState = spawnEnemyWaveState(newState)
      }
      
      // 自动继续战斗
      newState.isAutoBattle = true
      
      return newState
    })
  }, [calculatePlayerStats])

  // 领取离线收益
  const claimOfflineRewards = useCallback(() => {
    setGameState(prev => {
      if (!prev.offlineRewards) return prev
      
      const rewards = prev.offlineRewards
      let newState = { ...prev }
      
      // 应用经验
      if (rewards.exp > 0) {
        newState = applyExperience(newState, rewards.exp)
      }
      
      // 添加装备
      for (let i = 0; i < rewards.equipment; i++) {
        const equipment = createEquipmentDrop(newState.currentStage || 1, false)
        newState = addEquipmentToState(
          newState,
          equipment,
          `离线获得：${equipment.name}`
        )
      }
      
      // 添加技能
      for (let i = 0; i < rewards.skills; i++) {
        const skill = getRandomSkillDrop()
        newState = addSkillToState(
          newState,
          skill.id,
          `离线获得技能：${skill.name}`
        )
      }
      
      // 更新图鉴（假设击杀的怪物是随机类型）
      const monsterTypes = MONSTER_TYPES
      for (let i = 0; i < Math.min(rewards.monstersKilled, 10); i++) {
        const randomType = monsterTypes[Math.floor(Math.random() * monsterTypes.length)]
        const bestiary = { ...(newState.bestiary || {}) }
        const existingEntry = bestiary[randomType.id]
        
        if (existingEntry) {
          bestiary[randomType.id] = {
            ...existingEntry,
            count: (existingEntry.count || 1) + 1
          }
        } else {
          const attackBonus = Math.max(1, Math.floor(randomType.baseAttack * 0.1))
          const defenseBonus = Math.max(1, Math.floor(randomType.baseDefense * 0.1))
          bestiary[randomType.id] = {
            collected: true,
            count: 1,
            bonusPerStack: {
              attack: attackBonus,
              defense: defenseBonus
            }
          }
        }
        newState.bestiary = bestiary
      }
      
      // 清空离线收益
      newState.offlineRewards = null
      
      return newState
    })
  }, [applyExperience])

  // 注销账号（清空所有数据）
  const resetAccount = useCallback(() => {
    if (window.confirm('⚠️ 确定要注销账号吗？这将清空所有游戏数据，此操作不可恢复！')) {
      localStorage.removeItem('gameState')
      window.location.reload()
    }
  }, [])

  return {
    gameState,
    getPlayerStats,
    spawnMonster,
    attackMonster,
    nextStage,
    selectStage,
    startAutoBattle,
    stopAutoBattle,
    startRest,
    equipItem,
    unequipItem,
    decomposeEquipment,
    decomposeEquipmentBatch,
    setAutoDecompose,
    handleCheatCode,
    setAutoAdvance,
    equipSkill,
    unequipSkill,
    performCheckIn,
    castActiveSkill,
    reviveAndContinueAutoBattle,
    claimOfflineRewards,
    resetAccount
  }
}
