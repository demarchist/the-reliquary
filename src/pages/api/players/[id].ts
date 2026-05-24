import type { APIRoute } from 'astro';
import { store } from '~/lib/store';
import type { Player } from '~/lib/types';

export const prerender = false;

export const PATCH: APIRoute = async ({ params, request }) => {
  const body = (await request.json()) as Partial<Player>;
  const db = await store.read();
  const player = db.players.find((p) => p.id === params.id);
  if (!player) return new Response('Not found', { status: 404 });

  if (typeof body.name === 'string') player.name = body.name.trim();
  if (typeof body.email === 'string') player.email = body.email.trim() || undefined;
  if (typeof body.phone === 'string') player.phone = body.phone.trim() || undefined;
  if (typeof body.notes === 'string') player.notes = body.notes.trim() || undefined;
  if (Array.isArray(body.defaultPositionIds)) {
    player.defaultPositionIds = body.defaultPositionIds;
  }
  player.updatedAt = new Date().toISOString();

  await store.write(db);
  return new Response(JSON.stringify(player), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const DELETE: APIRoute = async ({ params }) => {
  const db = await store.read();
  const idx = db.players.findIndex((p) => p.id === params.id);
  if (idx === -1) return new Response('Not found', { status: 404 });
  const removed = db.players[idx];
  db.players.splice(idx, 1);
  for (const event of db.events) {
    for (const slot of event.lineup) {
      if (slot.playerId === removed.id) slot.playerId = null;
    }
  }
  await store.write(db);
  return new Response(null, { status: 204 });
};
