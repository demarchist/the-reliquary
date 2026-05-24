import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Database, Event, Player, Team } from './types';

const DATA_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../data',
);
const DB_FILE = path.join(DATA_DIR, 'db.json');

export interface TeamStore {
  read(): Promise<Database>;
  write(db: Database): Promise<void>;
}

const EMPTY_DB: Database = { teams: [], players: [], events: [] };

class JsonFileStore implements TeamStore {
  async read(): Promise<Database> {
    try {
      const raw = await fs.readFile(DB_FILE, 'utf8');
      const parsed = JSON.parse(raw) as Partial<Database>;
      return {
        teams: parsed.teams ?? [],
        players: parsed.players ?? [],
        events: parsed.events ?? [],
      };
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        await fs.mkdir(DATA_DIR, { recursive: true });
        await fs.writeFile(DB_FILE, JSON.stringify(EMPTY_DB, null, 2));
        return { ...EMPTY_DB };
      }
      throw err;
    }
  }

  async write(db: Database): Promise<void> {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const tmp = `${DB_FILE}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(db, null, 2));
    await fs.rename(tmp, DB_FILE);
  }
}

export const store: TeamStore = new JsonFileStore();

export function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export async function listTeams(): Promise<Team[]> {
  return (await store.read()).teams;
}

export async function getTeam(id: string): Promise<Team | undefined> {
  return (await store.read()).teams.find((t) => t.id === id);
}

export async function listPlayers(teamId: string): Promise<Player[]> {
  const db = await store.read();
  return db.players.filter((p) => p.teamId === teamId);
}

export async function listEvents(teamId: string): Promise<Event[]> {
  const db = await store.read();
  return db.events
    .filter((e) => e.teamId === teamId)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}
