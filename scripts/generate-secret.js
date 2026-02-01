#!/usr/bin/env node
const crypto = require('crypto');

const secret = crypto.randomBytes(32).toString('hex');

console.log('\n🔐 CRON_SECRET generado:\n');
console.log(secret);
console.log('\n📋 Copia este valor y agrégalo a tus variables de entorno en Vercel:\n');
console.log(`CRON_SECRET=${secret}`);
console.log('\n');