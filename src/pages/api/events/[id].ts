import type { APIRoute } from 'astro';
import { store } from '~/lib/store';
import type { Event, LineupAssignment } from '~/lib/types';

export const prerender = false;

export const PATCH: APIRoute = async ({ params, request }) => {
  const body = (await request.json()) as Partial<Event>;
  const db = await store.read();
  const event = db.events.find((e) => e.id === params.id);
  if (!event) return new Response('Not found', { status: 404 });

  if (typeof body.title === 'string') event.title = body.title.trim();
  if (typeof body.startsAt === 'string') event.startsAt = body.startsAt;
  if (typeof body.endsAt === 'string') event.endsAt = body.endsAt || undefined;
  if (typeof body.location === 'string') event.location = body.location.trim() || undefined;
  if (typeof body.notes === 'string') event.notes = body.notes.trim() || undefined;
  if (typeof body.type === 'string') event.type = body.type;
  if (Array.isArray(body.lineup)) {
    event.lineup = body.lineup as LineupAssignment[];
  }
  event.updatedAt = new Date().toISOString();

  await store.write(db);
  return new Response(JSON.stringify(event), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const DELETE: APIRoute = async ({ params }) => {
  const db = await store.read();
  const idx = db.events.findIndex((e) => e.id === params.id);
  if (idx === -1) return new Response('Not found', { status: 404 });
  db.events.splice(idx, 1);
  await store.write(db);
  return new Response(null, { status: 204 });
};
