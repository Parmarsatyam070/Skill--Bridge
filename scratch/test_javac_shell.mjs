import { exec, execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

const execAsync = promisify(exec);
const execFileAsync = promisify(execFile);

async function test() {
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

  // Test 1: exec
  try {
    const res1 = await execAsync(`javac -encoding UTF-8 Solution.java`, { cwd: tmpDir });
    console.log('Test 1 (exec) SUCCESS:', res1);
  } catch (e) {
    console.log('Test 1 (exec) ERROR:', e.message, 'stderr:', e.stderr);
  }

  // Test 2: execFile with shell: true
  try {
    const res2 = await execFileAsync('javac', ['-encoding', 'UTF-8', 'Solution.java'], { cwd: tmpDir, shell: true });
    console.log('Test 2 (execFile shell:true) SUCCESS:', res2);
  } catch (e) {
    console.log('Test 2 (execFile shell:true) ERROR:', e.message, 'stderr:', e.stderr);
  }

  // Test 3: bad file with execFile shell: true
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
    await execFileAsync('javac', ['-encoding', 'UTF-8', 'Bad.java'], { cwd: tmpDir, shell: true });
  } catch (e) {
    console.log('Test 3 (bad file) stderr:\n', e.stderr);
  }
}

test();
