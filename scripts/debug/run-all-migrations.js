const { execSync } = require('child_process');

function runCommand(command) {
  console.log(`Running: ${command}`);
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`Successfully completed: ${command}\n`);
  } catch (err) {
    console.error(`Error running command: ${command}`);
    console.error(err);
  }
}

function runAll() {
  runCommand('npx ts-node scripts/migrate-orders.ts');
  runCommand('npx ts-node scripts/migrate-courses.ts');
  runCommand('npx ts-node scripts/migrate-progress.ts');
  console.log('All auxiliary migrations completed!');
}

runAll();
