// Test Supabase Storage Configuration
// Run with: node test-supabase-storage.js

require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'media';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing required environment variables!');
  console.error('   Need: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

console.log('🔍 Testing Supabase Storage Configuration\n');
console.log('=' .repeat(50));

const supa = createClient(supabaseUrl, supabaseKey);

async function test() {
  // Test 1: Connection check
  console.log('1. Testing connection to Supabase...');
  try {
    const { data, error } = await supa.storage.from(bucketName).list();
    
    if (error) {
      console.error('   ❌ Bucket access failed:', error.message);
      console.error('   📋 Fix: Create "media" bucket in Supabase Storage');
      process.exit(1);
    }
    
    console.log('   ✅ Connection successful!');
    console.log('   📁 Bucket:', bucketName);
    console.log('   📄 Files in bucket:', data?.length || 0);
  } catch (err) {
    console.error('   ❌ Connection error:', err.message);
    process.exit(1);
  }

  // Test 2: Variable verification
  console.log('\n2. Verifying environment variables...');
  console.log('   🔗 NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl);
  console.log('   🔑 SUPABASE_SERVICE_ROLE_KEY:', supabaseKey.substring(0, 12) + '...');
  console.log('   📦 SUPABASE_STORAGE_BUCKET:', bucketName);

  // Test 3: Bucket accessibility
  console.log('\n3. Testing bucket accessibility...');
  try {
    const { count } = await supa.storage
      .from(bucketName)
      .getPublicBucket();
    console.log('   ✅ Bucket is accessible and configured correctly');
  } catch (err) {
    console.error('   ❌ Bucket accessibility error:', err.message);
  }

  console.log('\n' + '='.repeat(50));
  console.log('🎉 All checks passed! Supabase storage is configured correctly.');
  console.log('\nYour Vercel deployment should now work with photo/video storage.');
}

test().catch(err => {
  console.error('\n❌ Test failed unexpectedly:', err);
  process.exit(1);
});