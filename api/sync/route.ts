// This file is disabled to prevent conflicts with api/sync.ts
export const dynamic = 'force-dynamic';
export async function GET() { return new Response('Use /api/sync', { status: 404 }); }
