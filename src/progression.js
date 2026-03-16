export const OAK_STAGES = [
  { min: 0, max: 2, key: 'oak.stage.soil', emoji: 'seed' },
  { min: 3, max: 4, key: 'oak.stage.seed', emoji: 'acorn' },
  { min: 5, max: 7, key: 'oak.stage.sprout', emoji: 'sprout' },
  { min: 8, max: 12, key: 'oak.stage.sapling', emoji: 'sapling' },
  { min: 13, max: 20, key: 'oak.stage.young', emoji: 'young' },
  { min: 21, max: 35, key: 'oak.stage.strong', emoji: 'strong' },
  { min: 36, max: 60, key: 'oak.stage.big', emoji: 'big' },
  { min: 61, max: 90, key: 'oak.stage.ancient', emoji: 'ancient' },
  { min: 91, max: Infinity, key: 'oak.stage.legend', emoji: 'legend' }
];

const REWARD_FAMILIES = [
  { id: 'badge', label: 'Toj Nishoni', cubeClass: 'reward-cube-badge', icon: 'badge', glyph: 'TOJ' },
  { id: 'aura', label: 'Aura Halqasi', cubeClass: 'reward-cube-aura', icon: 'aura', glyph: 'AURA' },
  { id: 'theme', label: 'Mavzu Kristali', cubeClass: 'reward-cube-theme', icon: 'theme', glyph: 'MAVZU' },
  { id: 'flare', label: "Quyosh Uchini", cubeClass: 'reward-cube-flare', icon: 'flare', glyph: 'ALANGA' },
  { id: 'nova', label: 'Nova Tomchisi', cubeClass: 'reward-cube-nova', icon: 'nova', glyph: 'NOVA' },
  { id: 'zen', label: 'Zen Muhri', cubeClass: 'reward-cube-zen', icon: 'zen', glyph: 'ZEN' },
  { id: 'focus', label: 'Fokus Yadrosi', cubeClass: 'reward-cube-focus', icon: 'focus', glyph: 'FOKUS' },
  { id: 'storm', label: 'Boron Uchquni', cubeClass: 'reward-cube-storm', icon: 'storm', glyph: "BO'RON" },
  { id: 'forest', label: 'Ormon Ruhi', cubeClass: 'reward-cube-forest', icon: 'forest', glyph: 'ORMON' },
  { id: 'lumen', label: 'Nur Qalqoni', cubeClass: 'reward-cube-lumen', icon: 'lumen', glyph: 'NUR' },
  { id: 'pulse', label: 'Pulse Belgisi', cubeClass: 'reward-cube-pulse', icon: 'pulse', glyph: 'PULSE' },
  { id: 'crown', label: 'Shoh Toji', cubeClass: 'reward-cube-crown', icon: 'crown', glyph: 'SHOH' }
];

const TIER_TITLES = [
  'Urug',
  'Nihol',
  "Ko'chat",
  'Yosh',
  'Kuchli',
  'Qadim',
  'Afsona',
  'Ustun',
  'Muqaddas',
  'Imperator'
];

