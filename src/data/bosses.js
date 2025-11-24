// Boss配置
export const BOSS_TYPES = [
  {
    id: 'boss_1',
    name: '哥布林王',
    icon: '👑👹',
    baseHp: 500,
    baseAttack: 50,
    baseDefense: 20,
    stage: 1
  },
  {
    id: 'boss_2',
    name: '兽人酋长',
    icon: '👑👺',
    baseHp: 1200,
    baseAttack: 120,
    baseDefense: 50,
    stage: 2
  },
  {
    id: 'boss_3',
    name: '骷髅领主',
    icon: '👑💀',
    baseHp: 800,
    baseAttack: 80,
    baseDefense: 30,
    stage: 3
  },
  {
    id: 'boss_4',
    name: '远古巨龙',
    icon: '👑🐉',
    baseHp: 5000,
    baseAttack: 500,
    baseDefense: 200,
    stage: 4
  },
  {
    id: 'boss_5',
    name: '地狱魔王',
    icon: '👑😈',
    baseHp: 3000,
    baseAttack: 350,
    baseDefense: 150,
    stage: 5
  },
  {
    id: 'boss_6',
    name: '泰坦之王',
    icon: '👑👑',
    baseHp: 10000,
    baseAttack: 1000,
    baseDefense: 400,
    stage: 6
  },
  {
    id: 'boss_7',
    name: '不死凤凰',
    icon: '👑🔥',
    baseHp: 8000,
    baseAttack: 800,
    baseDefense: 300,
    stage: 7
  },
  {
    id: 'boss_8',
    name: '创世神',
    icon: '👑✨',
    baseHp: 20000,
    baseAttack: 2000,
    baseDefense: 800,
    stage: 8
  }
]

// 根据关卡获取Boss
export const getBossForStage = (stage) => {
  const bossIndex = Math.min(stage - 1, BOSS_TYPES.length - 1)
  return BOSS_TYPES[bossIndex]
}

// 根据关卡计算Boss属性
export const getBossStats = (boss, stage) => {
  const multiplier = 1 + (stage - 1) * 0.5
  return {
    hp: Math.floor(boss.baseHp * multiplier),
    maxHp: Math.floor(boss.baseHp * multiplier),
    attack: Math.floor(boss.baseAttack * multiplier),
    defense: Math.floor(boss.baseDefense * multiplier)
  }
}

// 每关需要击杀的小怪数量才能召唤Boss
export const MONSTERS_PER_BOSS = 10

