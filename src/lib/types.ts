export interface Position {
  id: string;
  label: string;
  slots: number;
  required: boolean;
  notes?: string;
}

export interface Team {
  id: string;
  name: string;
  activity: string;
  positions: Position[];
  createdAt: string;
  updatedAt: string;
}

export interface Player {
  id: string;
  teamId: string;
  name: string;
  email?: string;
  phone?: string;
  defaultPositionIds: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type EventType = 'practice' | 'match' | 'race' | 'session' | 'other';

export interface LineupAssignment {
  positionId: string;
  slot: number;
  playerId: string | null;
}

export interface Event {
  id: string;
  teamId: string;
  type: EventType;
  title: string;
  startsAt: string;
  endsAt?: string;
  location?: string;
  notes?: string;
  lineup: LineupAssignment[];
  createdAt: string;
  updatedAt: string;
}

export interface Database {
  teams: Team[];
  players: Player[];
  events: Event[];
}
