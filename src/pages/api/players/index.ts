import type { APIRoute } from 'astro';
import { newId, store } from '~/lib/store';
import type { Player } from '~/lib/types';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const body = (await request.json()) as Partial<Player> & { teamId: string };
  if (!body.teamId || !body.name?.trim()) {
    return new Response(JSON.stringify({ error: 'teamId and name are required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const db = await store.read();
  if (!db.teams.some((t) => t.id === body.teamId)) {
    return new Response(JSON.stringify({ error: 'team not found' }), { status: 404 });
  }

  const now = new Date().toISOString();
  const player: Player = {
    id: newId('player'),
    teamId: body.teamId,
    name: body.name.trim(),
    email: body.email?.trim() || undefined,
    phone: body.phone?.trim() || undefined,
    defaultPositionIds: body.defaultPositionIds ?? [],
    notes: body.notes?.trim() || undefined,
    createdAt: now,
    updatedAt: now,
  };

  db.players.push(player);
  await store.write(db);
  return new Response(JSON.stringify(player), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};
