// This file is disabled to prevent conflicts with api/categories.ts
export const dynamic = 'force-dynamic';
export async function GET() { return new Response('Use /api/categories', { status: 404 }); }
