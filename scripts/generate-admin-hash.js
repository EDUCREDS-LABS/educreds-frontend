#!/usr/bin/env node

/**
 * Script to generate admin password hash for EduCreds
 * Usage: node scripts/generate-admin-hash.js [password] [salt]
 */

import crypto from 'crypto';

function generateHash(password, salt = 'educreds_admin_2024') {
  const hash = crypto.createHash('sha256').update(password + salt).digest('hex');
  return hash;
}

function main() {
  const args = process.argv.slice(2);
  const password = args[0] || 'password';
  const salt = args[1] || 'educreds_admin_2024';
  
  console.log('🔐 EduCreds Admin Password Hash Generator');
  console.log('==========================================');
  console.log(`Password: ${password}`);
  console.log(`Salt: ${salt}`);
  console.log(`Hash: ${generateHash(password, salt)}`);
  console.log('');
  console.log('📝 To update your admin authentication:');
  console.log('1. Copy the hash above');
  console.log('2. Update client/src/lib/admin-auth.ts');
  console.log('3. Replace ADMIN_PASSWORD_HASH with the new hash');
  console.log('4. Optionally update the SALT value as well');
  console.log('');
  console.log('⚠️  Remember to keep your password secure!');
}

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { generateHash };
