export interface StatBarProps {
  label: string;
  value: number;
  max: number;
  color: 'hp' | 'mana' | 'xp' | 'hunger';
}
