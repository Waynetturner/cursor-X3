const fs = require('fs');

// Load environment variables
function loadEnvFile() {
  try {
    const envContent = fs.readFileSync('.env.local', 'utf8');
    const lines = envContent.split('\n');
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          process.env[key.trim()] = valueParts.join('=').trim();
        }
      }
    });
  } catch (error) {
    console.log('Could not load .env.local file:', error.message);
  }
}

loadEnvFile();

console.log('🔍 JWT Token Analysis\n');

const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

console.log('URL:', url);
console.log('URL Project ID:', url ? url.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] : 'Not found');
console.log('');

function decodeJWT(token, name) {
  console.log(`${name}:`);
  console.log(`  Full token: ${token.substring(0, 50)}...`);
  
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.log('  ❌ Invalid JWT format');
      return;
    }
    
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    console.log('  Decoded payload:');
    console.log('    iss (issuer):', payload.iss);
    console.log('    ref (project):', payload.ref);
    console.log('    role:', payload.role);
    console.log('    iat (issued at):', new Date(payload.iat * 1000).toISOString());
    console.log('    exp (expires):', new Date(payload.exp * 1000).toISOString());
    
    return payload.ref;
  } catch (error) {
    console.log('  ❌ Error decoding:', error.message);
  }
  console.log('');
}

if (anonKey) {
  const anonProject = decodeJWT(anonKey, 'Anon Key');
  console.log('');
}

if (serviceKey) {
  const serviceProject = decodeJWT(serviceKey, 'Service Role Key');
  console.log('');
}