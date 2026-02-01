// This file is disabled to prevent conflicts with api/products.ts
export const dynamic = 'force-dynamic';
export async function GET() { return new Response('Use /api/products', { status: 404 }); }
