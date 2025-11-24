// 装备位置
export const EQUIPMENT_SLOTS = [
  '武器',
  '头盔',
  '护甲',
  '护腿',
  '靴子',
  '饰品'
]

// 装备品质
export const EQUIPMENT_QUALITIES = [
  { name: '普通', color: '#999', multiplier: 1.0, minAffixes: 0, maxAffixes: 1 },
  { name: '优秀', color: '#00ff00', multiplier: 1.2, minAffixes: 1, maxAffixes: 2 },
  { name: '精良', color: '#0080ff', multiplier: 1.5, minAffixes: 2, maxAffixes: 3 },
  { name: '史诗', color: '#8000ff', multiplier: 2.0, minAffixes: 3, maxAffixes: 4 },
  { name: '传说', color: '#ff8000', multiplier: 3.0, minAffixes: 4, maxAffixes: 5 },
  { name: '神话', color: '#ff0080', multiplier: 5.0, minAffixes: 5, maxAffixes: 6 }
]

// 装备属性类型
export const AFFIX_TYPES = {
  武器: ['攻击力', '暴击率', '暴击伤害', '穿透', '吸血'],
  头盔: ['攻击力', '防御力', '生命值', '暴击率', '命中率'],
  护甲: ['防御力', '生命值', '减伤', '格挡', '韧性'],
  护腿: ['攻击力', '防御力', '生命值', '闪避', '速度'],
  靴子: ['攻击力', '防御力', '生命值', '速度', '闪避'],
  饰品: ['攻击力', '防御力', '生命值', '暴击率', '暴击伤害', '穿透', '吸血']
}

// 装备图标
export const EQUIPMENT_ICONS = {
  武器: '⚔️',
  头盔: '🪖',
  护甲: '🛡️',
  护腿: '🦵',
  靴子: '👢',
  饰品: '💍'
}

// 生成随机装备
export const generateEquipment = (slot, level, minQualityIndex = 0) => {
  // 随机品质（普通概率最高，神话最低）
  const qualityRoll = Math.random()
  let qualityIndex = 0
  if (qualityRoll < 0.5) qualityIndex = 0 // 普通 50%
  else if (qualityRoll < 0.75) qualityIndex = 1 // 优秀 25%
  else if (qualityRoll < 0.90) qualityIndex = 2 // 精良 15%
  else if (qualityRoll < 0.97) qualityIndex = 3 // 史诗 7%
  else if (qualityRoll < 0.995) qualityIndex = 4 // 传说 2.5%
  else qualityIndex = 5 // 神话 0.5%

  qualityIndex = Math.max(qualityIndex, minQualityIndex)
  const quality = EQUIPMENT_QUALITIES[qualityIndex]
  
  // 基础属性（根据装备位置）
  const baseStats = {
    武器: { attack: 15, defense: 0, hp: 0, critRate: 3, critDamage: 20 },
    头盔: { attack: 3, defense: 8, hp: 50, critRate: 2, critDamage: 10 },
    护甲: { attack: 0, defense: 20, hp: 100, critRate: 0, critDamage: 5 },
    护腿: { attack: 5, defense: 10, hp: 80, critRate: 1, critDamage: 10 },
    靴子: { attack: 5, defense: 5, hp: 60, critRate: 2, critDamage: 15 },
    饰品: { attack: 8, defense: 8, hp: 40, critRate: 4, critDamage: 25 }
  }

  const base = baseStats[slot]
  
  // 计算基础属性值（等级越高，基础值越高）
  const levelMultiplier = 1 + (level - 1) * 0.1
  const baseAttack = Math.floor(base.attack * levelMultiplier * quality.multiplier)
  const baseDefense = Math.floor(base.defense * levelMultiplier * quality.multiplier)
  const baseHp = Math.floor((base.hp || 0) * levelMultiplier * quality.multiplier)
  const baseCritRate = Math.floor((base.critRate || 0) * levelMultiplier * quality.multiplier)
  const baseCritDamage = Math.floor((base.critDamage || 0) * levelMultiplier * quality.multiplier)
  
  // 生成词条
  const numAffixes = Math.floor(Math.random() * (quality.maxAffixes - quality.minAffixes + 1)) + quality.minAffixes
  const availableAffixes = [...AFFIX_TYPES[slot]]
  const affixes = {}
  
  for (let i = 0; i < numAffixes; i++) {
    if (availableAffixes.length === 0) break
    
    const affixIndex = Math.floor(Math.random() * availableAffixes.length)
    const affixType = availableAffixes.splice(affixIndex, 1)[0]
    
    // 根据词条类型和等级计算数值
    const affixValue = calculateAffixValue(affixType, level, quality.multiplier)
    affixes[affixType] = affixValue
  }
  
  // 生成唯一ID
  const id = `equip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  return {
    id,
    slot,
    name: `${quality.name}${slot}`,
    level,
    quality: quality.name,
    qualityIndex,
    attack: baseAttack,
    defense: baseDefense,
    hp: baseHp,
    critRate: baseCritRate,
    critDamage: baseCritDamage,
    affixes,
    icon: EQUIPMENT_ICONS[slot]
  }
}

// 计算词条数值
const calculateAffixValue = (affixType, level, qualityMultiplier) => {
  const levelBase = 1 + (level - 1) * 0.1
  const baseValue = {
    '攻击力': 5,
    '防御力': 3,
    '生命值': 20,
    '暴击率': 1, // 百分比
    '暴击伤害': 5, // 百分比
    '穿透': 2,
    '吸血': 1, // 百分比
    '减伤': 1, // 百分比
    '格挡': 1, // 百分比
    '韧性': 1, // 百分比
    '命中率': 2, // 百分比
    '闪避': 1, // 百分比
    '速度': 2
  }
  
  const base = baseValue[affixType] || 1
  const value = Math.floor(base * levelBase * qualityMultiplier * (0.8 + Math.random() * 0.4)) // 80%-120%随机
  
  // 百分比属性返回整数，其他返回整数
  if (affixType.includes('率') || affixType.includes('伤害') || affixType.includes('吸血')) {
    return value
  }
  
  return value
}

// 获取品质颜色
export const getQualityColor = (qualityName) => {
  const quality = EQUIPMENT_QUALITIES.find(q => q.name === qualityName)
  return quality ? quality.color : '#999'
}