const toRoman = (num = 1) => {
  const n = Math.max(1, Number(num) || 1);
  const map = [
    [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
    [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
    [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']
  ];
  let value = n;
  let out = '';
  map.forEach(([v, s]) => {
    while (value >= v) {
      out += s;
      value -= v;
    }
  });
  return out;
};

export const xpNeededForLevel = (level) => {
  const safeLevel = Math.max(0, Number(level) || 0);
  return Math.round(80 + (22 * safeLevel) + (5 * Math.pow(safeLevel, 1.35)));
};

export const getOakStage = (level) => {
  const safeLevel = Math.max(0, Number(level) || 0);
  return OAK_STAGES.find((s) => safeLevel >= s.min && safeLevel <= s.max) || OAK_STAGES[0];
};

export const getLevelRankKey = (level) => {
  const safeLevel = Math.max(0, Number(level) || 0);
  if (safeLevel < 10) return 'oak.rank.rookie';
  if (safeLevel < 25) return 'oak.rank.apprentice';
  if (safeLevel < 45) return 'oak.rank.focused';
  if (safeLevel < 70) return 'oak.rank.master';
  return 'oak.rank.legend';
};

export const getLevelRewards = (level) => {
  const safeLevel = Math.max(0, Number(level) || 0);
  if (safeLevel < 5 || safeLevel % 5 !== 0) return [];

  const index = Math.floor(safeLevel / 5) - 1;
  const family = REWARD_FAMILIES[index % REWARD_FAMILIES.length];
  const tier = Math.floor(index / REWARD_FAMILIES.length) + 1;
  const key = `cube:${family.id}:${tier}`;
  return [{ id: key, key }];
};

export const getNextRewardLevel = (level) => {
  const safeLevel = Math.max(0, Number(level) || 0);
  return safeLevel % 5 === 0 ? safeLevel + 5 : safeLevel + (5 - (safeLevel % 5));
};

export const getStreakMultiplier = (streak) => {
  const safeStreak = Math.max(0, Number(streak) || 0);
  const bonusSteps = Math.floor(safeStreak / 3);
  return Math.min(1 + (bonusSteps * 0.05), 1.5);
};

export const normalizeRewardKeys = (rawList = []) => {
  const uniq = Array.from(new Set(Array.isArray(rawList) ? rawList : []));
  return uniq.filter(Boolean);
};

export const latestRewardFromList = (rawList = []) => {
  const list = normalizeRewardKeys(rawList);
  return list.length ? list[list.length - 1] : '';
};

export const getRewardMeta = (key) => {
  if (!key) {
    return {
      key: 'cube:badge:1',
      label: 'Toj Nishoni - Urug I',
      cubeClass: 'reward-cube-badge',
      icon: 'badge',
      glyph: 'TOJ'
    };
  }

  if (key === 'oak.reward.badge') {
    return { key, label: 'Yangi badge', cubeClass: 'reward-cube-badge', icon: 'badge', glyph: 'TOJ' };
  }
  if (key === 'oak.reward.aura') {
    return { key, label: 'Yangi aura', cubeClass: 'reward-cube-aura', icon: 'aura', glyph: 'AURA' };
  }
  if (key === 'oak.reward.theme') {
    return { key, label: 'Yangi theme', cubeClass: 'reward-cube-theme', icon: 'theme', glyph: 'MAVZU' };
  }

  const match = /^cube:([a-z0-9_-]+):(\d+)$/i.exec(String(key));
  if (!match) {
    return { key, label: String(key), cubeClass: 'reward-cube-badge', icon: 'badge', glyph: 'TOJ' };
  }

  const familyId = match[1];
  const tier = Number(match[2]) || 1;
  const family = REWARD_FAMILIES.find((f) => f.id === familyId) || REWARD_FAMILIES[0];
  const tierTitle = TIER_TITLES[(tier - 1) % TIER_TITLES.length];
  const era = Math.floor((tier - 1) / TIER_TITLES.length) + 1;
  const eraRoman = toRoman(era);
  return {
    key,
    label: `${family.label} - ${tierTitle} ${eraRoman}`,
    cubeClass: family.cubeClass,
    icon: family.icon,
    glyph: family.glyph
  };
};

export const getRewardLabel = (key, t) => {
  if (key === 'oak.reward.badge' || key === 'oak.reward.aura' || key === 'oak.reward.theme') {
    return t ? t(key) : key;
  }
  return getRewardMeta(key).label;
};

export const getRewardIconKey = (key) => getRewardMeta(key).icon;
export const getRewardCubeClass = (key) => getRewardMeta(key).cubeClass;
export const getRewardGlyph = (key) => getRewardMeta(key).glyph || 'KUBIK';

export const migrateLegacyRewardKey = (key = '') => {
  if (key === 'oak.reward.badge') return 'cube:badge:1';
  if (key === 'oak.reward.aura') return 'cube:aura:1';
  if (key === 'oak.reward.theme') return 'cube:theme:1';
  return key;
};

export const migrateRewardList = (rawList = []) => normalizeRewardKeys(rawList).map((k) => migrateLegacyRewardKey(k));

export const ensureLatestReward = (latestKey = '', rewardList = []) => {
  if (latestKey) return migrateLegacyRewardKey(latestKey);
  return latestRewardFromList(migrateRewardList(rewardList));
};

export const getAllRewardPreviewKeys = (count = 24) => {
  const safe = Math.max(1, Number(count) || 24);
  const out = [];
  for (let i = 1; i <= safe; i += 1) {
    const level = i * 5;
    const rw = getLevelRewards(level);
    if (rw.length) out.push(rw[0].key);
  }
  return out;
};
