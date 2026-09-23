import { timingSafeEqual } from 'node:crypto';
import { revalidateTag } from 'next/cache';
import type { NextRequest } from 'next/server';

const allowed = /^(?:public-(?:home|settings|categories|brands|products|banners)|public-product-[a-z0-9]+(?:-[a-z0-9]+)*)$/;

function authenticated(request: NextRequest) {
  const secret = process.env.REVALIDATION_SECRET;
  const authorization = request.headers.get('authorization');
  if (!secret || !authorization?.startsWith('Bearer ')) return false;
  const supplied = authorization.slice(7);
  const expectedBuffer = Buffer.from(secret);
  const suppliedBuffer = Buffer.from(supplied);
  return expectedBuffer.length === suppliedBuffer.length && timingSafeEqual(expectedBuffer, suppliedBuffer);
}

export async function POST(request: NextRequest) {
  if (!authenticated(request)) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  let input: unknown;
  try { input = await request.json(); } catch { return Response.json({ error: 'Invalid body' }, { status: 400 }); }
  const tags = typeof input === 'object' && input !== null && 'tags' in input && Array.isArray(input.tags)
    ? [...new Set(input.tags.filter((tag): tag is string => typeof tag === 'string' && allowed.test(tag)))].slice(0, 30)
    : [];
  if (!tags.length) return Response.json({ error: 'No valid tags' }, { status: 400 });
  for (const tag of tags) revalidateTag(tag, 'max');
  return Response.json({ revalidated: true, count: tags.length }, { headers: { 'Cache-Control': 'no-store' } });
}
