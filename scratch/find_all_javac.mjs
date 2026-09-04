import { execSync } from 'node:child_process';

try {
  const res = execSync('dir /s /b C:\\javac.exe', { timeout: 10000 }).toString();
  console.log('dir javac.exe:\n', res);
} catch (e) {
  console.log('dir javac.exe error:', e.stdout?.toString() || e.message);
}
