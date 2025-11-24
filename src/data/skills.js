// 技能类型
export const SKILL_TYPE = {
  PASSIVE: 'passive',  // 被动技能
  ACTIVE: 'active'     // 主动技能
}

// 技能列表
export const SKILL_LIST = [
  // ========== 被动技能 ==========
  {
    id: 'skill_power_surge',
    name: '力量激增',
    description: '攻击力 +200',
    type: SKILL_TYPE.PASSIVE,
    effects: { attack: 200 },
    rarity: 'rare'
  },
  {
    id: 'skill_iron_wall',
    name: '钢铁壁垒',
    description: '防御力 +150',
    type: SKILL_TYPE.PASSIVE,
    effects: { defense: 150 },
    rarity: 'rare'
  },
  {
    id: 'skill_berserk',
    name: '狂战之心',
    description: '暴击率 +5%，暴击伤害 +30%',
    type: SKILL_TYPE.PASSIVE,
    effects: { critRate: 5, critDamage: 30 },
    rarity: 'epic'
  },
  {
    id: 'skill_life_bloom',
    name: '生命绽放',
    description: '生命 +500',
    type: SKILL_TYPE.PASSIVE,
    effects: { hp: 500 },
    rarity: 'rare'
  },
  {
    id: 'skill_focus',
    name: '专注意志',
    description: '攻击 +100，防御 +100',
    type: SKILL_TYPE.PASSIVE,
    effects: { attack: 100, defense: 100 },
    rarity: 'epic'
  },
  {
    id: 'skill_multi_shot',
    name: '多重箭',
    description: '攻击时对多个目标造成伤害',
    type: SKILL_TYPE.PASSIVE,
    effects: { multiTarget: true, multiTargetCount: 3 }, // 攻击3个目标
    rarity: 'epic'
  },
  
  // ========== 主动技能 ==========
  {
    id: 'skill_flame_storm',
    name: '烈焰风暴',
    description: '对所有敌人造成150%攻击力的火焰伤害',
    type: SKILL_TYPE.ACTIVE,
    cooldown: 3, // 3回合冷却
    effects: {
      damageMultiplier: 1.5,
      targetAll: true,
      element: 'fire'
    },
    rarity: 'epic'
  },
  {
    id: 'skill_fireball',
    name: '炎爆术',
    description: '对单个目标造成250%攻击力的火焰伤害',
    type: SKILL_TYPE.ACTIVE,
    cooldown: 2, // 2回合冷却
    effects: {
      damageMultiplier: 2.5,
      targetAll: false,
      element: 'fire'
    },
    rarity: 'rare'
  },
  {
    id: 'skill_polymorph',
    name: '变羊术',
    description: '使目标跳过下一回合',
    type: SKILL_TYPE.ACTIVE,
    cooldown: 4, // 4回合冷却
    effects: {
      control: true,
      skipTurn: 1, // 跳过1回合
      targetAll: false
    },
    rarity: 'legendary'
  },
  {
    id: 'skill_chain_lightning',
    name: '连锁闪电',
    description: '对3个目标造成120%攻击力的闪电伤害',
    type: SKILL_TYPE.ACTIVE,
    cooldown: 2,
    effects: {
      damageMultiplier: 1.2,
      targetAll: false,
      targetCount: 3,
      element: 'lightning'
    },
    rarity: 'epic'
  },
  {
    id: 'skill_heal',
    name: '治疗术',
    description: '恢复50%最大生命值',
    type: SKILL_TYPE.ACTIVE,
    cooldown: 3,
    effects: {
      heal: true,
      healPercent: 0.5
    },
    rarity: 'rare'
  }
]

export const SKILL_MAP = SKILL_LIST.reduce((map, skill) => {
  map[skill.id] = skill
  return map
}, {})

// 获取被动技能
export const getPassiveSkills = () => {
  return SKILL_LIST.filter(skill => skill.type === SKILL_TYPE.PASSIVE)
}

// 获取主动技能
export const getActiveSkills = () => {
  return SKILL_LIST.filter(skill => skill.type === SKILL_TYPE.ACTIVE)
}

export const SKILL_DROP_RATE = 0.15

export const getRandomSkillDrop = () => {
  return SKILL_LIST[Math.floor(Math.random() * SKILL_LIST.length)]
}
