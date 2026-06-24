export interface Color {
  name: string;
  hex: string;
  hsl?: string;
}

export interface Palette {
  id: string;
  name: string;
  author?: string;
  version?: string;
  category?: string;
  count: number;
  description?: string;
  path?: string;
  colors: Color[];
  tags?: { mood: string[]; aesthetic: string[] };
  created?: string;
  updated?: string;
  intent?: string;
}
