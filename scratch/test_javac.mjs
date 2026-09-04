import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

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

  // Test with C:\\Program Files\\Java\\jdk-24\\bin\\javac.exe
  const jdkJavac = 'C:\\Program Files\\Java\\jdk-24\\bin\\javac.exe';
  try {
    const res = await execFileAsync(jdkJavac, ['-encoding', 'UTF-8', 'Solution.java'], { cwd: tmpDir });
    console.log('jdkJavac SUCCESS:', res);
  } catch (err) {
    console.log('jdkJavac ERROR:', err);
  }

  // Also test error reporting with invalid code
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
    await execFileAsync(jdkJavac, ['-encoding', 'UTF-8', 'Bad.java'], { cwd: tmpDir });
  } catch (err) {
    console.log('Bad.java stderr:\n', err.stderr);
  }
}

test();
