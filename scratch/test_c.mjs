import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

const execFileAsync = promisify(execFile);

async function testC() {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'test-c-'));
  const srcPath = path.join(tmpDir, 'solution.c');
  const exePath = path.join(tmpDir, 'solution.exe');

  const cCode = `
#include <stdio.h>
#include <stdlib.h>
#include <stdbool.h>
#include <string.h>

// User solution
int findKthLargest(int* nums, int numsSize, int k) {
    // simple bubble/qsort for test
    for (int i = 0; i < numsSize; i++) {
        for (int j = i + 1; j < numsSize; j++) {
            if (nums[j] > nums[i]) {
                int tmp = nums[i];
                nums[i] = nums[j];
                nums[j] = tmp;
            }
        }
    }
    return nums[k - 1];
}

int main() {
    int arr1[] = {3, 2, 1, 5, 6, 4};
    int res1 = findKthLargest(arr1, 6, 2);
    printf("{\\"results\\":[{\\"id\\":\\"tc-1\\",\\"passed\\":%s,\\"actualOutput\\":\\"%d\\"}]}\\n", res1 == 5 ? "true" : "false", res1);
    return 0;
}
`;

  await fs.writeFile(srcPath, cCode, 'utf8');
  await execFileAsync('gcc', ['-std=c11', '-O2', srcPath, '-o', exePath], { cwd: tmpDir });
  const { stdout } = await execFileAsync(exePath, [], { cwd: tmpDir });
  console.log('C Output:', stdout);
  await fs.rm(tmpDir, { recursive: true, force: true });
}

testC().catch(console.error);
