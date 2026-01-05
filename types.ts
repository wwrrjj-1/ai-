
export interface FlowerInfo {
  name: string;
  scientificName: string;
  confidence: number;
  description: string;
  poetry: string;
  botany: string;
  care: string;
  culture: string;
}

export type TabKey = 'poetry' | 'botany' | 'care' | 'culture';

export interface TabConfig {
  key: TabKey;
  label: string;
}
