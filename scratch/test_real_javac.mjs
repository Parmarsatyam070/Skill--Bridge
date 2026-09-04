import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

const execFileAsync = promisify(execFile);

async function testPath(javacPath) {
  console.log('--- Testing javac path:', javacPath, '---');
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'test-java-'));
  const solPath = path.join(tmpDir, 'Solution.java');
  await fs.writeFile(solPath, `
import java.util.*;
public class Solution {
    public int findKthLargest(int[] nums, int k) {
        PriorityQueue<Integer> pq = new PriorityQueue<>();
        for (int num : nums) {
            pq.offer(num);
            if (pq.size() > k) {
                pq.poll();
            }
        }
        return pq.peek();
    }
}
`, 'utf8');

  try {
    const res = await execFileAsync(javacPath, ['-encoding', 'UTF-8', 'Solution.java'], { cwd: tmpDir });
    console.log('SUCCESS:', res);
  } catch (err) {
    console.log('ERROR message:', err.message);
    console.log('ERROR stderr:', JSON.stringify(err.stderr));
    console.log('ERROR stdout:', JSON.stringify(err.stdout));
  }

  // Bad syntax
  const badSolPath = path.join(tmpDir, 'Bad.java');
  await fs.writeFile(badSolPath, `
public class Bad {
    public int test() {
        PriorityQueue<Integer> pq = new PriorityQueue<>();
        return pq.peek();
    }
}
`, 'utf8');

  try {
    await execFileAsync(javacPath, ['-encoding', 'UTF-8', 'Bad.java'], { cwd: tmpDir });
  } catch (err) {
    console.log('Bad.java stderr:\n', err.stderr);
  }
}

async function run() {
  await testPath('C:\\Program Files\\Common Files\\Oracle\\Java\\javapath_target_37881546\\javac.exe');
  await testPath('C:\\Program Files\\JetBrains\\IntelliJ IDEA 2025.2.5\\jbr\\bin\\javac.exe');
}

run();
