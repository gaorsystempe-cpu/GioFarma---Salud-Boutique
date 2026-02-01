// This file is disabled to prevent conflicts with api/orders.ts
export const dynamic = 'force-dynamic';
export async function GET() { return new Response('Use /api/orders', { status: 404 }); }
