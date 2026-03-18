import argon2 from 'argon2';

async function main(): Promise<void> {
  const password = process.argv[2];
  if (!password) {
    console.error('Usage: npm run admin:hash-password -- <password>');
    process.exit(1);
  }
  const hash = await argon2.hash(password);
  console.log(hash);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
