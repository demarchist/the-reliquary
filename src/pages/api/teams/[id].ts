import type { APIRoute } from 'astro';
import { newId, store } from '~/lib/store';
import type { Position } from '~/lib/types';

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  const db = await store.read();
  const team = db.teams.find((t) => t.id === params.id);
  if (!team) return new Response('Not found', { status: 404 });
  return new Response(JSON.stringify(team), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const PATCH: APIRoute = async ({ params, request }) => {
  const body = (await request.json()) as {
    name?: string;
    activity?: string;
    positions?: (Partial<Position> & { label: string; slots: number })[];
  };

  const db = await store.read();
  const team = db.teams.find((t) => t.id === params.id);
  if (!team) return new Response('Not found', { status: 404 });

  if (typeof body.name === 'string') team.name = body.name.trim();
  if (typeof body.activity === 'string') team.activity = body.activity.trim();
  if (body.positions) {
    team.positions = body.positions.map((p) => ({
      id: p.id ?? newId('pos'),
      label: p.label,
      slots: Math.max(1, p.slots),
      required: Boolean(p.required),
      notes: p.notes,
    }));
  }
  team.updatedAt = new Date().toISOString();

  await store.write(db);
  return new Response(JSON.stringify(team), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const DELETE: APIRoute = async ({ params }) => {
  const db = await store.read();
  const idx = db.teams.findIndex((t) => t.id === params.id);
  if (idx === -1) return new Response('Not found', { status: 404 });
  db.teams.splice(idx, 1);
  db.players = db.players.filter((p) => p.teamId !== params.id);
  db.events = db.events.filter((e) => e.teamId !== params.id);
  await store.write(db);
  return new Response(null, { status: 204 });
};
