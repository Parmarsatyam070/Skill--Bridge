import fs from 'node:fs/promises';

async function check() {
  try {
    const javaDir = 'C:\\Program Files\\Java';
    const files = await fs.readdir(javaDir);
    console.log('C:\\Program Files\\Java:', files);
  } catch (e) {
    console.log('C:\\Program Files\\Java error:', e.message);
  }

  try {
    const oracleDir = 'C:\\Program Files\\Common Files\\Oracle\\Java\\javapath';
    const files = await fs.readdir(oracleDir);
    console.log('oracleDir:', files);
    for (const f of files) {
      try {
        const target = await fs.readlink(`${oracleDir}\\${f}`);
        console.log(`link ${f} ->`, target);
      } catch (e) {
        console.log(`not a symlink or error: ${f}`, e.message);
      }
    }
  } catch (e) {
    console.log('oracleDir error:', e.message);
  }
}

check();
