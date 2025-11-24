// 怪物天生技能
export const MONSTER_SKILLS = {
  goblin: {
    name: '投掷石块',
    description: '有30%概率造成1.5倍伤害',
    trigger: 'attack',
    chance: 0.3,
    effect: { damageMultiplier: 1.5 }
  },
  orc: {
    name: '狂暴',
    description: '生命值低于50%时，攻击力提升50%',
    trigger: 'passive',
    condition: { hpPercent: 0.5 },
    effect: { attackMultiplier: 1.5 }
  },
  skeleton: {
    name: '骨盾',
    description: '受到攻击时有20%概率减少50%伤害',
    trigger: 'defend',
    chance: 0.2,
    effect: { damageReduction: 0.5 }
  },
  dragon: {
    name: '龙息',
    description: '每3回合对所有敌人造成200%攻击力的火焰伤害',
    trigger: 'active',
    cooldown: 3,
    effect: { damageMultiplier: 2.0, targetAll: true, element: 'fire' }
  },
  demon: {
    name: '暗影突袭',
    description: '有25%概率造成2倍伤害并恢复造成伤害的50%生命值',
    trigger: 'attack',
    chance: 0.25,
    effect: { damageMultiplier: 2.0, lifesteal: 0.5 }
  },
  titan: {
    name: '大地震击',
    description: '每4回合对所有敌人造成150%攻击力的伤害并降低20%防御',
    trigger: 'active',
    cooldown: 4,
    effect: { damageMultiplier: 1.5, targetAll: true, debuff: { defenseReduction: 0.2 } }
  },
  phoenix: {
    name: '涅槃',
    description: '死亡时有50%概率复活并恢复50%生命值',
    trigger: 'death',
    chance: 0.5,
    effect: { revive: true, reviveHpPercent: 0.5 }
  },
  god: {
    name: '神罚',
    description: '每5回合对所有敌人造成300%攻击力的神圣伤害',
    trigger: 'active',
    cooldown: 5,
    effect: { damageMultiplier: 3.0, targetAll: true, element: 'holy' }
  }
}

// 怪物数据
export const MONSTER_TYPES = [
  {
    id: 'goblin',
    name: '哥布林',
    icon: '👹',
    baseHp: 50,
    baseAttack: 5,
    baseDefense: 2,
    critRate: 5,
    critDamage: 150,
    dropRate: 1,
    innateSkill: MONSTER_SKILLS.goblin
  },
  {
    id: 'orc',
    name: '兽人',
    icon: '👺',
    baseHp: 120,
    baseAttack: 12,
    baseDefense: 5,
    critRate: 6,
    critDamage: 160,
    dropRate: 0.12,
    innateSkill: MONSTER_SKILLS.orc
  },
  {
    id: 'skeleton',
    name: '骷髅',
    icon: '💀',
    baseHp: 80,
    baseAttack: 8,
    baseDefense: 3,
    critRate: 7,
    critDamage: 155,
    dropRate: 0.10,
    innateSkill: MONSTER_SKILLS.skeleton
  },
  {
    id: 'dragon',
    name: '巨龙',
    icon: '🐉',
    baseHp: 500,
    baseAttack: 50,
    baseDefense: 20,
    critRate: 8,
    critDamage: 170,
    dropRate: 0.08,
    innateSkill: MONSTER_SKILLS.dragon
  },
  {
    id: 'demon',
    name: '恶魔',
    icon: '😈',
    baseHp: 300,
    baseAttack: 35,
    baseDefense: 15,
    critRate: 9,
    critDamage: 165,
    dropRate: 0.10,
    innateSkill: MONSTER_SKILLS.demon
  },
  {
    id: 'titan',
    name: '泰坦',
    icon: '👑',
    baseHp: 1000,
    baseAttack: 100,
    baseDefense: 40,
    critRate: 10,
    critDamage: 180,
    dropRate: 0.05,
    innateSkill: MONSTER_SKILLS.titan
  },
  {
    id: 'phoenix',
    name: '凤凰',
    icon: '🔥',
    baseHp: 800,
    baseAttack: 80,
    baseDefense: 30,
    critRate: 11,
    critDamage: 185,
    dropRate: 0.06,
    innateSkill: MONSTER_SKILLS.phoenix
  },
  {
    id: 'god',
    name: '神祇',
    icon: '✨',
    baseHp: 2000,
    baseAttack: 200,
    baseDefense: 80,
    critRate: 12,
    critDamage: 200,
    dropRate: 0.03,
    innateSkill: MONSTER_SKILLS.god
  }
]

// 根据关卡计算怪物属性
export const getMonsterStats = (monster, stage) => {
  const multiplier = 1 + (stage - 1) * 0.5 // 每关增加50%属性
  return {
    hp: Math.floor(monster.baseHp * multiplier),
    maxHp: Math.floor(monster.baseHp * multiplier),
    attack: Math.floor(monster.baseAttack * multiplier),
    defense: Math.floor(monster.baseDefense * multiplier),
    critRate: monster.critRate || 5,
    critDamage: monster.critDamage || 150
  }
}

// 怪物掉落已改为装备掉落，由战斗系统处理

