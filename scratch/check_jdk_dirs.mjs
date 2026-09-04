import fs from 'node:fs/promises';
import path from 'node:path';

const candidateDirs = [
  'C:\\Program Files\\Java',
  'C:\\Program Files (x86)\\Java',
  'C:\\Program Files\\Eclipse Adoptium',
  'C:\\Program Files\\Amazon Corretto',
  'C:\\Program Files\\Zulu',
  'C:\\Program Files\\Microsoft',
  'C:\\Users\\singh\\.jdk',
  'C:\\Users\\singh\\.jdks',
  'C:\\Users\\singh\\AppData\\Local\\Programs',
  'C:\\tools',
  'C:\\jdk',
  'C:\\ProgramData',
];

async function check() {
  for (const dir of candidateDirs) {
    try {
      const entries = await fs.readdir(dir);
      console.log(`FOUND ${dir}:`, entries);
    } catch (e) {}
  }
}

check();
