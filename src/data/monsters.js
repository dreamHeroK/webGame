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
    dropRate: 1 // 15% 掉落率（装备掉落由战斗系统处理）
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
    dropRate: 0.12 // 12% 掉落率
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
    dropRate: 0.10 // 10% 掉落率
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
    dropRate: 0.08 // 8% 掉落率
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
    dropRate: 0.10 // 10% 掉落率
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
    dropRate: 0.05 // 5% 掉落率
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
    dropRate: 0.06 // 6% 掉落率
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
    dropRate: 0.03 // 3% 掉落率
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

