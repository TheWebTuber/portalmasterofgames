// Standard single-class slot progression (SRD 5.1). Pact Magic uses its own pool.
const full = [
  [2],
  [3],
  [4, 2],
  [4, 3],
  [4, 3, 2],
  [4, 3, 3],
  [4, 3, 3, 1],
  [4, 3, 3, 2],
  [4, 3, 3, 3, 1],
  [4, 3, 3, 3, 2],
  [4, 3, 3, 3, 2, 1],
  [4, 3, 3, 3, 2, 1],
  [4, 3, 3, 3, 2, 1, 1],
  [4, 3, 3, 3, 2, 1, 1],
  [4, 3, 3, 3, 2, 1, 1, 1],
  [4, 3, 3, 3, 2, 1, 1, 1],
  [4, 3, 3, 3, 2, 1, 1, 1, 1],
  [4, 3, 3, 3, 3, 1, 1, 1, 1],
  [4, 3, 3, 3, 3, 2, 1, 1, 1],
  [4, 3, 3, 3, 3, 2, 2, 1, 1],
];
export function slotCapacity(className: string, level: number): number[] {
  if (["Bard", "Cleric", "Druid", "Sorcerer", "Wizard"].includes(className))
    return full[level - 1] || [];
  if (["Paladin", "Ranger"].includes(className) && level >= 2)
    return full[Math.ceil(level / 2) - 1] || [];
  if (className === "Warlock") {
    const tier = Math.min(5, Math.ceil(level / 2)),
      capacity = level === 1 ? 1 : level < 11 ? 2 : level < 17 ? 3 : 4;
    const slots = Array(tier).fill(0);
    slots[tier - 1] = capacity;
    return slots;
  }
  return [];
}
