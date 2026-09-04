export interface RawDSAQuestion {
  title: string;
  slug: string;
  platform: 'LEETCODE' | 'GEEKSFORGEEKS' | 'CSES' | 'CODEFORCES';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  topic: string;
  tags: string[];
  canonicalUrl: string;
  estimatedMinutes: number;
  description: string;
  entryFunctionName: string;
  companyTags: string[];
  starterCode: {
    javascript: string;
    python: string;
    java: string;
    cpp: string;
    c?: string;
  };
  testCases: {
    id: string;
    input: string;
    expectedOutput: string;
    isHidden?: boolean;
    explanation?: string;
  }[];
}

export const AUTHENTIC_DSA_QUESTIONS: RawDSAQuestion[] = [
  {
    "title": "Two Sum",
    "slug": "two-sum",
    "platform": "LEETCODE",
    "difficulty": "Easy",
    "topic": "Arrays",
    "tags": [
      "array",
      "hash-table",
      "two-pointers"
    ],
    "canonicalUrl": "https://leetcode.com/problems/two-sum/",
    "estimatedMinutes": 15,
    "description": "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume each input has exactly one solution, and you may not use the same element twice.",
    "entryFunctionName": "twoSum",
    "companyTags": [
      "Google",
      "Amazon",
      "Apple",
      "Meta",
      "Microsoft"
    ],
    "starterCode": {
      "javascript": "/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number[]}\n */\nfunction twoSum(nums, target) {\n  // Write your solution here\n  \n}",
      "python": "class Solution:\n    def twoSum(self, nums: list[int], target: int) -> list[int]:\n        # Write your solution here\n        pass",
      "java": "import java.util.*;\n\nclass Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Write your solution here\n        return new int[]{};\n    }\n}",
      "cpp": "#include <vector>\n#include <unordered_map>\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        // Write your solution here\n        return {};\n    }\n};",
      "c": "#include <stdio.h>\n#include <stdlib.h>\n\nint* twoSum(int* nums, int numsSize, int target, int* returnSize) {\n    // Write your solution here\n    *returnSize = 0;\n    return NULL;\n}"
    },
    "testCases": [
      {
        "id": "tc-1",
        "input": "nums = [2,7,11,15], target = 9",
        "expectedOutput": "[0, 1]"
      },
      {
        "id": "tc-2",
        "input": "nums = [3,2,4], target = 6",
        "expectedOutput": "[1, 2]"
      },
      {
        "id": "tc-3",
        "input": "nums = [3,3], target = 6",
        "expectedOutput": "[0, 1]"
      },
      {
        "id": "tc-4",
        "input": "nums = [1,5,3,7,9], target = 12",
        "expectedOutput": "[1, 3]",
        "isHidden": true
      }
    ]
  },
  {
    "title": "Contains Duplicate",
    "slug": "contains-duplicate",
    "platform": "LEETCODE",
    "difficulty": "Easy",
    "topic": "Arrays",
    "tags": [
      "array",
      "hash-table",
      "sorting"
    ],
    "canonicalUrl": "https://leetcode.com/problems/contains-duplicate/",
    "estimatedMinutes": 10,
    "description": "Given an integer array nums, return true if any value appears at least twice in the array, and return false if every element is distinct.",
    "entryFunctionName": "containsDuplicate",
    "companyTags": [
      "Amazon",
      "Apple",
      "Adobe",
      "Microsoft"
    ],
    "starterCode": {
      "javascript": "/**\n * @param {number[]} nums\n * @return {boolean}\n */\nfunction containsDuplicate(nums) {\n  // Write your solution here\n  \n}",
      "python": "class Solution:\n    def containsDuplicate(self, nums: list[int]) -> bool:\n        # Write your solution here\n        pass",
      "java": "import java.util.*;\n\nclass Solution {\n    public boolean containsDuplicate(int[] nums) {\n        // Write your solution here\n        return false;\n    }\n}",
      "cpp": "#include <vector>\n#include <unordered_set>\nusing namespace std;\n\nclass Solution {\npublic:\n    boolean containsDuplicate(vector<int>& nums) {\n        // Write your solution here\n        return false;\n    }\n};",
      "c": "#include <stdbool.h>\n\nbool containsDuplicate(int* nums, int numsSize) {\n    // Write your solution here\n    return false;\n}"
    },
    "testCases": [
      {
        "id": "tc-1",
        "input": "nums = [1,2,3,1]",
        "expectedOutput": "true"
      },
      {
        "id": "tc-2",
        "input": "nums = [1,2,3,4]",
        "expectedOutput": "false"
      },
      {
        "id": "tc-3",
        "input": "nums = [1,1,1,3,3,4,3,2,4,2]",
        "expectedOutput": "true"
      },
      {
        "id": "tc-4",
        "input": "nums = [99]",
        "expectedOutput": "false",
        "isHidden": true
      }
    ]
  },
  {
    "title": "Best Time to Buy and Sell Stock",
    "slug": "best-time-to-buy-and-sell-stock",
    "platform": "LEETCODE",
    "difficulty": "Easy",
    "topic": "Arrays",
    "tags": [
      "array",
      "dynamic-programming",
      "sliding-window"
    ],
    "canonicalUrl": "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/",
    "estimatedMinutes": 15,
    "description": "You are given an array prices where prices[i] is the price of a given stock on the ith day. You want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock. Return the maximum profit you can achieve from this transaction. If you cannot achieve any profit, return 0.",
    "entryFunctionName": "maxProfit",
    "companyTags": [
      "Amazon",
      "Google",
      "Meta",
      "Microsoft",
      "Goldman Sachs"
    ],
    "starterCode": {
      "javascript": "/**\n * @param {number[]} prices\n * @return {number}\n */\nfunction maxProfit(prices) {\n  // Write your solution here\n  \n}",
      "python": "class Solution:\n    def maxProfit(self, prices: list[int]) -> int:\n        # Write your solution here\n        pass",
      "java": "class Solution {\n    public int maxProfit(int[] prices) {\n        // Write your solution here\n        return 0;\n    }\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int maxProfit(vector<int>& prices) {\n        // Write your solution here\n        return 0;\n    }\n};",
      "c": "int maxProfit(int* prices, int pricesSize) {\n    // Write your solution here\n    return 0;\n}"
    },
    "testCases": [
      {
        "id": "tc-1",
        "input": "prices = [7,1,5,3,6,4]",
        "expectedOutput": "5"
      },
      {
        "id": "tc-2",
        "input": "prices = [7,6,4,3,1]",
        "expectedOutput": "0"
      },
      {
        "id": "tc-3",
        "input": "prices = [2,4,1]",
        "expectedOutput": "2",
        "isHidden": true
      }
    ]
  },
  {
    "title": "Product of Array Except Self",
    "slug": "product-of-array-except-self",
    "platform": "LEETCODE",
    "difficulty": "Medium",
    "topic": "Arrays",
    "tags": [
      "array",
      "prefix-sum"
    ],
    "canonicalUrl": "https://leetcode.com/problems/product-of-array-except-self/",
    "estimatedMinutes": 20,
    "description": "Given an integer array nums, return an array answer such that answer[i] is equal to the product of all the elements of nums except nums[i]. The product of any prefix or suffix of nums is guaranteed to fit in a 32-bit integer. You must write an algorithm that runs in O(n) time and without using the division operation.",
    "entryFunctionName": "productExceptSelf",
    "companyTags": [
      "Amazon",
      "Apple",
      "Meta",
      "Microsoft",
      "Bloomberg"
    ],
    "starterCode": {
      "javascript": "/**\n * @param {number[]} nums\n * @return {number[]}\n */\nfunction productExceptSelf(nums) {\n  // Write your solution here\n  \n}",
      "python": "class Solution:\n    def productExceptSelf(self, nums: list[int]) -> list[int]:\n        # Write your solution here\n        pass",
      "java": "class Solution {\n    public int[] productExceptSelf(int[] nums) {\n        // Write your solution here\n        return new int[]{};\n    }\n}",
      "cpp": "#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<int> productExceptSelf(vector<int>& nums) {\n        // Write your solution here\n        return {};\n    }\n};",
      "c": "int* productExceptSelf(int* nums, int numsSize, int* returnSize) {\n    // Write your solution here\n    *returnSize = numsSize;\n    return NULL;\n}"
    },
    "testCases": [
      {
        "id": "tc-1",
        "input": "nums = [1,2,3,4]",
        "expectedOutput": "[24, 12, 8, 6]"
      },
      {
        "id": "tc-2",
        "input": "nums = [-1,1,0,-3,3]",
        "expectedOutput": "[0, 0, 9, 0, 0]"
      },
      {
        "id": "tc-3",
        "input": "nums = [2,3]",
        "expectedOutput": "[3, 2]",
        "isHidden": true
      }
    ]
  },
  {
    "title": "Maximum Subarray",
    "slug": "maximum-subarray",
    "platform": "LEETCODE",
    "difficulty": "Medium",
    "topic": "Arrays",
    "tags": [
      "array",
      "divide-and-conquer",
      "dynamic-programming"
    ],
    "canonicalUrl": "https://leetcode.com/problems/maximum-subarray/",
    "estimatedMinutes": 20,
    "description": "Given an integer array nums, find the subarray with the largest sum, and return its sum. (Kadane's Algorithm)",
    "entryFunctionName": "maxSubArray",
    "companyTags": [
      "Amazon",
      "Apple",
      "Google",
      "Microsoft",
      "Meta"
    ],
    "starterCode": {
      "javascript": "/**\n * @param {number[]} nums\n * @return {number}\n */\nfunction maxSubArray(nums) {\n  // Write your solution here\n  \n}",
      "python": "class Solution:\n    def maxSubArray(self, nums: list[int]) -> int:\n        # Write your solution here\n        pass",
      "java": "class Solution {\n    public int maxSubArray(int[] nums) {\n        // Write your solution here\n        return 0;\n    }\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int maxSubArray(vector<int>& nums) {\n        // Write your solution here\n        return 0;\n    }\n};",
      "c": "int maxSubArray(int* nums, int numsSize) {\n    // Write your solution here\n    return 0;\n}"
    },
    "testCases": [
      {
        "id": "tc-1",
        "input": "nums = [-2,1,-3,4,-1,2,1,-5,4]",
        "expectedOutput": "6"
      },
      {
        "id": "tc-2",
        "input": "nums = [1]",
        "expectedOutput": "1"
      },
      {
        "id": "tc-3",
        "input": "nums = [5,4,-1,7,8]",
        "expectedOutput": "23"
      },
      {
        "id": "tc-4",
        "input": "nums = [-1,-2,-3]",
        "expectedOutput": "-1",
        "isHidden": true
      }
    ]
  },
  {
    "title": "Top K Frequent Elements",
    "slug": "top-k-frequent-elements",
    "platform": "LEETCODE",
    "difficulty": "Medium",
    "topic": "Arrays",
    "tags": [
      "array",
      "hash-table",
      "divide-and-conquer",
      "bucket-sort",
      "heap"
    ],
    "canonicalUrl": "https://leetcode.com/problems/top-k-frequent-elements/",
    "estimatedMinutes": 20,
    "description": "Given an integer array nums and an integer k, return the k most frequent elements. You may return the answer in any order.",
    "entryFunctionName": "topKFrequent",
    "companyTags": [
      "Amazon",
      "Meta",
      "Google",
      "Uber"
    ],
    "starterCode": {
      "javascript": "/**\n * @param {number[]} nums\n * @param {number} k\n * @return {number[]}\n */\nfunction topKFrequent(nums, k) {\n  // Write your solution here\n  \n}",
      "python": "class Solution:\n    def topKFrequent(self, nums: list[int], k: int) -> list[int]:\n        # Write your solution here\n        pass",
      "java": "import java.util.*;\n\nclass Solution {\n    public int[] topKFrequent(int[] nums, int k) {\n        // Write your solution here\n        return new int[]{};\n    }\n}",
      "cpp": "#include <vector>\n#include <unordered_map>\n#include <queue>\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<int> topKFrequent(vector<int>& nums, int k) {\n        // Write your solution here\n        return {};\n    }\n};",
      "c": "int* topKFrequent(int* nums, int numsSize, int k, int* returnSize) {\n    // Write your solution here\n    *returnSize = k;\n    return NULL;\n}"
    },
    "testCases": [
      {
        "id": "tc-1",
        "input": "nums = [1,1,1,2,2,3], k = 2",
        "expectedOutput": "[1, 2]"
      },
      {
        "id": "tc-2",
        "input": "nums = [1], k = 1",
        "expectedOutput": "[1]"
      },
      {
        "id": "tc-3",
        "input": "nums = [4,1,-1,2,-1,2,3], k = 2",
        "expectedOutput": "[-1, 2]",
        "isHidden": true
      }
    ]
  },
  {
    "title": "Longest Consecutive Sequence",
    "slug": "longest-consecutive-sequence",
    "platform": "LEETCODE",
    "difficulty": "Medium",
    "topic": "Arrays",
    "tags": [
      "array",
      "hash-table",
      "union-find"
    ],
    "canonicalUrl": "https://leetcode.com/problems/longest-consecutive-sequence/",
    "estimatedMinutes": 20,
    "description": "Given an unsorted array of integers nums, return the length of the longest consecutive elements sequence. You must write an algorithm that runs in O(n) time.",
    "entryFunctionName": "longestConsecutive",
    "companyTags": [
      "Google",
      "Meta",
      "Amazon",
      "Microsoft"
    ],
    "starterCode": {
      "javascript": "/**\n * @param {number[]} nums\n * @return {number}\n */\nfunction longestConsecutive(nums) {\n  // Write your solution here\n  \n}",
      "python": "class Solution:\n    def longestConsecutive(self, nums: list[int]) -> int:\n        # Write your solution here\n        pass",
      "java": "import java.util.*;\n\nclass Solution {\n    public int longestConsecutive(int[] nums) {\n        // Write your solution here\n        return 0;\n    }\n}",
      "cpp": "#include <vector>\n#include <unordered_set>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int longestConsecutive(vector<int>& nums) {\n        // Write your solution here\n        return 0;\n    }\n};",
      "c": "int longestConsecutive(int* nums, int numsSize) {\n    // Write your solution here\n    return 0;\n}"
    },
    "testCases": [
      {
        "id": "tc-1",
        "input": "nums = [100,4,200,1,3,2]",
        "expectedOutput": "4"
      },
      {
        "id": "tc-2",
        "input": "nums = [0,3,7,2,5,8,4,6,0,1]",
        "expectedOutput": "9"
      },
      {
        "id": "tc-3",
        "input": "nums = []",
        "expectedOutput": "0",
        "isHidden": true
      }
    ]
  },
  {
    "title": "Trapping Rain Water",
    "slug": "trapping-rain-water",
    "platform": "LEETCODE",
    "difficulty": "Hard",
    "topic": "Arrays",
    "tags": [
      "array",
      "two-pointers",
      "dynamic-programming",
      "stack"
    ],
    "canonicalUrl": "https://leetcode.com/problems/trapping-rain-water/",
    "estimatedMinutes": 30,
    "description": "Given n non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.",
    "entryFunctionName": "trap",
    "companyTags": [
      "Amazon",
      "Google",
      "Meta",
      "Apple",
      "Goldman Sachs"
    ],
    "starterCode": {
      "javascript": "/**\n * @param {number[]} height\n * @return {number}\n */\nfunction trap(height) {\n  // Write your solution here\n  \n}",
      "python": "class Solution:\n    def trap(self, height: list[int]) -> int:\n        # Write your solution here\n        pass",
      "java": "class Solution {\n    public int trap(int[] height) {\n        // Write your solution here\n        return 0;\n    }\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int trap(vector<int>& height) {\n        // Write your solution here\n        return 0;\n    }\n};",
      "c": "int trap(int* height, int heightSize) {\n    // Write your solution here\n    return 0;\n}"
    },
    "testCases": [
      {
        "id": "tc-1",
        "input": "height = [0,1,0,2,1,0,1,3,2,1,2,1]",
        "expectedOutput": "6"
      },
      {
        "id": "tc-2",
        "input": "height = [4,2,0,3,2,5]",
        "expectedOutput": "9"
      },
      {
        "id": "tc-3",
        "input": "height = [1,2,3,4,5]",
        "expectedOutput": "0",
        "isHidden": true
      }
    ]
  },
  {
    "title": "Valid Palindrome",
    "slug": "valid-palindrome",
    "platform": "LEETCODE",
    "difficulty": "Easy",
    "topic": "Two Pointers",
    "tags": [
      "two-pointers",
      "string"
    ],
    "canonicalUrl": "https://leetcode.com/problems/valid-palindrome/",
    "estimatedMinutes": 15,
    "description": "A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward. Given a string s, return true if it is a palindrome, or false otherwise.",
    "entryFunctionName": "isPalindrome",
    "companyTags": [
      "Meta",
      "Microsoft",
      "Amazon",
      "Spotify"
    ],
    "starterCode": {
      "javascript": "/**\n * @param {string} s\n * @return {boolean}\n */\nfunction isPalindrome(s) {\n  // Write your solution here\n  \n}",
      "python": "class Solution:\n    def isPalindrome(self, s: str) -> bool:\n        # Write your solution here\n        pass",
      "java": "class Solution {\n    public boolean isPalindrome(String s) {\n        // Write your solution here\n        return false;\n    }\n}",
      "cpp": "#include <string>\n#include <cctype>\nusing namespace std;\n\nclass Solution {\npublic:\n    bool isPalindrome(string s) {\n        // Write your solution here\n        return false;\n    }\n};",
      "c": "#include <stdbool.h>\n#include <string.h>\n#include <ctype.h>\n\nbool isPalindrome(char* s) {\n    // Write your solution here\n    return false;\n}"
    },
    "testCases": [
      {
        "id": "tc-1",
        "input": "s = \"A man, a plan, a canal: Panama\"",
        "expectedOutput": "true"
      },
      {
        "id": "tc-2",
        "input": "s = \"race a car\"",
        "expectedOutput": "false"
      },
      {
        "id": "tc-3",
        "input": "s = \" \"",
        "expectedOutput": "true"
      },
      {
        "id": "tc-4",
        "input": "s = \"0P\"",
        "expectedOutput": "false",
        "isHidden": true
      }
    ]
  },
  {
    "title": "Two Sum II - Input Array Is Sorted",
    "slug": "two-sum-ii-input-array-is-sorted",
    "platform": "LEETCODE",
    "difficulty": "Medium",
    "topic": "Two Pointers",
    "tags": [
      "array",
      "two-pointers",
      "binary-search"
    ],
    "canonicalUrl": "https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/",
    "estimatedMinutes": 15,
    "description": "Given a 1-indexed array of integers numbers that is already sorted in non-decreasing order, find two numbers such that they add up to a specific target number. Return the indices of the two numbers, index1 and index2, added by one as an integer array [index1, index2] of length 2.",
    "entryFunctionName": "twoSum",
    "companyTags": [
      "Amazon",
      "Google",
      "Meta"
    ],
    "starterCode": {
      "javascript": "/**\n * @param {number[]} numbers\n * @param {number} target\n * @return {number[]}\n */\nfunction twoSum(numbers, target) {\n  // Write your solution here\n  \n}",
      "python": "class Solution:\n    def twoSum(self, numbers: list[int], target: int) -> list[int]:\n        # Write your solution here\n        pass",
      "java": "class Solution {\n    public int[] twoSum(int[] numbers, int target) {\n        // Write your solution here\n        return new int[]{};\n    }\n}",
      "cpp": "#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<int> twoSum(vector<int>& numbers, int target) {\n        // Write your solution here\n        return {};\n    }\n};",
      "c": "int* twoSum(int* numbers, int numbersSize, int target, int* returnSize) {\n    // Write your solution here\n    *returnSize = 2;\n    return NULL;\n}"
    },
    "testCases": [
      {
        "id": "tc-1",
        "input": "numbers = [2,7,11,15], target = 9",
        "expectedOutput": "[1, 2]"
      },
      {
        "id": "tc-2",
        "input": "numbers = [2,3,4], target = 6",
        "expectedOutput": "[1, 3]"
      },
      {
        "id": "tc-3",
        "input": "numbers = [-1,0], target = -1",
        "expectedOutput": "[1, 2]"
      }
    ]
  },
  {
    "title": "3Sum",
    "slug": "3sum",
    "platform": "LEETCODE",
    "difficulty": "Medium",
    "topic": "Two Pointers",
    "tags": [
      "array",
      "two-pointers",
      "sorting"
    ],
    "canonicalUrl": "https://leetcode.com/problems/3sum/",
    "estimatedMinutes": 25,
    "description": "Given an integer array nums, return all the triplets [nums[i], nums[j], nums[k]] such that i != j, i != k, and j != k, and nums[i] + nums[j] + nums[k] == 0. Notice that the solution set must not contain duplicate triplets.",
    "entryFunctionName": "threeSum",
    "companyTags": [
      "Meta",
      "Amazon",
      "Apple",
      "Google",
      "Microsoft"
    ],
    "starterCode": {
      "javascript": "/**\n * @param {number[]} nums\n * @return {number[][]}\n */\nfunction threeSum(nums) {\n  // Write your solution here\n  \n}",
      "python": "class Solution:\n    def threeSum(self, nums: list[int]) -> list[list[int]]:\n        # Write your solution here\n        pass",
      "java": "import java.util.*;\n\nclass Solution {\n    public List<List<Integer>> threeSum(int[] nums) {\n        // Write your solution here\n        return new ArrayList<>();\n    }\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<vector<int>> threeSum(vector<int>& nums) {\n        // Write your solution here\n        return {};\n    }\n};",
      "c": "int** threeSum(int* nums, int numsSize, int* returnSize, int** returnColumnSizes) {\n    // Write your solution here\n    *returnSize = 0;\n    return NULL;\n}"
    },
    "testCases": [
      {
        "id": "tc-1",
        "input": "nums = [-1,0,1,2,-1,-4]",
        "expectedOutput": "[[-1, -1, 2], [-1, 0, 1]]"
      },
      {
        "id": "tc-2",
        "input": "nums = [0,1,1]",
        "expectedOutput": "[]"
      },
      {
        "id": "tc-3",
        "input": "nums = [0,0,0]",
        "expectedOutput": "[[0, 0, 0]]"
      }
    ]
  },
  {
    "title": "Container With Most Water",
    "slug": "container-with-most-water",
    "platform": "LEETCODE",
    "difficulty": "Medium",
    "topic": "Two Pointers",
    "tags": [
      "array",
      "two-pointers",
      "greedy"
    ],
    "canonicalUrl": "https://leetcode.com/problems/container-with-most-water/",
    "estimatedMinutes": 20,
    "description": "You are given an integer array height of length n. There are n vertical lines drawn such that the two endpoints of the ith line are (i, 0) and (i, height[i]). Find two lines that together with the x-axis form a container, such that the container contains the most water. Return the maximum amount of water a container can store.",
    "entryFunctionName": "maxArea",
    "companyTags": [
      "Amazon",
      "Google",
      "Apple",
      "Meta",
      "Goldman Sachs"
    ],
    "starterCode": {
      "javascript": "/**\n * @param {number[]} height\n * @return {number}\n */\nfunction maxArea(height) {\n  // Write your solution here\n  \n}",
      "python": "class Solution:\n    def maxArea(self, height: list[int]) -> int:\n        # Write your solution here\n        pass",
      "java": "class Solution {\n    public int maxArea(int[] height) {\n        // Write your solution here\n        return 0;\n    }\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int maxArea(vector<int>& height) {\n        // Write your solution here\n        return 0;\n    }\n};",
      "c": "int maxArea(int* height, int heightSize) {\n    // Write your solution here\n    return 0;\n}"
    },
    "testCases": [
      {
        "id": "tc-1",
        "input": "height = [1,8,6,2,5,4,8,3,7]",
        "expectedOutput": "49"
      },
      {
        "id": "tc-2",
        "input": "height = [1,1]",
        "expectedOutput": "1"
      },
      {
        "id": "tc-3",
        "input": "height = [4,3,2,1,4]",
        "expectedOutput": "16",
        "isHidden": true
      }
    ]
  },
  {
    "title": "Longest Substring Without Repeating Characters",
    "slug": "longest-substring-without-repeating-characters",
    "platform": "LEETCODE",
    "difficulty": "Medium",
    "topic": "Sliding Window",
    "tags": [
      "hash-table",
      "string",
      "sliding-window"
    ],
    "canonicalUrl": "https://leetcode.com/problems/longest-substring-without-repeating-characters/",
    "estimatedMinutes": 20,
    "description": "Given a string s, find the length of the longest substring without repeating characters.",
    "entryFunctionName": "lengthOfLongestSubstring",
    "companyTags": [
      "Amazon",
      "Microsoft",
      "Meta",
      "Google",
      "Bloomberg"
    ],
    "starterCode": {
      "javascript": "/**\n * @param {string} s\n * @return {number}\n */\nfunction lengthOfLongestSubstring(s) {\n  // Write your solution here\n  \n}",
      "python": "class Solution:\n    def lengthOfLongestSubstring(self, s: str) -> int:\n        # Write your solution here\n        pass",
      "java": "import java.util.*;\n\nclass Solution {\n    public int lengthOfLongestSubstring(String s) {\n        // Write your solution here\n        return 0;\n    }\n}",
      "cpp": "#include <string>\n#include <unordered_set>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int lengthOfLongestSubstring(string s) {\n        // Write your solution here\n        return 0;\n    }\n};",
      "c": "int lengthOfLongestSubstring(char* s) {\n    // Write your solution here\n    return 0;\n}"
    },
    "testCases": [
      {
        "id": "tc-1",
        "input": "s = \"abcabcbb\"",
        "expectedOutput": "3"
      },
      {
        "id": "tc-2",
        "input": "s = \"bbbbb\"",
        "expectedOutput": "1"
      },
      {
        "id": "tc-3",
        "input": "s = \"pwwkew\"",
        "expectedOutput": "3"
      },
      {
        "id": "tc-4",
        "input": "s = \"\"",
        "expectedOutput": "0",
        "isHidden": true
      }
    ]
  },
  {
    "title": "Longest Repeating Character Replacement",
    "slug": "longest-repeating-character-replacement",
    "platform": "LEETCODE",
    "difficulty": "Medium",
    "topic": "Sliding Window",
    "tags": [
      "hash-table",
      "string",
      "sliding-window"
    ],
    "canonicalUrl": "https://leetcode.com/problems/longest-repeating-character-replacement/",
    "estimatedMinutes": 25,
    "description": "You are given a string s and an integer k. You can choose any character of the string and change it to any other uppercase English character. You can perform this operation at most k times. Return the length of the longest substring containing the same letter you can get after performing the above operations.",
    "entryFunctionName": "characterReplacement",
    "companyTags": [
      "Google",
      "Amazon",
      "Meta"
    ],
    "starterCode": {
      "javascript": "/**\n * @param {string} s\n * @param {number} k\n * @return {number}\n */\nfunction characterReplacement(s, k) {\n  // Write your solution here\n  \n}",
      "python": "class Solution:\n    def characterReplacement(self, s: str, k: int) -> int:\n        # Write your solution here\n        pass",
      "java": "class Solution {\n    public int characterReplacement(String s, int k) {\n        // Write your solution here\n        return 0;\n    }\n}",
      "cpp": "#include <string>\n#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int characterReplacement(string s, int k) {\n        // Write your solution here\n        return 0;\n    }\n};",
      "c": "int characterReplacement(char* s, int k) {\n    // Write your solution here\n    return 0;\n}"
    },
    "testCases": [
      {
        "id": "tc-1",
        "input": "s = \"ABAB\", k = 2",
        "expectedOutput": "4"
      },
      {
        "id": "tc-2",
        "input": "s = \"AABABBA\", k = 1",
        "expectedOutput": "4"
      },
      {
        "id": "tc-3",
        "input": "s = \"AAAA\", k = 2",
        "expectedOutput": "4",
        "isHidden": true
      }
    ]
  },
  {
    "title": "Valid Anagram",
    "slug": "valid-anagram",
    "platform": "LEETCODE",
    "difficulty": "Easy",
    "topic": "Strings",
    "tags": [
      "hash-table",
      "string",
      "sorting"
    ],
    "canonicalUrl": "https://leetcode.com/problems/valid-anagram/",
    "estimatedMinutes": 10,
    "description": "Given two strings s and t, return true if t is an anagram of s, and false otherwise.",
    "entryFunctionName": "isAnagram",
    "companyTags": [
      "Amazon",
      "Bloomberg",
      "Google"
    ],
    "starterCode": {
      "javascript": "/**\n * @param {string} s\n * @param {string} t\n * @return {boolean}\n */\nfunction isAnagram(s, t) {\n  // Write your solution here\n  \n}",
      "python": "class Solution:\n    def isAnagram(self, s: str, t: str) -> bool:\n        # Write your solution here\n        pass",
      "java": "class Solution {\n    public boolean isAnagram(String s, String t) {\n        // Write your solution here\n        return false;\n    }\n}",
      "cpp": "#include <string>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    bool isAnagram(string s, string t) {\n        // Write your solution here\n        return false;\n    }\n};",
      "c": "#include <stdbool.h>\n#include <string.h>\n\nbool isAnagram(char* s, char* t) {\n    // Write your solution here\n    return false;\n}"
    },
    "testCases": [
      {
        "id": "tc-1",
        "input": "s = \"anagram\", t = \"nagaram\"",
        "expectedOutput": "true"
      },
      {
        "id": "tc-2",
        "input": "s = \"rat\", t = \"car\"",
        "expectedOutput": "false"
      },
      {
        "id": "tc-3",
        "input": "s = \"a\", t = \"ab\"",
        "expectedOutput": "false",
        "isHidden": true
      }
    ]
  },
  {
    "title": "Group Anagrams",
    "slug": "group-anagrams",
    "platform": "LEETCODE",
    "difficulty": "Medium",
    "topic": "Strings",
    "tags": [
      "array",
      "hash-table",
      "string",
      "sorting"
    ],
    "canonicalUrl": "https://leetcode.com/problems/group-anagrams/",
    "estimatedMinutes": 20,
    "description": "Given an array of strings strs, group the anagrams together. You can return the answer in any order.",
    "entryFunctionName": "groupAnagrams",
    "companyTags": [
      "Amazon",
      "Meta",
      "Microsoft",
      "Google"
    ],
    "starterCode": {
      "javascript": "/**\n * @param {string[]} strs\n * @return {string[][]}\n */\nfunction groupAnagrams(strs) {\n  // Write your solution here\n  \n}",
      "python": "class Solution:\n    def groupAnagrams(self, strs: list[str]) -> list[list[str]]:\n        # Write your solution here\n        pass",
      "java": "import java.util.*;\n\nclass Solution {\n    public List<List<String>> groupAnagrams(String[] strs) {\n        // Write your solution here\n        return new ArrayList<>();\n    }\n}",
      "cpp": "#include <vector>\n#include <string>\n#include <unordered_map>\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<vector<string>> groupAnagrams(vector<string>& strs) {\n        // Write your solution here\n        return {};\n    }\n};",
      "c": "char*** groupAnagrams(char** strs, int strsSize, int* returnSize, int** returnColumnSizes) {\n    // Write your solution here\n    *returnSize = 0;\n    return NULL;\n}"
    },
    "testCases": [
      {
        "id": "tc-1",
        "input": "strs = [\"eat\",\"tea\",\"tan\",\"ate\",\"nat\",\"bat\"]",
        "expectedOutput": "[[\"bat\"], [\"nat\", \"tan\"], [\"ate\", \"eat\", \"tea\"]]"
      },
      {
        "id": "tc-2",
        "input": "strs = [\"\"]",
        "expectedOutput": "[[\"\"]]"
      },
      {
        "id": "tc-3",
        "input": "strs = [\"a\"]",
        "expectedOutput": "[[\"a\"]]"
      }
    ]
  },
  {
    "title": "Valid Parentheses",
    "slug": "valid-parentheses",
    "platform": "LEETCODE",
    "difficulty": "Easy",
    "topic": "Stack & Queue",
    "tags": [
      "string",
      "stack"
    ],
    "canonicalUrl": "https://leetcode.com/problems/valid-parentheses/",
    "estimatedMinutes": 15,
    "description": "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid. An input string is valid if open brackets are closed by the same type of brackets and in the correct order.",
    "entryFunctionName": "isValid",
    "companyTags": [
      "Amazon",
      "Google",
      "Meta",
      "Microsoft",
      "Bloomberg"
    ],
    "starterCode": {
      "javascript": "/**\n * @param {string} s\n * @return {boolean}\n */\nfunction isValid(s) {\n  // Write your solution here\n  \n}",
      "python": "class Solution:\n    def isValid(self, s: str) -> bool:\n        # Write your solution here\n        pass",
      "java": "import java.util.*;\n\nclass Solution {\n    public boolean isValid(String s) {\n        // Write your solution here\n        return false;\n    }\n}",
      "cpp": "#include <string>\n#include <stack>\nusing namespace std;\n\nclass Solution {\npublic:\n    bool isValid(string s) {\n        // Write your solution here\n        return false;\n    }\n};",
      "c": "#include <stdbool.h>\n#include <string.h>\n\nbool isValid(char* s) {\n    // Write your solution here\n    return false;\n}"
    },
    "testCases": [
      {
        "id": "tc-1",
        "input": "s = \"()\"",
        "expectedOutput": "true"
      },
      {
        "id": "tc-2",
        "input": "s = \"()[]{}\"",
        "expectedOutput": "true"
      },
      {
        "id": "tc-3",
        "input": "s = \"(]\"",
        "expectedOutput": "false"
      },
      {
        "id": "tc-4",
        "input": "s = \"([)]\"",
        "expectedOutput": "false",
        "isHidden": true
      }
    ]
  },
  {
    "title": "Min Stack",
    "slug": "min-stack",
    "platform": "LEETCODE",
    "difficulty": "Medium",
    "topic": "Stack & Queue",
    "tags": [
      "stack",
      "design"
    ],
    "canonicalUrl": "https://leetcode.com/problems/min-stack/",
    "estimatedMinutes": 20,
    "description": "Design a stack that supports push, pop, top, and retrieving the minimum element in constant time O(1).",
    "entryFunctionName": "minStackSimulation",
    "companyTags": [
      "Amazon",
      "Bloomberg",
      "Microsoft"
    ],
    "starterCode": {
      "javascript": "function minStackSimulation(operations, values) {\n  // Write your solution here\n  \n}",
      "python": "class MinStack:\n    def __init__(self):\n        pass\n\n    def push(self, val: int) -> None:\n        pass\n\n    def pop(self) -> None:\n        pass\n\n    def top(self) -> int:\n        pass\n\n    def getMin(self) -> int:\n        pass",
      "java": "class MinStack {\n    public MinStack() {\n        // Write your solution here\n    }\n    public void push(int val) {}\n    public void pop() {}\n    public int top() { return 0; }\n    public int getMin() { return 0; }\n}",
      "cpp": "#include <stack>\nusing namespace std;\n\nclass MinStack {\npublic:\n    MinStack() {}\n    void push(int val) {}\n    void pop() {}\n    int top() { return 0; }\n    int getMin() { return 0; }\n};",
      "c": "typedef struct { int* data; } MinStack;\nMinStack* minStackCreate() { return NULL; }\nvoid minStackPush(MinStack* obj, int val) {}\nvoid minStackPop(MinStack* obj) {}\nint minStackTop(MinStack* obj) { return 0; }\nint minStackGetMin(MinStack* obj) { return 0; }"
    },
    "testCases": [
      {
        "id": "tc-1",
        "input": "operations = [\"push\",\"push\",\"push\",\"getMin\",\"pop\",\"top\",\"getMin\"], values = [[-2],[0],[-3],[],[],[],[]]",
        "expectedOutput": "[null, null, null, -3, null, 0, -2]"
      },
      {
        "id": "tc-2",
        "input": "operations = [\"push\",\"push\",\"getMin\"], values = [[1],[2],[]]",
        "expectedOutput": "[null, null, 1]"
      }
    ]
  },
  {
    "title": "Daily Temperatures",
    "slug": "daily-temperatures",
    "platform": "LEETCODE",
    "difficulty": "Medium",
    "topic": "Stack & Queue",
    "tags": [
      "array",
      "stack",
      "monotonic-stack"
    ],
    "canonicalUrl": "https://leetcode.com/problems/daily-temperatures/",
    "estimatedMinutes": 20,
    "description": "Given an array of integers temperatures represents the daily temperatures, return an array answer such that answer[i] is the number of days you have to wait after the ith day to get a warmer temperature. If there is no future day for which this is possible, keep answer[i] == 0 instead.",
    "entryFunctionName": "dailyTemperatures",
    "companyTags": [
      "Meta",
      "Amazon",
      "Google"
    ],
    "starterCode": {
      "javascript": "/**\n * @param {number[]} temperatures\n * @return {number[]}\n */\nfunction dailyTemperatures(temperatures) {\n  // Write your solution here\n  \n}",
      "python": "class Solution:\n    def dailyTemperatures(self, temperatures: list[int]) -> list[int]:\n        # Write your solution here\n        pass",
      "java": "import java.util.*;\n\nclass Solution {\n    public int[] dailyTemperatures(int[] temperatures) {\n        // Write your solution here\n        return new int[]{};\n    }\n}",
      "cpp": "#include <vector>\n#include <stack>\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<int> dailyTemperatures(vector<int>& temperatures) {\n        // Write your solution here\n        return {};\n    }\n};",
      "c": "int* dailyTemperatures(int* temperatures, int temperaturesSize, int* returnSize) {\n    // Write your solution here\n    *returnSize = temperaturesSize;\n    return NULL;\n}"
    },
    "testCases": [
      {
        "id": "tc-1",
        "input": "temperatures = [73,74,75,71,69,72,76,73]",
        "expectedOutput": "[1, 1, 4, 2, 1, 1, 0, 0]"
      },
      {
        "id": "tc-2",
        "input": "temperatures = [30,40,50,60]",
        "expectedOutput": "[1, 1, 1, 0]"
      },
      {
        "id": "tc-3",
        "input": "temperatures = [30,60,90]",
        "expectedOutput": "[1, 1, 0]"
      }
    ]
  },
  {
    "title": "The Celebrity Problem",
    "slug": "the-celebrity-problem-gfg",
    "platform": "GEEKSFORGEEKS",
    "difficulty": "Medium",
    "topic": "Stack & Queue",
    "tags": [
      "stack",
      "two-pointers",
      "graph"
    ],
    "canonicalUrl": "https://www.geeksforgeeks.org/problems/the-celebrity-problem/1",
    "estimatedMinutes": 20,
    "description": "A celebrity is a person who is known to all but does not know anyone at a party. A party of N people is represented by an N x N matrix M where M[i][j] = 1 means person i knows person j. Find the celebrity id (0-indexed) or return -1.",
    "entryFunctionName": "celebrity",
    "companyTags": [
      "Amazon",
      "Microsoft",
      "Flipkart"
    ],
    "starterCode": {
      "javascript": "function celebrity(M) {\n  // Write your solution here\n  \n}",
      "python": "class Solution:\n    def celebrity(self, M: list[list[int]]) -> int:\n        # Write your solution here\n        pass",
      "java": "class Solution {\n    public int celebrity(int[][] M) {\n        // Write your solution here\n        return -1;\n    }\n}",
      "cpp": "#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    int celebrity(vector<vector<int>>& M) {\n        // Write your solution here\n        return -1;\n    }\n};",
      "c": "int celebrity(int** M, int n) {\n    // Write your solution here\n    return -1;\n}"
    },
    "testCases": [
      {
        "id": "tc-1",
        "input": "M = [[0,1,0],[0,0,0],[0,1,0]]",
        "expectedOutput": "1"
      },
      {
        "id": "tc-2",
        "input": "M = [[0,1],[1,0]]",
        "expectedOutput": "-1"
      },
      {
        "id": "tc-3",
        "input": "M = [[0,0,0],[0,0,0],[0,0,0]]",
        "expectedOutput": "-1",
        "isHidden": true
      }
    ]
  },
  {
    "title": "Reverse Linked List",
    "slug": "reverse-linked-list",
    "platform": "LEETCODE",
    "difficulty": "Easy",
    "topic": "Linked Lists",
    "tags": [
      "linked-list",
      "recursion"
    ],
    "canonicalUrl": "https://leetcode.com/problems/reverse-linked-list/",
    "estimatedMinutes": 15,
    "description": "Given the head of a singly linked list represented as an array of values, return the reversed linked list values.",
    "entryFunctionName": "reverseList",
    "companyTags": [
      "Amazon",
      "Google",
      "Apple",
      "Meta",
      "Microsoft"
    ],
    "starterCode": {
      "javascript": "function reverseList(head) {\n  // Write your solution here\n  \n}",
      "python": "class Solution:\n    def reverseList(self, head: list) -> list:\n        # Write your solution here\n        pass",
      "java": "class Solution {\n    public int[] reverseList(int[] head) {\n        // Write your solution here\n        return new int[]{};\n    }\n}",
      "cpp": "#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<int> reverseList(vector<int>& head) {\n        // Write your solution here\n        return {};\n    }\n};",
      "c": "int* reverseList(int* head, int headSize, int* returnSize) {\n    // Write your solution here\n    *returnSize = headSize;\n    return NULL;\n}"
    },
    "testCases": [
      {
        "id": "tc-1",
        "input": "head = [1,2,3,4,5]",
        "expectedOutput": "[5, 4, 3, 2, 1]"
      },
      {
        "id": "tc-2",
        "input": "head = [1,2]",
        "expectedOutput": "[2, 1]"
      },
      {
        "id": "tc-3",
        "input": "head = []",
        "expectedOutput": "[]"
      }
    ]
  },
  {
    "title": "Merge Two Sorted Lists",
    "slug": "merge-two-sorted-lists",
    "platform": "LEETCODE",
    "difficulty": "Easy",
    "topic": "Linked Lists",
    "tags": [
      "linked-list",
      "recursion"
    ],
    "canonicalUrl": "https://leetcode.com/problems/merge-two-sorted-lists/",
    "estimatedMinutes": 15,
    "description": "You are given the heads of two sorted linked lists list1 and list2. Merge the two lists into one sorted list and return its values.",
    "entryFunctionName": "mergeTwoLists",
    "companyTags": [
      "Amazon",
      "Apple",
      "Microsoft",
      "Google"
    ],
    "starterCode": {
      "javascript": "function mergeTwoLists(list1, list2) {\n  // Write your solution here\n  \n}",
      "python": "class Solution:\n    def mergeTwoLists(self, list1: list, list2: list) -> list:\n        # Write your solution here\n        pass",
      "java": "class Solution {\n    public int[] mergeTwoLists(int[] list1, int[] list2) {\n        // Write your solution here\n        return new int[]{};\n    }\n}",
      "cpp": "#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<int> mergeTwoLists(vector<int>& list1, vector<int>& list2) {\n        // Write your solution here\n        return {};\n    }\n};",
      "c": "int* mergeTwoLists(int* list1, int l1Size, int* list2, int l2Size, int* returnSize) {\n    // Write your solution here\n    *returnSize = 0;\n    return NULL;\n}"
    },
    "testCases": [
      {
        "id": "tc-1",
        "input": "list1 = [1,2,4], list2 = [1,3,4]",
        "expectedOutput": "[1, 1, 2, 3, 4, 4]"
      },
      {
        "id": "tc-2",
        "input": "list1 = [], list2 = []",
        "expectedOutput": "[]"
      },
      {
        "id": "tc-3",
        "input": "list1 = [], list2 = [0]",
        "expectedOutput": "[0]"
      }
    ]
  },
  {
    "title": "Linked List Cycle",
    "slug": "linked-list-cycle",
    "platform": "LEETCODE",
    "difficulty": "Easy",
    "topic": "Linked Lists",
    "tags": [
      "hash-table",
      "linked-list",
      "two-pointers"
    ],
    "canonicalUrl": "https://leetcode.com/problems/linked-list-cycle/",
    "estimatedMinutes": 15,
    "description": "Given head, the head of a linked list, determine if the linked list has a cycle in it. There is a cycle in a linked list if there is some node in the list that can be reached again by continuously following the next pointer. Return true if there is a cycle in the linked list. Otherwise, return false.",
    "entryFunctionName": "hasCycle",
    "companyTags": [
      "Amazon",
      "Microsoft",
      "Spotify"
    ],
    "starterCode": {
      "javascript": "function hasCycle(head, pos) {\n  // Write your solution here\n  \n}",
      "python": "class Solution:\n    def hasCycle(self, head: list, pos: int) -> bool:\n        # Write your solution here\n        pass",
      "java": "class Solution {\n    public boolean hasCycle(int[] head, int pos) {\n        // Write your solution here\n        return false;\n    }\n}",
      "cpp": "#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    bool hasCycle(vector<int>& head, int pos) {\n        // Write your solution here\n        return false;\n    }\n};",
      "c": "#include <stdbool.h>\n\nbool hasCycle(int* head, int headSize, int pos) {\n    // Write your solution here\n    return false;\n}"
    },
    "testCases": [
      {
        "id": "tc-1",
        "input": "head = [3,2,0,-4], pos = 1",
        "expectedOutput": "true"
      },
      {
        "id": "tc-2",
        "input": "head = [1,2], pos = 0",
        "expectedOutput": "true"
      },
      {
        "id": "tc-3",
        "input": "head = [1], pos = -1",
        "expectedOutput": "false"
      }
    ]
  },
  {
    "title": "Binary Search",
    "slug": "binary-search",
    "platform": "LEETCODE",
    "difficulty": "Easy",
    "topic": "Binary Search",
    "tags": [
      "array",
      "binary-search"
    ],
    "canonicalUrl": "https://leetcode.com/problems/binary-search/",
    "estimatedMinutes": 10,
    "description": "Given an array of integers nums which is sorted in ascending order, and an integer target, write a function to search target in nums. If target exists, then return its index. Otherwise, return -1. You must write an algorithm with O(log n) runtime complexity.",
    "entryFunctionName": "search",
    "companyTags": [
      "Microsoft",
      "Apple",
      "Google"
    ],
    "starterCode": {
      "javascript": "/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number}\n */\nfunction search(nums, target) {\n  // Write your solution here\n  \n}",
      "python": "class Solution:\n    def search(self, nums: list[int], target: int) -> int:\n        # Write your solution here\n        pass",
      "java": "class Solution {\n    public int search(int[] nums, int target) {\n        // Write your solution here\n        return -1;\n    }\n}",
      "cpp": "#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    int search(vector<int>& nums, int target) {\n        // Write your solution here\n        return -1;\n    }\n};",
      "c": "int search(int* nums, int numsSize, int target) {\n    // Write your solution here\n    return -1;\n}"
    },
    "testCases": [
      {
        "id": "tc-1",
        "input": "nums = [-1,0,3,5,9,12], target = 9",
        "expectedOutput": "4"
      },
      {
        "id": "tc-2",
        "input": "nums = [-1,0,3,5,9,12], target = 2",
        "expectedOutput": "-1"
      },
      {
        "id": "tc-3",
        "input": "nums = [5], target = 5",
        "expectedOutput": "0"
      }
    ]
  },
  {
    "title": "Search in Rotated Sorted Array",
    "slug": "search-in-rotated-sorted-array",
    "platform": "LEETCODE",
    "difficulty": "Medium",
    "topic": "Binary Search",
    "tags": [
      "array",
      "binary-search"
    ],
    "canonicalUrl": "https://leetcode.com/problems/search-in-rotated-sorted-array/",
    "estimatedMinutes": 20,
    "description": "There is an integer array nums sorted in ascending order (with distinct values), rotated at an unknown pivot index. Given the array nums after the possible rotation and an integer target, return the index of target if it is in nums, or -1 if it is not in nums. You must write an algorithm with O(log n) runtime complexity.",
    "entryFunctionName": "search",
    "companyTags": [
      "Amazon",
      "Meta",
      "Microsoft",
      "Google"
    ],
    "starterCode": {
      "javascript": "/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number}\n */\nfunction search(nums, target) {\n  // Write your solution here\n  \n}",
      "python": "class Solution:\n    def search(self, nums: list[int], target: int) -> int:\n        # Write your solution here\n        pass",
      "java": "class Solution {\n    public int search(int[] nums, int target) {\n        // Write your solution here\n        return -1;\n    }\n}",
      "cpp": "#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    int search(vector<int>& nums, int target) {\n        // Write your solution here\n        return -1;\n    }\n};",
      "c": "int search(int* nums, int numsSize, int target) {\n    // Write your solution here\n    return -1;\n}"
    },
    "testCases": [
      {
        "id": "tc-1",
        "input": "nums = [4,5,6,7,0,1,2], target = 0",
        "expectedOutput": "4"
      },
      {
        "id": "tc-2",
        "input": "nums = [4,5,6,7,0,1,2], target = 3",
        "expectedOutput": "-1"
      },
      {
        "id": "tc-3",
        "input": "nums = [1], target = 0",
        "expectedOutput": "-1"
      }
    ]
  },
  {
    "title": "Find Minimum in Rotated Sorted Array",
    "slug": "find-minimum-in-rotated-sorted-array",
    "platform": "LEETCODE",
    "difficulty": "Medium",
    "topic": "Binary Search",
    "tags": [
      "array",
      "binary-search"
    ],
    "canonicalUrl": "https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/",
    "estimatedMinutes": 15,
    "description": "Suppose an array of length n sorted in ascending order is rotated between 1 and n times. Notice that rotating an array [a[0], a[1], a[2], ..., a[n-1]] 1 time results in the array [a[n-1], a[0], a[1], a[2], ..., a[n-2]]. Given the sorted rotated array nums of unique elements, return the minimum element of this array. You must write an algorithm that runs in O(log n) time.",
    "entryFunctionName": "findMin",
    "companyTags": [
      "Amazon",
      "Google",
      "Microsoft"
    ],
    "starterCode": {
      "javascript": "/**\n * @param {number[]} nums\n * @return {number}\n */\nfunction findMin(nums) {\n  // Write your solution here\n  \n}",
      "python": "class Solution:\n    def findMin(self, nums: list[int]) -> int:\n        # Write your solution here\n        pass",
      "java": "class Solution {\n    public int findMin(int[] nums) {\n        // Write your solution here\n        return 0;\n    }\n}",
      "cpp": "#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    int findMin(vector<int>& nums) {\n        // Write your solution here\n        return 0;\n    }\n};",
      "c": "int findMin(int* nums, int numsSize) {\n    // Write your solution here\n    return 0;\n}"
    },
    "testCases": [
      {
        "id": "tc-1",
        "input": "nums = [3,4,5,1,2]",
        "expectedOutput": "1"
      },
      {
        "id": "tc-2",
        "input": "nums = [4,5,6,7,0,1,2]",
        "expectedOutput": "0"
      },
      {
        "id": "tc-3",
        "input": "nums = [11,13,15,17]",
        "expectedOutput": "11"
      }
    ]
  },
  {
    "title": "Maximum Depth of Binary Tree",
    "slug": "maximum-depth-of-binary-tree",
    "platform": "LEETCODE",
    "difficulty": "Easy",
    "topic": "Trees & Graphs",
    "tags": [
      "tree",
      "depth-first-search",
      "breadth-first-search",
      "binary-tree"
    ],
    "canonicalUrl": "https://leetcode.com/problems/maximum-depth-of-binary-tree/",
    "estimatedMinutes": 15,
    "description": "Given the root of a binary tree represented as an array (level-order), return its maximum depth.",
    "entryFunctionName": "maxDepth",
    "companyTags": [
      "Amazon",
      "Google",
      "Meta",
      "LinkedIn"
    ],
    "starterCode": {
      "javascript": "function maxDepth(root) {\n  // Write your solution here\n  \n}",
      "python": "class Solution:\n    def maxDepth(self, root: list) -> int:\n        # Write your solution here\n        pass",
      "java": "class Solution {\n    public int maxDepth(Integer[] root) {\n        // Write your solution here\n        return 0;\n    }\n}",
      "cpp": "#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    int maxDepth(vector<int>& root) {\n        // Write your solution here\n        return 0;\n    }\n};",
      "c": "int maxDepth(int* root, int rootSize) {\n    // Write your solution here\n    return 0;\n}"
    },
    "testCases": [
      {
        "id": "tc-1",
        "input": "root = [3,9,20,null,null,15,7]",
        "expectedOutput": "3"
      },
      {
        "id": "tc-2",
        "input": "root = [1,null,2]",
        "expectedOutput": "2"
      },
      {
        "id": "tc-3",
        "input": "root = []",
        "expectedOutput": "0"
      }
    ]
  },
  {
    "title": "Invert Binary Tree",
    "slug": "invert-binary-tree",
    "platform": "LEETCODE",
    "difficulty": "Easy",
    "topic": "Trees & Graphs",
    "tags": [
      "tree",
      "depth-first-search",
      "binary-tree"
    ],
    "canonicalUrl": "https://leetcode.com/problems/invert-binary-tree/",
    "estimatedMinutes": 15,
    "description": "Given the root of a binary tree represented in level order, invert the tree, and return its root values in level order.",
    "entryFunctionName": "invertTree",
    "companyTags": [
      "Google",
      "Amazon",
      "Meta"
    ],
    "starterCode": {
      "javascript": "function invertTree(root) {\n  // Write your solution here\n  \n}",
      "python": "class Solution:\n    def invertTree(self, root: list) -> list:\n        # Write your solution here\n        pass",
      "java": "class Solution {\n    public Integer[] invertTree(Integer[] root) {\n        // Write your solution here\n        return new Integer[]{};\n    }\n}",
      "cpp": "#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<int> invertTree(vector<int>& root) {\n        // Write your solution here\n        return {};\n    }\n};",
      "c": "int* invertTree(int* root, int rootSize, int* returnSize) {\n    // Write your solution here\n    *returnSize = rootSize;\n    return NULL;\n}"
    },
    "testCases": [
      {
        "id": "tc-1",
        "input": "root = [4,2,7,1,3,6,9]",
        "expectedOutput": "[4, 7, 2, 9, 6, 3, 1]"
      },
      {
        "id": "tc-2",
        "input": "root = [2,1,3]",
        "expectedOutput": "[2, 3, 1]"
      },
      {
        "id": "tc-3",
        "input": "root = []",
        "expectedOutput": "[]"
      }
    ]
  },
  {
    "title": "Validate Binary Search Tree",
    "slug": "validate-binary-search-tree",
    "platform": "LEETCODE",
    "difficulty": "Medium",
    "topic": "Trees & Graphs",
    "tags": [
      "tree",
      "depth-first-search",
      "binary-search-tree"
    ],
    "canonicalUrl": "https://leetcode.com/problems/validate-binary-search-tree/",
    "estimatedMinutes": 20,
    "description": "Given the root of a binary tree, determine if it is a valid binary search tree (BST). A valid BST satisfies: left subtree contains only nodes with keys less than the node key, and right subtree contains only nodes with keys greater than the node key.",
    "entryFunctionName": "isValidBST",
    "companyTags": [
      "Amazon",
      "Bloomberg",
      "Meta",
      "Microsoft"
    ],
    "starterCode": {
      "javascript": "function isValidBST(root) {\n  // Write your solution here\n  \n}",
      "python": "class Solution:\n    def isValidBST(self, root: list) -> bool:\n        # Write your solution here\n        pass",
      "java": "class Solution {\n    public boolean isValidBST(Integer[] root) {\n        // Write your solution here\n        return false;\n    }\n}",
      "cpp": "#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    bool isValidBST(vector<int>& root) {\n        // Write your solution here\n        return false;\n    }\n};",
      "c": "#include <stdbool.h>\n\nbool isValidBST(int* root, int rootSize) {\n    // Write your solution here\n    return false;\n}"
    },
    "testCases": [
      {
        "id": "tc-1",
        "input": "root = [2,1,3]",
        "expectedOutput": "true"
      },
      {
        "id": "tc-2",
        "input": "root = [5,1,4,null,null,3,6]",
        "expectedOutput": "false"
      },
      {
        "id": "tc-3",
        "input": "root = [10,5,15,null,null,6,20]",
        "expectedOutput": "false",
        "isHidden": true
      }
    ]
  },
  {
    "title": "Kth Largest Element in an Array",
    "slug": "kth-largest-element-in-an-array",
    "platform": "LEETCODE",
    "difficulty": "Medium",
    "topic": "Heap / Priority Queue",
    "tags": [
      "array",
      "divide-and-conquer",
      "sorting",
      "heap",
      "quickselect"
    ],
    "canonicalUrl": "https://leetcode.com/problems/kth-largest-element-in-an-array/",
    "estimatedMinutes": 20,
    "description": "Given an integer array nums and an integer k, return the kth largest element in the array. Note that it is the kth largest element in the sorted order, not the kth distinct element.",
    "entryFunctionName": "findKthLargest",
    "companyTags": [
      "Amazon",
      "Meta",
      "Google",
      "Microsoft",
      "Apple"
    ],
    "starterCode": {
      "javascript": "/**\n * @param {number[]} nums\n * @param {number} k\n * @return {number}\n */\nfunction findKthLargest(nums, k) {\n  // Write your solution here\n  \n}",
      "python": "class Solution:\n    def findKthLargest(self, nums: list[int], k: int) -> int:\n        # Write your solution here\n        pass",
      "java": "import java.util.*;\n\nclass Solution {\n    public int findKthLargest(int[] nums, int k) {\n        // Write your solution here\n        return 0;\n    }\n}",
      "cpp": "#include <vector>\n#include <queue>\nusing namespace std;\n\nclass Solution {\npublic:\n    int findKthLargest(vector<int>& nums, int k) {\n        // Write your solution here\n        return 0;\n    }\n};",
      "c": "#include <stdlib.h>\n\nint findKthLargest(int* nums, int numsSize, int k) {\n    // Write your solution here\n    return 0;\n}"
    },
    "testCases": [
      {
        "id": "tc-1",
        "input": "nums = [3,2,1,5,6,4], k = 2",
        "expectedOutput": "5"
      },
      {
        "id": "tc-2",
        "input": "nums = [3,2,3,1,2,4,5,5,6], k = 4",
        "expectedOutput": "4"
      },
      {
        "id": "tc-3",
        "input": "nums = [1], k = 1",
        "expectedOutput": "1",
        "isHidden": true
      }
    ]
  },
  {
    "title": "Last Stone Weight",
    "slug": "last-stone-weight",
    "platform": "LEETCODE",
    "difficulty": "Easy",
    "topic": "Heap / Priority Queue",
    "tags": [
      "array",
      "heap"
    ],
    "canonicalUrl": "https://leetcode.com/problems/last-stone-weight/",
    "estimatedMinutes": 15,
    "description": "You are given an array of integers stones where stones[i] is the weight of the ith stone. We are playing a game with the stones. On each turn, we choose the heaviest two stones with weights x and y with x <= y. The result of this smash is: if x == y, both stones are destroyed; if x != y, the stone of weight x is destroyed, and the stone of weight y has new weight y - x. At the end of the game, there is at most one stone left. Return the weight of the last remaining stone. If there are no stones left, return 0.",
    "entryFunctionName": "lastStoneWeight",
    "companyTags": [
      "Amazon"
    ],
    "starterCode": {
      "javascript": "function lastStoneWeight(stones) {\n  // Write your solution here\n  \n}",
      "python": "class Solution:\n    def lastStoneWeight(self, stones: list[int]) -> int:\n        # Write your solution here\n        pass",
      "java": "import java.util.*;\n\nclass Solution {\n    public int lastStoneWeight(int[] stones) {\n        // Write your solution here\n        return 0;\n    }\n}",
      "cpp": "#include <vector>\n#include <queue>\nusing namespace std;\n\nclass Solution {\npublic:\n    int lastStoneWeight(vector<int>& stones) {\n        // Write your solution here\n        return 0;\n    }\n};",
      "c": "int lastStoneWeight(int* stones, int stonesSize) {\n    // Write your solution here\n    return 0;\n}"
    },
    "testCases": [
      {
        "id": "tc-1",
        "input": "stones = [2,7,4,1,8,1]",
        "expectedOutput": "1"
      },
      {
        "id": "tc-2",
        "input": "stones = [1]",
        "expectedOutput": "1"
      }
    ]
  },
  {
    "title": "K Closest Points to Origin",
    "slug": "k-closest-points-to-origin",
    "platform": "LEETCODE",
    "difficulty": "Medium",
    "topic": "Heap / Priority Queue",
    "tags": [
      "array",
      "math",
      "divide-and-conquer",
      "geometry",
      "sorting",
      "heap"
    ],
    "canonicalUrl": "https://leetcode.com/problems/k-closest-points-to-origin/",
    "estimatedMinutes": 20,
    "description": "Given an array of points where points[i] = [xi, yi] represents a point on the X-Y plane and an integer k, return the k closest points to the origin (0, 0). The distance between two points on the X-Y plane is the Euclidean distance (sqrt((x1 - x2)^2 + (y1 - y2)^2)). You may return the answer in any order.",
    "entryFunctionName": "kClosest",
    "companyTags": [
      "Meta",
      "Amazon",
      "Google"
    ],
    "starterCode": {
      "javascript": "function kClosest(points, k) {\n  // Write your solution here\n  \n}",
      "python": "class Solution:\n    def kClosest(self, points: list[list[int]], k: int) -> list[list[int]]:\n        # Write your solution here\n        pass",
      "java": "import java.util.*;\n\nclass Solution {\n    public int[][] kClosest(int[][] points, int k) {\n        // Write your solution here\n        return new int[][]{};\n    }\n}",
      "cpp": "#include <vector>\n#include <queue>\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<vector<int>> kClosest(vector<vector<int>>& points, int k) {\n        // Write your solution here\n        return {};\n    }\n};",
      "c": "int** kClosest(int** points, int pointsSize, int* pointsColSize, int k, int* returnSize, int** returnColumnSizes) {\n    // Write your solution here\n    *returnSize = k;\n    return NULL;\n}"
    },
    "testCases": [
      {
        "id": "tc-1",
        "input": "points = [[1,3],[-2,2]], k = 1",
        "expectedOutput": "[[-2, 2]]"
      },
      {
        "id": "tc-2",
        "input": "points = [[3,3],[5,-1],[-2,4]], k = 2",
        "expectedOutput": "[[3, 3], [-2, 4]]"
      }
    ]
  },
  {
    "title": "Subsets",
    "slug": "subsets",
    "platform": "LEETCODE",
    "difficulty": "Medium",
    "topic": "Backtracking",
    "tags": [
      "array",
      "backtracking",
      "bit-manipulation"
    ],
    "canonicalUrl": "https://leetcode.com/problems/subsets/",
    "estimatedMinutes": 20,
    "description": "Given an integer array nums of unique elements, return all possible subsets (the power set). The solution set must not contain duplicate subsets. Return the solution in any order.",
    "entryFunctionName": "subsets",
    "companyTags": [
      "Meta",
      "Amazon",
      "Google",
      "Microsoft"
    ],
    "starterCode": {
      "javascript": "/**\n * @param {number[]} nums\n * @return {number[][]}\n */\nfunction subsets(nums) {\n  // Write your solution here\n  \n}",
      "python": "class Solution:\n    def subsets(self, nums: list[int]) -> list[list[int]]:\n        # Write your solution here\n        pass",
      "java": "import java.util.*;\n\nclass Solution {\n    public List<List<Integer>> subsets(int[] nums) {\n        // Write your solution here\n        return new ArrayList<>();\n    }\n}",
      "cpp": "#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<vector<int>> subsets(vector<int>& nums) {\n        // Write your solution here\n        return {};\n    }\n};",
      "c": "int** subsets(int* nums, int numsSize, int* returnSize, int** returnColumnSizes) {\n    // Write your solution here\n    *returnSize = 0;\n    return NULL;\n}"
    },
    "testCases": [
      {
        "id": "tc-1",
        "input": "nums = [1,2,3]",
        "expectedOutput": "[[], [1], [2], [1, 2], [3], [1, 3], [2, 3], [1, 2, 3]]"
      },
      {
        "id": "tc-2",
        "input": "nums = [0]",
        "expectedOutput": "[[], [0]]"
      }
    ]
  },
  {
    "title": "Combination Sum",
    "slug": "combination-sum",
    "platform": "LEETCODE",
    "difficulty": "Medium",
    "topic": "Backtracking",
    "tags": [
      "array",
      "backtracking"
    ],
    "canonicalUrl": "https://leetcode.com/problems/combination-sum/",
    "estimatedMinutes": 25,
    "description": "Given an array of distinct integers candidates and a target integer target, return a list of all unique combinations of candidates where the chosen numbers sum to target. You may return the combinations in any order.",
    "entryFunctionName": "combinationSum",
    "companyTags": [
      "Amazon",
      "Meta",
      "Airbnb",
      "Google"
    ],
    "starterCode": {
      "javascript": "/**\n * @param {number[]} candidates\n * @param {number} target\n * @return {number[][]}\n */\nfunction combinationSum(candidates, target) {\n  // Write your solution here\n  \n}",
      "python": "class Solution:\n    def combinationSum(self, candidates: list[int], target: int) -> list[list[int]]:\n        # Write your solution here\n        pass",
      "java": "import java.util.*;\n\nclass Solution {\n    public List<List<Integer>> combinationSum(int[] candidates, int target) {\n        // Write your solution here\n        return new ArrayList<>();\n    }\n}",
      "cpp": "#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<vector<int>> combinationSum(vector<int>& candidates, int target) {\n        // Write your solution here\n        return {};\n    }\n};",
      "c": "int** combinationSum(int* candidates, int candidatesSize, int target, int* returnSize, int** returnColumnSizes) {\n    // Write your solution here\n    *returnSize = 0;\n    return NULL;\n}"
    },
    "testCases": [
      {
        "id": "tc-1",
        "input": "candidates = [2,3,6,7], target = 7",
        "expectedOutput": "[[2, 2, 3], [7]]"
      },
      {
        "id": "tc-2",
        "input": "candidates = [2,3,5], target = 8",
        "expectedOutput": "[[2, 2, 2, 2], [2, 3, 3], [3, 5]]"
      },
      {
        "id": "tc-3",
        "input": "candidates = [2], target = 1",
        "expectedOutput": "[]"
      }
    ]
  },
  {
    "title": "Generate Parentheses",
    "slug": "generate-parentheses",
    "platform": "LEETCODE",
    "difficulty": "Medium",
    "topic": "Backtracking",
    "tags": [
      "string",
      "dynamic-programming",
      "backtracking"
    ],
    "canonicalUrl": "https://leetcode.com/problems/generate-parentheses/",
    "estimatedMinutes": 20,
    "description": "Given n pairs of parentheses, write a function to generate all combinations of well-formed parentheses.",
    "entryFunctionName": "generateParenthesis",
    "companyTags": [
      "Amazon",
      "Meta",
      "Microsoft",
      "Google"
    ],
    "starterCode": {
      "javascript": "/**\n * @param {number} n\n * @return {string[]}\n */\nfunction generateParenthesis(n) {\n  // Write your solution here\n  \n}",
      "python": "class Solution:\n    def generateParenthesis(self, n: int) -> list[str]:\n        # Write your solution here\n        pass",
      "java": "import java.util.*;\n\nclass Solution {\n    public List<String> generateParenthesis(int n) {\n        // Write your solution here\n        return new ArrayList<>();\n    }\n}",
      "cpp": "#include <vector>\n#include <string>\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<string> generateParenthesis(int n) {\n        // Write your solution here\n        return {};\n    }\n};",
      "c": "char** generateParenthesis(int n, int* returnSize) {\n    // Write your solution here\n    *returnSize = 0;\n    return NULL;\n}"
    },
    "testCases": [
      {
        "id": "tc-1",
        "input": "n = 3",
        "expectedOutput": "[\"((()))\", \"(()())\", \"(())()\", \"()(())\", \"()()()\"]"
      },
      {
        "id": "tc-2",
        "input": "n = 1",
        "expectedOutput": "[\"()\"]"
      }
    ]
  },
  {
    "title": "Climbing Stairs",
    "slug": "climbing-stairs",
    "platform": "LEETCODE",
    "difficulty": "Easy",
    "topic": "Dynamic Programming",
    "tags": [
      "math",
      "dynamic-programming",
      "memoization"
    ],
    "canonicalUrl": "https://leetcode.com/problems/climbing-stairs/",
    "estimatedMinutes": 10,
    "description": "You are climbing a staircase. It takes n steps to reach the top. Each time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?",
    "entryFunctionName": "climbStairs",
    "companyTags": [
      "Amazon",
      "Google",
      "Adobe",
      "Apple"
    ],
    "starterCode": {
      "javascript": "/**\n * @param {number} n\n * @return {number}\n */\nfunction climbStairs(n) {\n  // Write your solution here\n  \n}",
      "python": "class Solution:\n    def climbStairs(self, n: int) -> int:\n        # Write your solution here\n        pass",
      "java": "class Solution {\n    public int climbStairs(int n) {\n        // Write your solution here\n        return 0;\n    }\n}",
      "cpp": "class Solution {\npublic:\n    int climbStairs(int n) {\n        // Write your solution here\n        return 0;\n    }\n};",
      "c": "int climbStairs(int n) {\n    // Write your solution here\n    return 0;\n}"
    },
    "testCases": [
      {
        "id": "tc-1",
        "input": "n = 2",
        "expectedOutput": "2"
      },
      {
        "id": "tc-2",
        "input": "n = 3",
        "expectedOutput": "3"
      },
      {
        "id": "tc-3",
        "input": "n = 5",
        "expectedOutput": "8"
      },
      {
        "id": "tc-4",
        "input": "n = 1",
        "expectedOutput": "1",
        "isHidden": true
      }
    ]
  },
  {
    "title": "House Robber",
    "slug": "house-robber",
    "platform": "LEETCODE",
    "difficulty": "Medium",
    "topic": "Dynamic Programming",
    "tags": [
      "array",
      "dynamic-programming"
    ],
    "canonicalUrl": "https://leetcode.com/problems/house-robber/",
    "estimatedMinutes": 20,
    "description": "You are a professional robber planning to rob houses along a street. Each house has a certain amount of money stashed. Adjacent houses have security systems connected and it will automatically contact the police if two adjacent houses were broken into on the same night. Return the maximum amount of money you can rob tonight without alerting the police.",
    "entryFunctionName": "rob",
    "companyTags": [
      "Amazon",
      "Microsoft",
      "Google",
      "Meta"
    ],
    "starterCode": {
      "javascript": "/**\n * @param {number[]} nums\n * @return {number}\n */\nfunction rob(nums) {\n  // Write your solution here\n  \n}",
      "python": "class Solution:\n    def rob(self, nums: list[int]) -> int:\n        # Write your solution here\n        pass",
      "java": "class Solution {\n    public int rob(int[] nums) {\n        // Write your solution here\n        return 0;\n    }\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int rob(vector<int>& nums) {\n        // Write your solution here\n        return 0;\n    }\n};",
      "c": "int rob(int* nums, int numsSize) {\n    // Write your solution here\n    return 0;\n}"
    },
    "testCases": [
      {
        "id": "tc-1",
        "input": "nums = [1,2,3,1]",
        "expectedOutput": "4"
      },
      {
        "id": "tc-2",
        "input": "nums = [2,7,9,3,1]",
        "expectedOutput": "12"
      },
      {
        "id": "tc-3",
        "input": "nums = [2,1,1,2]",
        "expectedOutput": "4",
        "isHidden": true
      }
    ]
  },
  {
    "title": "House Robber II",
    "slug": "house-robber-ii",
    "platform": "LEETCODE",
    "difficulty": "Medium",
    "topic": "Dynamic Programming",
    "tags": [
      "array",
      "dynamic-programming"
    ],
    "canonicalUrl": "https://leetcode.com/problems/house-robber-ii/",
    "estimatedMinutes": 25,
    "description": "You are a professional robber planning to rob houses along a street. All houses at this place are arranged in a circle. That means the first house is the neighbor of the last one. Adjacent houses have security systems connected. Return the maximum amount of money you can rob tonight without alerting the police.",
    "entryFunctionName": "rob",
    "companyTags": [
      "Amazon",
      "Microsoft",
      "Google"
    ],
    "starterCode": {
      "javascript": "function rob(nums) {\n  // Write your solution here\n  \n}",
      "python": "class Solution:\n    def rob(self, nums: list[int]) -> int:\n        # Write your solution here\n        pass",
      "java": "class Solution {\n    public int rob(int[] nums) {\n        // Write your solution here\n        return 0;\n    }\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int rob(vector<int>& nums) {\n        // Write your solution here\n        return 0;\n    }\n};",
      "c": "int rob(int* nums, int numsSize) {\n    // Write your solution here\n    return 0;\n}"
    },
    "testCases": [
      {
        "id": "tc-1",
        "input": "nums = [2,3,2]",
        "expectedOutput": "3"
      },
      {
        "id": "tc-2",
        "input": "nums = [1,2,3,1]",
        "expectedOutput": "4"
      },
      {
        "id": "tc-3",
        "input": "nums = [1,2,3]",
        "expectedOutput": "3"
      }
    ]
  },
  {
    "title": "Coin Change",
    "slug": "coin-change",
    "platform": "LEETCODE",
    "difficulty": "Medium",
    "topic": "Dynamic Programming",
    "tags": [
      "array",
      "dynamic-programming",
      "breadth-first-search"
    ],
    "canonicalUrl": "https://leetcode.com/problems/coin-change/",
    "estimatedMinutes": 25,
    "description": "You are given an integer array coins representing coins of different denominations and an integer amount representing a total amount of money. Return the fewest number of coins that you need to make up that amount. If that amount of money cannot be made up by any combination of the coins, return -1.",
    "entryFunctionName": "coinChange",
    "companyTags": [
      "Amazon",
      "Meta",
      "Microsoft",
      "Bloomberg"
    ],
    "starterCode": {
      "javascript": "/**\n * @param {number[]} coins\n * @param {number} amount\n * @return {number}\n */\nfunction coinChange(coins, amount) {\n  // Write your solution here\n  \n}",
      "python": "class Solution:\n    def coinChange(self, coins: list[int], amount: int) -> int:\n        # Write your solution here\n        pass",
      "java": "import java.util.*;\n\nclass Solution {\n    public int coinChange(int[] coins, int amount) {\n        // Write your solution here\n        return -1;\n    }\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int coinChange(vector<int>& coins, int amount) {\n        // Write your solution here\n        return -1;\n    }\n};",
      "c": "int coinChange(int* coins, int coinsSize, int amount) {\n    // Write your solution here\n    return -1;\n}"
    },
    "testCases": [
      {
        "id": "tc-1",
        "input": "coins = [1,2,5], amount = 11",
        "expectedOutput": "3"
      },
      {
        "id": "tc-2",
        "input": "coins = [2], amount = 3",
        "expectedOutput": "-1"
      },
      {
        "id": "tc-3",
        "input": "coins = [1], amount = 0",
        "expectedOutput": "0"
      }
    ]
  },
  {
    "title": "Longest Increasing Subsequence",
    "slug": "longest-increasing-subsequence",
    "platform": "LEETCODE",
    "difficulty": "Medium",
    "topic": "Dynamic Programming",
    "tags": [
      "array",
      "binary-search",
      "dynamic-programming"
    ],
    "canonicalUrl": "https://leetcode.com/problems/longest-increasing-subsequence/",
    "estimatedMinutes": 25,
    "description": "Given an integer array nums, return the length of the longest strictly increasing subsequence.",
    "entryFunctionName": "lengthOfLIS",
    "companyTags": [
      "Google",
      "Amazon",
      "Microsoft",
      "Apple"
    ],
    "starterCode": {
      "javascript": "/**\n * @param {number[]} nums\n * @return {number}\n */\nfunction lengthOfLIS(nums) {\n  // Write your solution here\n  \n}",
      "python": "class Solution:\n    def lengthOfLIS(self, nums: list[int]) -> int:\n        # Write your solution here\n        pass",
      "java": "import java.util.*;\n\nclass Solution {\n    public int lengthOfLIS(int[] nums) {\n        // Write your solution here\n        return 0;\n    }\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int lengthOfLIS(vector<int>& nums) {\n        // Write your solution here\n        return 0;\n    }\n};",
      "c": "int lengthOfLIS(int* nums, int numsSize) {\n    // Write your solution here\n    return 0;\n}"
    },
    "testCases": [
      {
        "id": "tc-1",
        "input": "nums = [10,9,2,5,3,7,101,18]",
        "expectedOutput": "4"
      },
      {
        "id": "tc-2",
        "input": "nums = [0,1,0,3,2,3]",
        "expectedOutput": "4"
      },
      {
        "id": "tc-3",
        "input": "nums = [7,7,7,7,7,7,7]",
        "expectedOutput": "1"
      }
    ]
  },
  {
    "title": "0/1 Knapsack Problem",
    "slug": "0-1-knapsack-problem",
    "platform": "GEEKSFORGEEKS",
    "difficulty": "Medium",
    "topic": "Dynamic Programming",
    "tags": [
      "dynamic-programming",
      "knapsack"
    ],
    "canonicalUrl": "https://www.geeksforgeeks.org/problems/0-1-knapsack-problem0945/1",
    "estimatedMinutes": 25,
    "description": "You are given weights and values of N items, put these items in a knapsack of capacity W to get the maximum total value in the knapsack.",
    "entryFunctionName": "knapSack",
    "companyTags": [
      "Amazon",
      "Paytm",
      "Flipkart"
    ],
    "starterCode": {
      "javascript": "function knapSack(W, wt, val, n) {\n  // Write your solution here\n  \n}",
      "python": "class Solution:\n    def knapSack(self, W: int, wt: list[int], val: list[int], n: int) -> int:\n        # Write your solution here\n        pass",
      "java": "class Solution {\n    public int knapSack(int W, int[] wt, int[] val, int n) {\n        // Write your solution here\n        return 0;\n    }\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int knapSack(int W, vector<int>& wt, vector<int>& val, int n) {\n        // Write your solution here\n        return 0;\n    }\n};",
      "c": "int knapSack(int W, int* wt, int* val, int n) {\n    // Write your solution here\n    return 0;\n}"
    },
    "testCases": [
      {
        "id": "tc-1",
        "input": "W = 4, wt = [4, 5, 1], val = [1, 2, 3], n = 3",
        "expectedOutput": "3"
      },
      {
        "id": "tc-2",
        "input": "W = 3, wt = [4, 5, 6], val = [1, 2, 3], n = 3",
        "expectedOutput": "0"
      }
    ]
  },
  {
    "title": "Unique Paths",
    "slug": "unique-paths",
    "platform": "LEETCODE",
    "difficulty": "Medium",
    "topic": "Dynamic Programming",
    "tags": [
      "math",
      "dynamic-programming",
      "combinatorics"
    ],
    "canonicalUrl": "https://leetcode.com/problems/unique-paths/",
    "estimatedMinutes": 20,
    "description": "There is a robot on an m x n grid. The robot is initially located at the top-left corner (i.e., grid[0][0]). The robot tries to move to the bottom-right corner (i.e., grid[m - 1][n - 1]). The robot can only move either down or right at any point in time. Given the two integers m and n, return the number of possible unique paths that the robot can take to reach the bottom-right corner.",
    "entryFunctionName": "uniquePaths",
    "companyTags": [
      "Google",
      "Amazon",
      "Meta"
    ],
    "starterCode": {
      "javascript": "/**\n * @param {number} m\n * @param {number} n\n * @return {number}\n */\nfunction uniquePaths(m, n) {\n  // Write your solution here\n  \n}",
      "python": "class Solution:\n    def uniquePaths(self, m: int, n: int) -> int:\n        # Write your solution here\n        pass",
      "java": "class Solution {\n    public int uniquePaths(int m, int n) {\n        // Write your solution here\n        return 0;\n    }\n}",
      "cpp": "#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    int uniquePaths(int m, int n) {\n        // Write your solution here\n        return 0;\n    }\n};",
      "c": "int uniquePaths(int m, int n) {\n    // Write your solution here\n    return 0;\n}"
    },
    "testCases": [
      {
        "id": "tc-1",
        "input": "m = 3, n = 7",
        "expectedOutput": "28"
      },
      {
        "id": "tc-2",
        "input": "m = 3, n = 2",
        "expectedOutput": "3"
      },
      {
        "id": "tc-3",
        "input": "m = 1, n = 1",
        "expectedOutput": "1",
        "isHidden": true
      }
    ]
  },
  {
    "title": "Longest Common Subsequence",
    "slug": "longest-common-subsequence",
    "platform": "LEETCODE",
    "difficulty": "Medium",
    "topic": "Dynamic Programming",
    "tags": [
      "string",
      "dynamic-programming"
    ],
    "canonicalUrl": "https://leetcode.com/problems/longest-common-subsequence/",
    "estimatedMinutes": 25,
    "description": "Given two strings text1 and text2, return the length of their longest common subsequence. If there is no common subsequence, return 0.",
    "entryFunctionName": "longestCommonSubsequence",
    "companyTags": [
      "Amazon",
      "Microsoft",
      "Google"
    ],
    "starterCode": {
      "javascript": "function longestCommonSubsequence(text1, text2) {\n  // Write your solution here\n  \n}",
      "python": "class Solution:\n    def longestCommonSubsequence(self, text1: str, text2: str) -> int:\n        # Write your solution here\n        pass",
      "java": "class Solution {\n    public int longestCommonSubsequence(String text1, String text2) {\n        // Write your solution here\n        return 0;\n    }\n}",
      "cpp": "#include <string>\n#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int longestCommonSubsequence(string text1, string text2) {\n        // Write your solution here\n        return 0;\n    }\n};",
      "c": "int longestCommonSubsequence(char* text1, char* text2) {\n    // Write your solution here\n    return 0;\n}"
    },
    "testCases": [
      {
        "id": "tc-1",
        "input": "text1 = \"abcde\", text2 = \"ace\"",
        "expectedOutput": "3"
      },
      {
        "id": "tc-2",
        "input": "text1 = \"abc\", text2 = \"abc\"",
        "expectedOutput": "3"
      },
      {
        "id": "tc-3",
        "input": "text1 = \"abc\", text2 = \"def\"",
        "expectedOutput": "0"
      }
    ]
  },
  {
    "title": "Word Break",
    "slug": "word-break",
    "platform": "LEETCODE",
    "difficulty": "Medium",
    "topic": "Dynamic Programming",
    "tags": [
      "hash-table",
      "string",
      "dynamic-programming",
      "trie",
      "memoization"
    ],
    "canonicalUrl": "https://leetcode.com/problems/word-break/",
    "estimatedMinutes": 25,
    "description": "Given a string s and a dictionary of strings wordDict, return true if s can be segmented into a space-separated sequence of one or more dictionary words.",
    "entryFunctionName": "wordBreak",
    "companyTags": [
      "Amazon",
      "Meta",
      "Bloomberg",
      "Google"
    ],
    "starterCode": {
      "javascript": "function wordBreak(s, wordDict) {\n  // Write your solution here\n  \n}",
      "python": "class Solution:\n    def wordBreak(self, s: str, wordDict: list[str]) -> bool:\n        # Write your solution here\n        pass",
      "java": "import java.util.*;\n\nclass Solution {\n    public boolean wordBreak(String s, List<String> wordDict) {\n        // Write your solution here\n        return false;\n    }\n}",
      "cpp": "#include <string>\n#include <vector>\n#include <unordered_set>\nusing namespace std;\n\nclass Solution {\npublic:\n    bool wordBreak(string s, vector<string>& wordDict) {\n        // Write your solution here\n        return false;\n    }\n};",
      "c": "#include <stdbool.h>\n\nbool wordBreak(char* s, char** wordDict, int wordDictSize) {\n    // Write your solution here\n    return false;\n}"
    },
    "testCases": [
      {
        "id": "tc-1",
        "input": "s = \"leetcode\", wordDict = [\"leet\",\"code\"]",
        "expectedOutput": "true"
      },
      {
        "id": "tc-2",
        "input": "s = \"applepenapple\", wordDict = [\"apple\",\"pen\"]",
        "expectedOutput": "true"
      },
      {
        "id": "tc-3",
        "input": "s = \"catsandog\", wordDict = [\"cats\",\"dog\",\"sand\",\"and\",\"cat\"]",
        "expectedOutput": "false"
      }
    ]
  },
  {
    "title": "Jump Game",
    "slug": "jump-game",
    "platform": "LEETCODE",
    "difficulty": "Medium",
    "topic": "Dynamic Programming",
    "tags": [
      "array",
      "dynamic-programming",
      "greedy"
    ],
    "canonicalUrl": "https://leetcode.com/problems/jump-game/",
    "estimatedMinutes": 20,
    "description": "You are given an integer array nums. You are initially positioned at the array's first index, and each element in the array represents your maximum jump length at that position. Return true if you can reach the last index, or false otherwise.",
    "entryFunctionName": "canJump",
    "companyTags": [
      "Amazon",
      "Microsoft",
      "Google"
    ],
    "starterCode": {
      "javascript": "function canJump(nums) {\n  // Write your solution here\n  \n}",
      "python": "class Solution:\n    def canJump(self, nums: list[int]) -> bool:\n        # Write your solution here\n        pass",
      "java": "class Solution {\n    public boolean canJump(int[] nums) {\n        // Write your solution here\n        return false;\n    }\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    bool canJump(vector<int>& nums) {\n        // Write your solution here\n        return false;\n    }\n};",
      "c": "#include <stdbool.h>\n\nbool canJump(int* nums, int numsSize) {\n    // Write your solution here\n    return false;\n}"
    },
    "testCases": [
      {
        "id": "tc-1",
        "input": "nums = [2,3,1,1,4]",
        "expectedOutput": "true"
      },
      {
        "id": "tc-2",
        "input": "nums = [3,2,1,0,4]",
        "expectedOutput": "false"
      }
    ]
  },
  {
    "title": "Edit Distance",
    "slug": "edit-distance",
    "platform": "LEETCODE",
    "difficulty": "Medium",
    "topic": "Dynamic Programming",
    "tags": [
      "string",
      "dynamic-programming"
    ],
    "canonicalUrl": "https://leetcode.com/problems/edit-distance/",
    "estimatedMinutes": 30,
    "description": "Given two strings word1 and word2, return the minimum number of operations required to convert word1 to word2. You have the following three operations permitted on a word: insert a character, delete a character, replace a character.",
    "entryFunctionName": "minDistance",
    "companyTags": [
      "Google",
      "Amazon",
      "Microsoft"
    ],
    "starterCode": {
      "javascript": "function minDistance(word1, word2) {\n  // Write your solution here\n  \n}",
      "python": "class Solution:\n    def minDistance(self, word1: str, word2: str) -> int:\n        # Write your solution here\n        pass",
      "java": "class Solution {\n    public int minDistance(String word1, String word2) {\n        // Write your solution here\n        return 0;\n    }\n}",
      "cpp": "#include <string>\n#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int minDistance(string word1, string word2) {\n        // Write your solution here\n        return 0;\n    }\n};",
      "c": "int minDistance(char* word1, char* word2) {\n    // Write your solution here\n    return 0;\n}"
    },
    "testCases": [
      {
        "id": "tc-1",
        "input": "word1 = \"horse\", word2 = \"ros\"",
        "expectedOutput": "3"
      },
      {
        "id": "tc-2",
        "input": "word1 = \"intention\", word2 = \"execution\"",
        "expectedOutput": "5"
      }
    ]
  },
  {
    "title": "Decode Ways",
    "slug": "decode-ways",
    "platform": "LEETCODE",
    "difficulty": "Medium",
    "topic": "Dynamic Programming",
    "tags": [
      "string",
      "dynamic-programming"
    ],
    "canonicalUrl": "https://leetcode.com/problems/decode-ways/",
    "estimatedMinutes": 20,
    "description": "A message containing letters from A-Z can be encoded into numbers using the mapping 'A' -> \"1\", 'B' -> \"2\", ... 'Z' -> \"26\". Given a string s containing only digits, return the number of ways to decode it.",
    "entryFunctionName": "numDecodings",
    "companyTags": [
      "Meta",
      "Amazon",
      "Google"
    ],
    "starterCode": {
      "javascript": "function numDecodings(s) {\n  // Write your solution here\n  \n}",
      "python": "class Solution:\n    def numDecodings(self, s: str) -> int:\n        # Write your solution here\n        pass",
      "java": "class Solution {\n    public int numDecodings(String s) {\n        // Write your solution here\n        return 0;\n    }\n}",
      "cpp": "#include <string>\n#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    int numDecodings(string s) {\n        // Write your solution here\n        return 0;\n    }\n};",
      "c": "int numDecodings(char* s) {\n    // Write your solution here\n    return 0;\n}"
    },
    "testCases": [
      {
        "id": "tc-1",
        "input": "s = \"12\"",
        "expectedOutput": "2"
      },
      {
        "id": "tc-2",
        "input": "s = \"226\"",
        "expectedOutput": "3"
      },
      {
        "id": "tc-3",
        "input": "s = \"06\"",
        "expectedOutput": "0"
      }
    ]
  },
  {
    "title": "Partition Equal Subset Sum",
    "slug": "partition-equal-subset-sum",
    "platform": "LEETCODE",
    "difficulty": "Medium",
    "topic": "Dynamic Programming",
    "tags": [
      "array",
      "dynamic-programming"
    ],
    "canonicalUrl": "https://leetcode.com/problems/partition-equal-subset-sum/",
    "estimatedMinutes": 25,
    "description": "Given an integer array nums, return true if you can partition the array into two subsets such that the sum of the elements in both subsets is equal or false otherwise.",
    "entryFunctionName": "canPartition",
    "companyTags": [
      "Amazon",
      "Meta"
    ],
    "starterCode": {
      "javascript": "function canPartition(nums) {\n  // Write your solution here\n  \n}",
      "python": "class Solution:\n    def canPartition(self, nums: list[int]) -> bool:\n        # Write your solution here\n        pass",
      "java": "class Solution {\n    public boolean canPartition(int[] nums) {\n        // Write your solution here\n        return false;\n    }\n}",
      "cpp": "#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    bool canPartition(vector<int>& nums) {\n        // Write your solution here\n        return false;\n    }\n};",
      "c": "#include <stdbool.h>\n\nbool canPartition(int* nums, int numsSize) {\n    // Write your solution here\n    return false;\n}"
    },
    "testCases": [
      {
        "id": "tc-1",
        "input": "nums = [1,5,11,5]",
        "expectedOutput": "true"
      },
      {
        "id": "tc-2",
        "input": "nums = [1,2,3,5]",
        "expectedOutput": "false"
      }
    ]
  },
  {
    "title": "Gas Station",
    "slug": "gas-station",
    "platform": "LEETCODE",
    "difficulty": "Medium",
    "topic": "Greedy",
    "tags": [
      "array",
      "greedy"
    ],
    "canonicalUrl": "https://leetcode.com/problems/gas-station/",
    "estimatedMinutes": 20,
    "description": "There are n gas stations along a circular route, where the amount of gas at the ith station is gas[i]. You have a car with an unlimited gas tank and it costs cost[i] of gas to travel from the ith station to its next (i + 1)th station. You begin the journey with an empty tank at one of the gas stations. Return the starting gas station index if you can travel around the circuit once in the clockwise direction, otherwise return -1.",
    "entryFunctionName": "canCompleteCircuit",
    "companyTags": [
      "Amazon",
      "Google",
      "Microsoft"
    ],
    "starterCode": {
      "javascript": "function canCompleteCircuit(gas, cost) {\n  // Write your solution here\n  \n}",
      "python": "class Solution:\n    def canCompleteCircuit(self, gas: list[int], cost: list[int]) -> int:\n        # Write your solution here\n        pass",
      "java": "class Solution {\n    public int canCompleteCircuit(int[] gas, int[] cost) {\n        // Write your solution here\n        return -1;\n    }\n}",
      "cpp": "#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    int canCompleteCircuit(vector<int>& gas, vector<int>& cost) {\n        // Write your solution here\n        return -1;\n    }\n};",
      "c": "int canCompleteCircuit(int* gas, int gasSize, int* cost, int costSize) {\n    // Write your solution here\n    return -1;\n}"
    },
    "testCases": [
      {
        "id": "tc-1",
        "input": "gas = [1,2,3,4,5], cost = [3,4,5,1,2]",
        "expectedOutput": "3"
      },
      {
        "id": "tc-2",
        "input": "gas = [2,3,4], cost = [3,4,3]",
        "expectedOutput": "-1"
      }
    ]
  },
  {
    "title": "Maximum Subarray (Kadane)",
    "slug": "kadanes-algorithm-gfg",
    "platform": "GEEKSFORGEEKS",
    "difficulty": "Medium",
    "topic": "Greedy",
    "tags": [
      "arrays",
      "dynamic-programming"
    ],
    "canonicalUrl": "https://www.geeksforgeeks.org/problems/kadanes-algorithm-1587115620/1",
    "estimatedMinutes": 15,
    "description": "Given an integer array arr[]. You need to find the maximum sum of a contiguous subarray.",
    "entryFunctionName": "maxSubarraySum",
    "companyTags": [
      "Samsung",
      "Amazon",
      "Flipkart"
    ],
    "starterCode": {
      "javascript": "function maxSubarraySum(arr) {\n  // Write your solution here\n  \n}",
      "python": "class Solution:\n    def maxSubarraySum(self, arr: list[int]) -> int:\n        # Write your solution here\n        pass",
      "java": "class Solution {\n    public int maxSubarraySum(int[] arr) {\n        // Write your solution here\n        return 0;\n    }\n}",
      "cpp": "#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    int maxSubarraySum(vector<int>& arr) {\n        // Write your solution here\n        return 0;\n    }\n};",
      "c": "int maxSubarraySum(int* arr, int arrSize) {\n    // Write your solution here\n    return 0;\n}"
    },
    "testCases": [
      {
        "id": "tc-1",
        "input": "arr = [2, 3, -8, 7, -1, 2, 3]",
        "expectedOutput": "11"
      },
      {
        "id": "tc-2",
        "input": "arr = [-2, -4]",
        "expectedOutput": "-2"
      },
      {
        "id": "tc-3",
        "input": "arr = [5, 4, 1, 7, 8]",
        "expectedOutput": "25"
      }
    ]
  },
  {
    "title": "Number of Islands",
    "slug": "number-of-islands",
    "platform": "LEETCODE",
    "difficulty": "Medium",
    "topic": "Graphs",
    "tags": [
      "array",
      "depth-first-search",
      "breadth-first-search",
      "union-find",
      "matrix"
    ],
    "canonicalUrl": "https://leetcode.com/problems/number-of-islands/",
    "estimatedMinutes": 25,
    "description": "Given an m x n 2D binary grid grid which represents a map of '1's (land) and '0's (water), return the number of islands. An island is surrounded by water and is formed by connecting adjacent lands horizontally or vertically.",
    "entryFunctionName": "numIslands",
    "companyTags": [
      "Amazon",
      "Google",
      "Meta",
      "Microsoft",
      "Bloomberg"
    ],
    "starterCode": {
      "javascript": "/**\n * @param {character[][]} grid\n * @return {number}\n */\nfunction numIslands(grid) {\n  // Write your solution here\n  \n}",
      "python": "class Solution:\n    def numIslands(self, grid: list[list[str]]) -> int:\n        # Write your solution here\n        pass",
      "java": "class Solution {\n    public int numIslands(char[][] grid) {\n        // Write your solution here\n        return 0;\n    }\n}",
      "cpp": "#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    int numIslands(vector<vector<char>>& grid) {\n        // Write your solution here\n        return 0;\n    }\n};",
      "c": "int numIslands(char** grid, int gridSize, int* gridColSize) {\n    // Write your solution here\n    return 0;\n}"
    },
    "testCases": [
      {
        "id": "tc-1",
        "input": "grid = [[\"1\",\"1\",\"1\",\"1\",\"0\"],[\"1\",\"1\",\"0\",\"1\",\"0\"],[\"1\",\"1\",\"0\",\"0\",\"0\"],[\"0\",\"0\",\"0\",\"0\",\"0\"]]",
        "expectedOutput": "1"
      },
      {
        "id": "tc-2",
        "input": "grid = [[\"1\",\"1\",\"0\",\"0\",\"0\"],[\"1\",\"1\",\"0\",\"0\",\"0\"],[\"0\",\"0\",\"1\",\"0\",\"0\"],[\"0\",\"0\",\"0\",\"1\",\"1\"]]",
        "expectedOutput": "3"
      }
    ]
  },
  {
    "title": "Clone Graph",
    "slug": "clone-graph",
    "platform": "LEETCODE",
    "difficulty": "Medium",
    "topic": "Graphs",
    "tags": [
      "hash-table",
      "depth-first-search",
      "breadth-first-search",
      "graph"
    ],
    "canonicalUrl": "https://leetcode.com/problems/clone-graph/",
    "estimatedMinutes": 25,
    "description": "Given a reference of a node in a connected undirected graph, return a deep copy (clone) of the graph.",
    "entryFunctionName": "cloneGraph",
    "companyTags": [
      "Meta",
      "Amazon",
      "Microsoft"
    ],
    "starterCode": {
      "javascript": "function cloneGraph(adjList) {\n  // Write your solution here\n  \n}",
      "python": "class Solution:\n    def cloneGraph(self, adjList: list[list[int]]) -> list[list[int]]:\n        # Write your solution here\n        pass",
      "java": "import java.util.*;\n\nclass Solution {\n    public List<List<Integer>> cloneGraph(List<List<Integer>> adjList) {\n        // Write your solution here\n        return new ArrayList<>();\n    }\n}",
      "cpp": "#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<vector<int>> cloneGraph(vector<vector<int>>& adjList) {\n        // Write your solution here\n        return {};\n    }\n};",
      "c": "int** cloneGraph(int** adjList, int n, int* returnSize, int** returnColumnSizes) {\n    // Write your solution here\n    *returnSize = n;\n    return NULL;\n}"
    },
    "testCases": [
      {
        "id": "tc-1",
        "input": "adjList = [[2,4],[1,3],[2,4],[1,3]]",
        "expectedOutput": "[[2, 4], [1, 3], [2, 4], [1, 3]]"
      },
      {
        "id": "tc-2",
        "input": "adjList = [[]]",
        "expectedOutput": "[[]]"
      },
      {
        "id": "tc-3",
        "input": "adjList = []",
        "expectedOutput": "[]"
      }
    ]
  },
  {
    "title": "Course Schedule",
    "slug": "course-schedule",
    "platform": "LEETCODE",
    "difficulty": "Medium",
    "topic": "Graphs",
    "tags": [
      "depth-first-search",
      "breadth-first-search",
      "graph",
      "topological-sort"
    ],
    "canonicalUrl": "https://leetcode.com/problems/course-schedule/",
    "estimatedMinutes": 25,
    "description": "There are a total of numCourses courses you have to take, labeled from 0 to numCourses - 1. You are given an array prerequisites where prerequisites[i] = [ai, bi] indicates that you must take course bi first if you want to take course ai. Return true if you can finish all courses. Otherwise, return false.",
    "entryFunctionName": "canFinish",
    "companyTags": [
      "Amazon",
      "Google",
      "Meta",
      "Microsoft",
      "Apple"
    ],
    "starterCode": {
      "javascript": "/**\n * @param {number} numCourses\n * @param {number[][]} prerequisites\n * @return {boolean}\n */\nfunction canFinish(numCourses, prerequisites) {\n  // Write your solution here\n  \n}",
      "python": "class Solution:\n    def canFinish(self, numCourses: int, prerequisites: list[list[int]]) -> bool:\n        # Write your solution here\n        pass",
      "java": "import java.util.*;\n\nclass Solution {\n    public boolean canFinish(int numCourses, int[][] prerequisites) {\n        // Write your solution here\n        return false;\n    }\n}",
      "cpp": "#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    bool canFinish(int numCourses, vector<vector<int>>& prerequisites) {\n        // Write your solution here\n        return false;\n    }\n};",
      "c": "#include <stdbool.h>\n\nbool canFinish(int numCourses, int** prerequisites, int prerequisitesSize, int* prerequisitesColSize) {\n    // Write your solution here\n    return false;\n}"
    },
    "testCases": [
      {
        "id": "tc-1",
        "input": "numCourses = 2, prerequisites = [[1,0]]",
        "expectedOutput": "true"
      },
      {
        "id": "tc-2",
        "input": "numCourses = 2, prerequisites = [[1,0],[0,1]]",
        "expectedOutput": "false"
      }
    ]
  },
  {
    "title": "Weird Algorithm",
    "slug": "weird-algorithm-cses",
    "platform": "CSES",
    "difficulty": "Easy",
    "topic": "Mathematical Algorithms",
    "tags": [
      "math",
      "simulation"
    ],
    "canonicalUrl": "https://cses.fi/problemset/task/1068",
    "estimatedMinutes": 10,
    "description": "Consider an algorithm that takes as input a positive integer n. If n is even, the algorithm divides it by two, and if n is odd, the algorithm multiplies it by three and adds one. The algorithm repeats this, until n is one. Return the generated sequence.",
    "entryFunctionName": "weirdAlgorithm",
    "companyTags": [
      "Competitive Programming"
    ],
    "starterCode": {
      "javascript": "function weirdAlgorithm(n) {\n  // Write your solution here\n  \n}",
      "python": "class Solution:\n    def weirdAlgorithm(self, n: int) -> list[int]:\n        # Write your solution here\n        pass",
      "java": "import java.util.*;\n\nclass Solution {\n    public List<Long> weirdAlgorithm(long n) {\n        // Write your solution here\n        return new ArrayList<>();\n    }\n}",
      "cpp": "#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<long long> weirdAlgorithm(long long n) {\n        // Write your solution here\n        return {};\n    }\n};",
      "c": "long long* weirdAlgorithm(long long n, int* returnSize) {\n    // Write your solution here\n    *returnSize = 0;\n    return NULL;\n}"
    },
    "testCases": [
      {
        "id": "tc-1",
        "input": "n = 3",
        "expectedOutput": "[3, 10, 5, 16, 8, 4, 2, 1]"
      },
      {
        "id": "tc-2",
        "input": "n = 1",
        "expectedOutput": "[1]"
      }
    ]
  },
  {
    "title": "Watermelon",
    "slug": "watermelon-codeforces",
    "platform": "CODEFORCES",
    "difficulty": "Easy",
    "topic": "Mathematical Algorithms",
    "tags": [
      "math",
      "brute-force"
    ],
    "canonicalUrl": "https://codeforces.com/problemset/problem/4/A",
    "estimatedMinutes": 5,
    "description": "Pete and Billy bought a watermelon weighing w kilos. They want to divide it into two parts such that each part weighs an even number of kilos. Determine if they can divide the watermelon this way.",
    "entryFunctionName": "canDivideWatermelon",
    "companyTags": [
      "Competitive Programming"
    ],
    "starterCode": {
      "javascript": "function canDivideWatermelon(w) {\n  // Write your solution here\n  \n}",
      "python": "class Solution:\n    def canDivideWatermelon(self, w: int) -> bool:\n        # Write your solution here\n        pass",
      "java": "class Solution {\n    public boolean canDivideWatermelon(int w) {\n        // Write your solution here\n        return false;\n    }\n}",
      "cpp": "class Solution {\npublic:\n    bool canDivideWatermelon(int w) {\n        // Write your solution here\n        return false;\n    }\n};",
      "c": "#include <stdbool.h>\n\nbool canDivideWatermelon(int w) {\n    // Write your solution here\n    return false;\n}"
    },
    "testCases": [
      {
        "id": "tc-1",
        "input": "w = 8",
        "expectedOutput": "true"
      },
      {
        "id": "tc-2",
        "input": "w = 2",
        "expectedOutput": "false"
      },
      {
        "id": "tc-3",
        "input": "w = 10",
        "expectedOutput": "true"
      }
    ]
  },
  {
    "title": "Way Too Long Words",
    "slug": "way-too-long-words-codeforces",
    "platform": "CODEFORCES",
    "difficulty": "Easy",
    "topic": "Strings",
    "tags": [
      "strings"
    ],
    "canonicalUrl": "https://codeforces.com/problemset/problem/71/A",
    "estimatedMinutes": 10,
    "description": "Sometimes some words like \"localization\" or \"internationalization\" are so long that their writing is rather tiresome. Let's consider a word too long if its length is strictly more than 10 characters. All too long words should be replaced with a special abbreviation: first letter, number of letters between first and last, and last letter.",
    "entryFunctionName": "abbreviateWord",
    "companyTags": [
      "Competitive Programming"
    ],
    "starterCode": {
      "javascript": "function abbreviateWord(word) {\n  // Write your solution here\n  \n}",
      "python": "class Solution:\n    def abbreviateWord(self, word: str) -> str:\n        # Write your solution here\n        pass",
      "java": "class Solution {\n    public String abbreviateWord(String word) {\n        // Write your solution here\n        return \"\";\n    }\n}",
      "cpp": "#include <string>\nusing namespace std;\n\nclass Solution {\npublic:\n    string abbreviateWord(string word) {\n        // Write your solution here\n        return \"\";\n    }\n};",
      "c": "char* abbreviateWord(char* word) {\n    // Write your solution here\n    return word;\n}"
    },
    "testCases": [
      {
        "id": "tc-1",
        "input": "word = \"word\"",
        "expectedOutput": "\"word\""
      },
      {
        "id": "tc-2",
        "input": "word = \"localization\"",
        "expectedOutput": "\"l10n\""
      },
      {
        "id": "tc-3",
        "input": "word = \"internationalization\"",
        "expectedOutput": "\"i18n\""
      }
    ]
  },
  {
    "title": "Next Round",
    "slug": "next-round-codeforces",
    "platform": "CODEFORCES",
    "difficulty": "Easy",
    "topic": "Sorting",
    "tags": [
      "arrays",
      "sorting"
    ],
    "canonicalUrl": "https://codeforces.com/problemset/problem/158/A",
    "estimatedMinutes": 10,
    "description": "Contestant who earns a score equal to or greater than the k-th place finisher's score will advance to the next round, as long as the contestant earns a positive score. Calculate how many contestants advance.",
    "entryFunctionName": "nextRound",
    "companyTags": [
      "Competitive Programming"
    ],
    "starterCode": {
      "javascript": "function nextRound(k, scores) {\n  // Write your solution here\n  \n}",
      "python": "class Solution:\n    def nextRound(self, k: int, scores: list[int]) -> int:\n        # Write your solution here\n        pass",
      "java": "class Solution {\n    public int nextRound(int k, int[] scores) {\n        // Write your solution here\n        return 0;\n    }\n}",
      "cpp": "#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    int nextRound(int k, vector<int>& scores) {\n        // Write your solution here\n        return 0;\n    }\n};",
      "c": "int nextRound(int k, int* scores, int scoresSize) {\n    // Write your solution here\n    return 0;\n}"
    },
    "testCases": [
      {
        "id": "tc-1",
        "input": "k = 5, scores = [10, 9, 8, 7, 7, 7, 5, 5]",
        "expectedOutput": "6"
      },
      {
        "id": "tc-2",
        "input": "k = 2, scores = [0, 0, 0, 0]",
        "expectedOutput": "0"
      }
    ]
  },
  {
    "title": "Number of 1 Bits",
    "slug": "number-of-1-bits",
    "platform": "LEETCODE",
    "difficulty": "Easy",
    "topic": "Bit Manipulation",
    "tags": [
      "bit-manipulation",
      "divide-and-conquer"
    ],
    "canonicalUrl": "https://leetcode.com/problems/number-of-1-bits/",
    "estimatedMinutes": 10,
    "description": "Given a positive integer n, write a function that returns the number of set bits it has (also known as the Hamming weight).",
    "entryFunctionName": "hammingWeight",
    "companyTags": [
      "Microsoft",
      "Apple",
      "Amazon"
    ],
    "starterCode": {
      "javascript": "/**\n * @param {number} n\n * @return {number}\n */\nfunction hammingWeight(n) {\n  // Write your solution here\n  \n}",
      "python": "class Solution:\n    def hammingWeight(self, n: int) -> int:\n        # Write your solution here\n        pass",
      "java": "class Solution {\n    public int hammingWeight(int n) {\n        // Write your solution here\n        return 0;\n    }\n}",
      "cpp": "class Solution {\npublic:\n    int hammingWeight(int n) {\n        // Write your solution here\n        return 0;\n    }\n};",
      "c": "int hammingWeight(int n) {\n    // Write your solution here\n    return 0;\n}"
    },
    "testCases": [
      {
        "id": "tc-1",
        "input": "n = 11",
        "expectedOutput": "3"
      },
      {
        "id": "tc-2",
        "input": "n = 128",
        "expectedOutput": "1"
      },
      {
        "id": "tc-3",
        "input": "n = 2147483645",
        "expectedOutput": "30"
      }
    ]
  },
  {
    "title": "Counting Bits",
    "slug": "counting-bits",
    "platform": "LEETCODE",
    "difficulty": "Easy",
    "topic": "Bit Manipulation",
    "tags": [
      "dynamic-programming",
      "bit-manipulation"
    ],
    "canonicalUrl": "https://leetcode.com/problems/counting-bits/",
    "estimatedMinutes": 15,
    "description": "Given an integer n, return an array ans of length n + 1 such that for each i (0 <= i <= n), ans[i] is the number of 1's in the binary representation of i.",
    "entryFunctionName": "countBits",
    "companyTags": [
      "Amazon",
      "Google"
    ],
    "starterCode": {
      "javascript": "/**\n * @param {number} n\n * @return {number[]}\n */\nfunction countBits(n) {\n  // Write your solution here\n  \n}",
      "python": "class Solution:\n    def countBits(self, n: int) -> list[int]:\n        # Write your solution here\n        pass",
      "java": "class Solution {\n    public int[] countBits(int n) {\n        // Write your solution here\n        return new int[]{};\n    }\n}",
      "cpp": "#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<int> countBits(int n) {\n        // Write your solution here\n        return {};\n    }\n};",
      "c": "int* countBits(int n, int* returnSize) {\n    // Write your solution here\n    *returnSize = n + 1;\n    return NULL;\n}"
    },
    "testCases": [
      {
        "id": "tc-1",
        "input": "n = 2",
        "expectedOutput": "[0, 1, 1]"
      },
      {
        "id": "tc-2",
        "input": "n = 5",
        "expectedOutput": "[0, 1, 1, 2, 1, 2]"
      }
    ]
  },
  {
    "title": "Single Number",
    "slug": "single-number",
    "platform": "LEETCODE",
    "difficulty": "Easy",
    "topic": "Bit Manipulation",
    "tags": [
      "array",
      "bit-manipulation"
    ],
    "canonicalUrl": "https://leetcode.com/problems/single-number/",
    "estimatedMinutes": 10,
    "description": "Given a non-empty array of integers nums, every element appears twice except for one. Find that single one. You must implement a solution with a linear runtime complexity and use only constant extra space.",
    "entryFunctionName": "singleNumber",
    "companyTags": [
      "Amazon",
      "Meta",
      "Google"
    ],
    "starterCode": {
      "javascript": "/**\n * @param {number[]} nums\n * @return {number}\n */\nfunction singleNumber(nums) {\n  // Write your solution here\n  \n}",
      "python": "class Solution:\n    def singleNumber(self, nums: list[int]) -> int:\n        # Write your solution here\n        pass",
      "java": "class Solution {\n    public int singleNumber(int[] nums) {\n        // Write your solution here\n        return 0;\n    }\n}",
      "cpp": "#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    int singleNumber(vector<int>& nums) {\n        // Write your solution here\n        return 0;\n    }\n};",
      "c": "int singleNumber(int* nums, int numsSize) {\n    // Write your solution here\n    return 0;\n}"
    },
    "testCases": [
      {
        "id": "tc-1",
        "input": "nums = [2,2,1]",
        "expectedOutput": "1"
      },
      {
        "id": "tc-2",
        "input": "nums = [4,1,2,1,2]",
        "expectedOutput": "4"
      },
      {
        "id": "tc-3",
        "input": "nums = [1]",
        "expectedOutput": "1"
      }
    ]
  },
  {
    "title": "Merge Intervals",
    "slug": "merge-intervals",
    "platform": "LEETCODE",
    "difficulty": "Medium",
    "topic": "Sorting",
    "tags": [
      "array",
      "sorting"
    ],
    "canonicalUrl": "https://leetcode.com/problems/merge-intervals/",
    "estimatedMinutes": 20,
    "description": "Given an array of intervals where intervals[i] = [starti, endi], merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the intervals in the input.",
    "entryFunctionName": "merge",
    "companyTags": [
      "Meta",
      "Google",
      "Amazon",
      "Microsoft",
      "Uber"
    ],
    "starterCode": {
      "javascript": "/**\n * @param {number[][]} intervals\n * @return {number[][]}\n */\nfunction merge(intervals) {\n  // Write your solution here\n  \n}",
      "python": "class Solution:\n    def merge(self, intervals: list[list[int]]) -> list[list[int]]:\n        # Write your solution here\n        pass",
      "java": "import java.util.*;\n\nclass Solution {\n    public int[][] merge(int[][] intervals) {\n        // Write your solution here\n        return new int[][]{};\n    }\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<vector<int>> merge(vector<vector<int>>& intervals) {\n        // Write your solution here\n        return {};\n    }\n};",
      "c": "int** merge(int** intervals, int intervalsSize, int* intervalsColSize, int* returnSize, int** returnColumnSizes) {\n    // Write your solution here\n    *returnSize = 0;\n    return NULL;\n}"
    },
    "testCases": [
      {
        "id": "tc-1",
        "input": "intervals = [[1,3],[2,6],[8,10],[15,18]]",
        "expectedOutput": "[[1, 6], [8, 10], [15, 18]]"
      },
      {
        "id": "tc-2",
        "input": "intervals = [[1,4],[4,5]]",
        "expectedOutput": "[[1, 5]]"
      }
    ]
  },
  {
    "title": "Non-overlapping Intervals",
    "slug": "non-overlapping-intervals",
    "platform": "LEETCODE",
    "difficulty": "Medium",
    "topic": "Sorting",
    "tags": [
      "array",
      "dynamic-programming",
      "greedy",
      "sorting"
    ],
    "canonicalUrl": "https://leetcode.com/problems/non-overlapping-intervals/",
    "estimatedMinutes": 20,
    "description": "Given an array of intervals intervals where intervals[i] = [starti, endi], return the minimum number of intervals you need to remove to make the rest of the intervals non-overlapping.",
    "entryFunctionName": "eraseOverlapIntervals",
    "companyTags": [
      "Meta",
      "Amazon"
    ],
    "starterCode": {
      "javascript": "function eraseOverlapIntervals(intervals) {\n  // Write your solution here\n  \n}",
      "python": "class Solution:\n    def eraseOverlapIntervals(self, intervals: list[list[int]]) -> int:\n        # Write your solution here\n        pass",
      "java": "import java.util.*;\n\nclass Solution {\n    public int eraseOverlapIntervals(int[][] intervals) {\n        // Write your solution here\n        return 0;\n    }\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int eraseOverlapIntervals(vector<vector<int>>& intervals) {\n        // Write your solution here\n        return 0;\n    }\n};",
      "c": "int eraseOverlapIntervals(int** intervals, int intervalsSize, int* intervalsColSize) {\n    // Write your solution here\n    return 0;\n}"
    },
    "testCases": [
      {
        "id": "tc-1",
        "input": "intervals = [[1,2],[2,3],[3,4],[1,3]]",
        "expectedOutput": "1"
      },
      {
        "id": "tc-2",
        "input": "intervals = [[1,2],[1,2],[1,2]]",
        "expectedOutput": "2"
      },
      {
        "id": "tc-3",
        "input": "intervals = [[1,2],[2,3]]",
        "expectedOutput": "0"
      }
    ]
  },
  {
    "title": "Count Primes",
    "slug": "count-primes",
    "platform": "LEETCODE",
    "difficulty": "Medium",
    "topic": "Mathematical Algorithms",
    "tags": [
      "array",
      "math",
      "number-theory"
    ],
    "canonicalUrl": "https://leetcode.com/problems/count-primes/",
    "estimatedMinutes": 15,
    "description": "Given an integer n, return the number of prime numbers that are strictly less than n. (Sieve of Eratosthenes)",
    "entryFunctionName": "countPrimes",
    "companyTags": [
      "Amazon",
      "Microsoft",
      "Google"
    ],
    "starterCode": {
      "javascript": "/**\n * @param {number} n\n * @return {number}\n */\nfunction countPrimes(n) {\n  // Write your solution here\n  \n}",
      "python": "class Solution:\n    def countPrimes(self, n: int) -> int:\n        # Write your solution here\n        pass",
      "java": "class Solution {\n    public int countPrimes(int n) {\n        // Write your solution here\n        return 0;\n    }\n}",
      "cpp": "#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    int countPrimes(int n) {\n        // Write your solution here\n        return 0;\n    }\n};",
      "c": "int countPrimes(int n) {\n    // Write your solution here\n    return 0;\n}"
    },
    "testCases": [
      {
        "id": "tc-1",
        "input": "n = 10",
        "expectedOutput": "4"
      },
      {
        "id": "tc-2",
        "input": "n = 0",
        "expectedOutput": "0"
      },
      {
        "id": "tc-3",
        "input": "n = 1",
        "expectedOutput": "0"
      }
    ]
  }
];

/**
 * Returns complete database of 100% authentic DSA questions with genuine test cases and multi-language templates.
 */
export function generateCompleteDSADatabase(): RawDSAQuestion[] {
  return [...AUTHENTIC_DSA_QUESTIONS];
}

export const dsaSeedQuestions = AUTHENTIC_DSA_QUESTIONS;
