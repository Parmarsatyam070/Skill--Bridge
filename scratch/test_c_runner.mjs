import { executeCodeSandbox } from '../server/src/services/codeRunnerService.js';

async function testRunnerC() {
  const result = await executeCodeSandbox({
    code: `
#include <stdio.h>

int findKthLargest(vector<int>& nums, int k) {
    sort(nums.begin(), nums.end(), greater<int>());
    return nums[k - 1];
}
`,
    language: 'c',
    entryFunctionName: 'findKthLargest',
    testCases: [
      { id: 'tc-1', input: 'nums = [3,2,1,5,6,4], k = 2', expectedOutput: '5' },
      { id: 'tc-2', input: 'nums = [3,2,3,1,2,4,5,5,6], k = 4', expectedOutput: '4' }
    ]
  });

  console.log('C Execution Result:', JSON.stringify(result, null, 2));
}

testRunnerC().catch(console.error);
