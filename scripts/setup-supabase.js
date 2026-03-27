#!/usr/bin/env node

/**
 * FillIQ Supabase Setup Helper
 * 
 * Run: node scripts/setup-supabase.js
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  console.log('\n🚀 FillIQ Supabase Setup\n');
  console.log('This script will help you configure Supabase for FillIQ.\n');
  
  // Get Supabase credentials
  const projectRef = await question('Enter your Supabase Project Reference (e.g., abcdefghijklmnopqrst): ');
  const password = await question('Enter your database password: ');
  const region = await question('Enter your region (e.g., us-east-1, eu-west-2): ') || 'us-east-1';
  const anonKey = await question('Enter your Supabase Anon Key: ');
  const serviceRoleKey = await question('Enter your Supabase Service Role Key: ');
  
  // Generate connection strings
  const pooledUrl = `postgresql://postgres.${projectRef}:${password}@aws-0-${region}.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1`;
  const directUrl = `postgresql://postgres:${password}@db.${projectRef}.supabase.co:5432/postgres`;
  const supabaseUrl = `https://${projectRef}.supabase.co`;
  
  // Create .env file
  const envContent = `# Supabase PostgreSQL with Connection Pooling
DATABASE_URL="${pooledUrl}"
DIRECT_URL="${directUrl}"

# Supabase Auth
SUPABASE_URL="${supabaseUrl}"
SUPABASE_ANON_KEY="${anonKey}"
SUPABASE_SERVICE_ROLE_KEY="${serviceRoleKey}"

# Server
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# WhatsApp
WABA_PROVIDER=360dialog
WABA_PHONE_NUMBER_ID=
WABA_ACCESS_TOKEN=
WABA_VERIFY_TOKEN=filliq-verify-token

# Redis
REDIS_URL=redis://localhost:6379
`;

  // Write to backend/.env
  const backendEnvPath = path.join(__dirname, '..', 'backend', '.env');
  fs.writeFileSync(backendEnvPath, envContent);
  
  // Write to frontend .env
  const frontendEnvContent = `VITE_SUPABASE_URL="${supabaseUrl}"
VITE_SUPABASE_ANON_KEY="${anonKey}"
VITE_API_URL=http://localhost:3001/api
`;
  const frontendEnvPath = path.join(__dirname, '..', 'frontend', '.env');
  fs.writeFileSync(frontendEnvPath, frontendEnvContent);
  
  console.log('\n✅ Configuration saved!\n');
  console.log('Next steps:');
  console.log('1. Run: cd backend && npx prisma migrate deploy');
  console.log('2. Run: cd backend && npm run dev');
  console.log('3. Run: cd frontend && npm run dev');
  console.log('\n📚 View SUPABASE_SETUP.md for more details.\n');
  
  rl.close();
}

main().catch(console.error);
