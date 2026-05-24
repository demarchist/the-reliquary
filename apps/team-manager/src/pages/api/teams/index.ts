import type { APIRoute } from 'astro';
import { newId, store } from '~/lib/store';
import type { Position, Team } from '~/lib/types';

export const prerender = false;

export const GET: APIRoute = async () => {
  const db = await store.read();
  return new Response(JSON.stringify(db.teams), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request }) => {
  const body = (await request.json()) as {
    name?: string;
    activity?: string;
    positions?: Omit<Position, 'id'>[];
  };

  if (!body.name?.trim()) {
    return new Response(JSON.stringify({ error: 'name is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const db = await store.read();
  const now = new Date().toISOString();
  const positions: Position[] = (body.positions ?? []).map((p) => ({
    id: newId('pos'),
    label: p.label,
    slots: Math.max(1, p.slots ?? 1),
    required: Boolean(p.required),
    notes: p.notes,
  }));

  const team: Team = {
    id: newId('team'),
    name: body.name.trim(),
    activity: (body.activity ?? '').trim(),
    positions,
    createdAt: now,
    updatedAt: now,
  };

  db.teams.push(team);
  await store.write(db);
  return new Response(JSON.stringify(team), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};
