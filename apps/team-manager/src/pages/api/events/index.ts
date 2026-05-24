import type { APIRoute } from 'astro';
import { newId, store } from '~/lib/store';
import type { Event, EventType, LineupAssignment } from '~/lib/types';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const body = (await request.json()) as Partial<Event> & { teamId: string };
  if (!body.teamId || !body.title?.trim() || !body.startsAt) {
    return new Response(
      JSON.stringify({ error: 'teamId, title, and startsAt are required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const db = await store.read();
  const team = db.teams.find((t) => t.id === body.teamId);
  if (!team) return new Response(JSON.stringify({ error: 'team not found' }), { status: 404 });

  const lineup: LineupAssignment[] = [];
  for (const pos of team.positions) {
    for (let slot = 0; slot < pos.slots; slot++) {
      lineup.push({ positionId: pos.id, slot, playerId: null });
    }
  }

  const now = new Date().toISOString();
  const event: Event = {
    id: newId('evt'),
    teamId: body.teamId,
    type: (body.type as EventType) ?? 'practice',
    title: body.title.trim(),
    startsAt: body.startsAt,
    endsAt: body.endsAt,
    location: body.location?.trim() || undefined,
    notes: body.notes?.trim() || undefined,
    lineup,
    createdAt: now,
    updatedAt: now,
  };

  db.events.push(event);
  await store.write(db);
  return new Response(JSON.stringify(event), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};
