// Standalone Supabase Connection Test
// Run with: node test-supabase-connection.js

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Manual .env.local parsing
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
    console.log('⚠️  Could not load .env.local file:', error.message);
  }
}

loadEnvFile();

console.log('🔍 Testing Supabase Connection...\n');

// Test 1: Environment Variables
console.log('1. Environment Variables Check:');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log(`   URL: ${supabaseUrl ? '✅ Found' : '❌ Missing'}`);
console.log(`   Anon Key: ${supabaseAnonKey ? '✅ Found' : '❌ Missing'}`);
console.log(`   Service Role Key: ${serviceRoleKey ? '✅ Found' : '❌ Missing'}`);

if (supabaseUrl) {
  console.log(`   URL Value: ${supabaseUrl}`);
}
if (supabaseAnonKey) {
  console.log(`   Anon Key Preview: ${supabaseAnonKey.substring(0, 20)}...`);
}
if (serviceRoleKey) {
  console.log(`   Service Key Preview: ${serviceRoleKey.substring(0, 20)}...`);
  
  // Check if service key matches URL
  try {
    const serviceKeyPayload = JSON.parse(Buffer.from(serviceRoleKey.split('.')[1], 'base64').toString());
    console.log(`   Service Key Project: ${serviceKeyPayload.ref || 'Unknown'}`);
    
    if (supabaseUrl) {
      const urlProject = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
      console.log(`   URL Project: ${urlProject || 'Unknown'}`);
      
      if (serviceKeyPayload.ref && urlProject && serviceKeyPayload.ref !== urlProject) {
        console.log('   ⚠️  WARNING: Service key project does not match URL project!');
      } else {
        console.log('   ✅ Service key and URL project match');
      }
    }
  } catch (error) {
    console.log('   ❌ Could not decode service key');
  }
}

console.log('\n');

// Test 2: Client Creation
console.log('2. Client Creation Test:');
if (!supabaseUrl || !supabaseAnonKey) {
  console.log('   ❌ Cannot create client - missing environment variables');
  process.exit(1);
}

let supabase;
try {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
  console.log('   ✅ Supabase client created successfully');
} catch (error) {
  console.log('   ❌ Failed to create client:', error.message);
  process.exit(1);
}

console.log('\n');

// Test 3: Basic Connection
console.log('3. Basic Connection Test:');
async function testConnection() {
  try {
    // Try to access a common table
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (error) {
      console.log('   ❌ Connection failed:', error.message);
      console.log('   Error details:', {
        code: error.code,
        details: error.details,
        hint: error.hint
      });
    } else {
      console.log('   ✅ Successfully connected to Supabase');
      console.log('   Response:', data);
    }
  } catch (error) {
    console.log('   ❌ Network error:', error.message);
  }
  
  console.log('\n');
  
  // Test 4: Authentication Check
  console.log('4. Authentication Test:');
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.log('   ❌ Auth error:', error.message);
    } else {
      console.log('   ✅ Auth system accessible');
      console.log('   Current session:', session ? 'Active' : 'None (normal for testing)');
    }
  } catch (error) {
    console.log('   ❌ Auth check failed:', error.message);
  }
  
  console.log('\n');
  
  // Test 5: Database Schema Check
  console.log('5. Database Schema Test:');
  const tables = ['profiles', 'workout_exercises', 'user_demographics'];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`   ❌ Table '${table}': ${error.message}`);
      } else {
        console.log(`   ✅ Table '${table}': Accessible (${data.length} rows returned)`);
      }
    } catch (error) {
      console.log(`   ❌ Table '${table}': Network error - ${error.message}`);
    }
  }
  
  console.log('\n🏁 Test Complete');
}

testConnection();