import { execFileSync } from 'node:child_process';

execFileSync(process.execPath, ['scripts/test-static-stripe-booking.mjs'], {
  cwd: process.cwd(),
  stdio: 'inherit'
});
