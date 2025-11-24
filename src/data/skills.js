export const SKILL_LIST = [
  {
    id: 'skill_power_surge',
    name: '力量激增',
    description: '攻击力 +200',
    effects: { attack: 200 },
    rarity: 'rare'
  },
  {
    id: 'skill_iron_wall',
    name: '钢铁壁垒',
    description: '防御力 +150',
    effects: { defense: 150 },
    rarity: 'rare'
  },
  {
    id: 'skill_berserk',
    name: '狂战之心',
    description: '暴击率 +5%，暴击伤害 +30%',
    effects: { critRate: 5, critDamage: 30 },
    rarity: 'epic'
  },
  {
    id: 'skill_life_bloom',
    name: '生命绽放',
    description: '生命 +500',
    effects: { hp: 500 },
    rarity: 'rare'
  },
  {
    id: 'skill_focus',
    name: '专注意志',
    description: '攻击 +100，防御 +100',
    effects: { attack: 100, defense: 100 },
    rarity: 'epic'
  }
]

export const SKILL_MAP = SKILL_LIST.reduce((map, skill) => {
  map[skill.id] = skill
  return map
}, {})

export const SKILL_DROP_RATE = 0.15

export const getRandomSkillDrop = () => {
  return SKILL_LIST[Math.floor(Math.random() * SKILL_LIST.length)]
}

