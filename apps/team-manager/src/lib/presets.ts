import type { Position } from './types';

export interface PositionPreset {
  id: string;
  label: string;
  activity: string;
  description: string;
  positions: Omit<Position, 'id'>[];
}

export const PRESETS: PositionPreset[] = [
  {
    id: 'sailboat-racing',
    label: 'Sailboat racing',
    activity: 'Sailboat racing',
    description: 'Typical crew for a mid-size keelboat or one-design',
    positions: [
      { label: 'Driver', slots: 1, required: true },
      { label: 'Tactician', slots: 1, required: false },
      { label: 'Main trimmer', slots: 1, required: true },
      { label: 'Jib trimmer', slots: 2, required: true },
      { label: 'Pit', slots: 1, required: false },
      { label: 'Mast', slots: 1, required: false },
      { label: 'Grinder', slots: 2, required: false },
      { label: 'Foredeck', slots: 1, required: true },
      { label: 'Bowman', slots: 1, required: false },
      { label: 'Floater', slots: 2, required: false },
    ],
  },
  {
    id: 'dnd-party',
    label: 'D&D party',
    activity: 'Dungeons & Dragons',
    description: 'Classic tabletop party composition',
    positions: [
      { label: 'Dungeon Master', slots: 1, required: true },
      { label: 'Tank', slots: 1, required: false },
      { label: 'Healer', slots: 1, required: false },
      { label: 'Damage', slots: 3, required: false },
      { label: 'Support', slots: 1, required: false },
    ],
  },
  {
    id: 'soccer-11',
    label: 'Soccer (11-a-side)',
    activity: 'Soccer',
    description: 'Standard 11-player squad with subs',
    positions: [
      { label: 'Goalkeeper', slots: 1, required: true },
      { label: 'Defender', slots: 4, required: true },
      { label: 'Midfielder', slots: 4, required: true },
      { label: 'Forward', slots: 2, required: true },
      { label: 'Substitute', slots: 5, required: false },
    ],
  },
  {
    id: 'blank',
    label: 'Start from scratch',
    activity: '',
    description: 'Define your own positions',
    positions: [],
  },
];

export function getPreset(id: string): PositionPreset | undefined {
  return PRESETS.find((p) => p.id === id);
}
