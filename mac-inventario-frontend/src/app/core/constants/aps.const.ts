// Lista oficial de APs (igual que en backend) para menús/combos.
export const APS = [
  'Bonanza 1',
  'Bonanza 2',
  'Bonanza 3',
  'Bodega',
  'Extend',
  'Casa'
] as const;

export type ApName = typeof APS[number];
