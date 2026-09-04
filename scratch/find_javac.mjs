import { execFile, execSync } from 'node:child_process';

try {
  const whereJavac = execSync('where javac').toString();
  console.log('where javac:', whereJavac);
} catch (e) {
  console.log('where javac error:', e.message);
}

try {
  const whereJava = execSync('where java').toString();
  console.log('where java:', whereJava);
} catch (e) {
  console.log('where java error:', e.message);
}

console.log('process.env.JAVA_HOME:', process.env.JAVA_HOME);
console.log('process.env.PATH:', process.env.PATH);
