import { useState, useEffect, useCallback } from 'react'
import { MONSTER_TYPES, getMonsterStats } from '../data/monsters'
import { EQUIPMENT_SLOTS, generateEquipment } from '../data/equipment'
import { getBossForStage, getBossStats, MONSTERS_PER_BOSS } from '../data/bosses'
import { SKILL_LIST, SKILL_MAP, getRandomSkillDrop, SKILL_DROP_RATE } from '../data/skills'

// 背包最大容量
const MAX_INVENTORY_SIZE = 100

// 装备掉落率
// const EQUIPMENT_DROP_RATE = 0.3 // 30%掉落率
const EQUIPMENT_DROP_RATE = 1

const BASE_PLAYER_HP = 100
const BASE_CRIT_RATE = 5
const BASE_CRIT_DAMAGE = 150
const MAX_EQUIPPED_SKILLS = 3
const BOSS_MINION_COUNT = 2

const randomMonsterType = () =>
  MONSTER_TYPES[Math.floor(Math.random() * MONSTER_TYPES.length)]

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
  }
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
        equippedSkills: parsed.equippedSkills || initialState.equippedSkills
      }
    }
    return initialState
  })

  // 保存游戏状态
  useEffect(() => {
    localStorage.setItem('gameState', JSON.stringify(gameState))
  }, [gameState])

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

    ;(state.equippedSkills || []).forEach(skillId => {
      const skill = SKILL_MAP[skillId]
      if (skill && skill.effects) {
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
      let nextEquipped = [...equipped, skillId]
      if (nextEquipped.length > MAX_EQUIPPED_SKILLS) {
        nextEquipped = nextEquipped.slice(nextEquipped.length - MAX_EQUIPPED_SKILLS)
      }
      return {
        ...prev,
        equippedSkills: nextEquipped
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

      const dropRate = enemy.isBossLeader ? 0.8 : EQUIPMENT_DROP_RATE
      if (Math.random() <= dropRate) {
        const equipment = createEquipmentDrop(stage, enemy.isBossLeader ? 3 : 0)
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

      if (Math.random() <= SKILL_DROP_RATE) {
        const skill = getRandomSkillDrop()
        newState = addSkillToState(
          newState,
          skill.id,
          `📘 获得技能：${skill.name}`
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
    const target = prev.currentMonster || enemies.find(enemy => enemy.hp > 0)
    if (!target) {
      return prev
    }

    const targetIndex = enemies.findIndex(enemy => enemy.id === target.id)
    if (targetIndex === -1) {
      return {
        ...prev,
        currentMonster: enemies.find(enemy => enemy.hp > 0) || null,
        currentEnemies: enemies
      }
    }

    const playerStats = calculatePlayerStats(prev)
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

    let newState = {
      ...prev,
      currentEnemies: enemies,
      currentMonster: enemies[targetIndex],
      battleLog: appendLog(
        prev.battleLog,
        `你对${target.name}造成了${damage}点伤害${
          didCrit ? ' (暴击!)' : ''
        }！`
      )
    }

    if (newHp <= 0) {
      newState = handleEnemyDefeat(
        newState,
        enemies[targetIndex],
        enemies,
        playerStats
      )
    } else {
      const monsterBaseDamage = Math.max(1, target.attack - playerStats.defense)
      const monsterCritChance = (target.critRate || 0) / 100
      const monsterCritDamage = (target.critDamage || 150) / 100
      const monsterDidCrit = Math.random() < monsterCritChance
      const monsterDamage = Math.max(
        1,
        Math.floor(
          monsterBaseDamage *
            (monsterDidCrit ? monsterCritDamage : 1)
        )
      )
      const newPlayerHp = Math.max(
        0,
        (prev.playerHp ?? playerStats.maxHp) - monsterDamage
      )
      newState.playerHp = newPlayerHp
      newState.battleLog = appendLog(
        newState.battleLog,
        `${target.name}对你造成了${monsterDamage}点伤害${
          monsterDidCrit ? ' (暴击!)' : ''
        }！`
      )

      if (newPlayerHp <= 0) {
        newState.battleLog = appendLog(
          newState.battleLog,
          '💀 你被击败了！'
        )
        newState.currentEnemies = []
        newState.currentMonster = null
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
    unequipSkill
  }
}
