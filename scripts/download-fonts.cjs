const fs = require('fs');
const path = require('path');
const https = require('https');

const targetDir = path.resolve(__dirname, '../public/fonts');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

function downloadBinary(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadBinary(res.headers.location, destPath).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to download ${url}: status ${res.statusCode}`));
      }
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(destPath, () => {});
      reject(err);
    });
  });
}

const fontsToDownload = [
  {
    name: 'inter-latin.woff2',
    url: 'https://fonts.gstatic.com/s/inter/v20/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa1ZL7.woff2',
    description: 'Inter variable font (Latin, 300..700)'
  },
  {
    name: 'ibm-plex-mono-400.woff2',
    url: 'https://fonts.gstatic.com/s/ibmplexmono/v20/-F63fjptAgt5VM-kVkqdyU8n1i8q1w.woff2',
    description: 'IBM Plex Mono 400 (Latin)'
  },
  {
    name: 'ibm-plex-mono-500.woff2',
    url: 'https://fonts.gstatic.com/s/ibmplexmono/v20/-F6qfjptAgt5VM-kVkqdyU8n3twJwlBFgg.woff2',
    description: 'IBM Plex Mono 500 (Latin)'
  },
  {
    name: 'ibm-plex-mono-600.woff2',
    url: 'https://fonts.gstatic.com/s/ibmplexmono/v20/-F6qfjptAgt5VM-kVkqdyU8n3vAOwlBFgg.woff2',
    description: 'IBM Plex Mono 600 (Latin)'
  },
  {
    name: 'fraunces-latin.woff2',
    url: 'https://fonts.gstatic.com/s/fraunces/v38/6NU78FyLNQOQZAnv9bYEvDiIdE9Ea92uemAk_WBq8U_9v0c2Wa0KxC9TeA.woff2',
    description: 'Fraunces variable font (Latin, 500..700)'
  }
];

async function main() {
  console.log(`Downloading ${fontsToDownload.length} fonts to ${targetDir}...`);
  for (const font of fontsToDownload) {
    const dest = path.join(targetDir, font.name);
    process.stdout.write(`Downloading ${font.name}... `);
    await downloadBinary(font.url, dest);
    const stat = fs.statSync(dest);
    console.log(`Done (${stat.size} bytes)`);
  }
  console.log('All fonts downloaded successfully.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
