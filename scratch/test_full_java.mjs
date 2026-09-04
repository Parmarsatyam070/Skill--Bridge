import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

const execFileAsync = promisify(execFile);

const javacPath = 'C:\\Program Files\\JetBrains\\IntelliJ IDEA 2025.2.5\\jbr\\bin\\javac.exe';
const javaPath = 'C:\\Program Files\\JetBrains\\IntelliJ IDEA 2025.2.5\\jbr\\bin\\java.exe';

async function run() {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'skillbridge-test-'));
  const solPath = path.join(tmpDir, 'Solution.java');
  const mainPath = path.join(tmpDir, 'Main.java');

  const solutionCode = `
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
`;

  const mainCode = `
import java.io.*;
import java.lang.reflect.*;
import java.util.*;

public class Main {

    private static List<String> splitTokens(String input) {
        List<String> tokens = new ArrayList<>();
        if (input == null || input.trim().isEmpty()) return tokens;

        int depth = 0;
        boolean inQuotes = false;
        StringBuilder current = new StringBuilder();

        for (int i = 0; i < input.length(); i++) {
            char c = input.charAt(i);
            if (c == '"') {
                inQuotes = !inQuotes;
                current.append(c);
            } else if (!inQuotes && (c == '[' || c == '{' || c == '(')) {
                depth++;
                current.append(c);
            } else if (!inQuotes && (c == ']' || c == '}' || c == ')')) {
                depth--;
                current.append(c);
            } else if (!inQuotes && c == ',' && depth == 0) {
                tokens.add(current.toString().trim());
                current.setLength(0);
            } else {
                current.append(c);
            }
        }
        if (current.length() > 0) {
            tokens.add(current.toString().trim());
        }
        return tokens;
    }

    private static String stripVarName(String token) {
        int eqIdx = token.indexOf('=');
        if (eqIdx != -1) {
            String prefix = token.substring(0, eqIdx).trim();
            if (prefix.matches("^[a-zA-Z_][a-zA-Z0-9_]*$")) {
                return token.substring(eqIdx + 1).trim();
            }
        }
        return token.trim();
    }

    private static Object parseArg(String rawToken, Class<?> targetType) {
        String token = stripVarName(rawToken);

        if (targetType == int.class || targetType == Integer.class) {
            return Integer.parseInt(token);
        } else if (targetType == long.class || targetType == Long.class) {
            return Long.parseLong(token);
        } else if (targetType == double.class || targetType == Double.class) {
            return Double.parseDouble(token);
        } else if (targetType == boolean.class || targetType == Boolean.class) {
            return Boolean.parseBoolean(token);
        } else if (targetType == String.class) {
            if (token.startsWith("\\"") && token.endsWith("\\"") && token.length() >= 2) {
                return token.substring(1, token.length() - 1);
            }
            return token;
        } else if (targetType == int[].class) {
            return parseIntArray(token);
        } else if (targetType == int[][].class) {
            return parseInt2DArray(token);
        } else if (targetType == String[].class) {
            return parseStringArray(token);
        } else if (targetType == List.class) {
            return parseList(token);
        }
        return token;
    }

    private static int[] parseIntArray(String s) {
        String clean = s.replaceAll("[\\\\[\\\\]\\\\s]", "");
        if (clean.isEmpty()) return new int[0];
        String[] parts = clean.split(",");
        int[] arr = new int[parts.length];
        for (int i = 0; i < parts.length; i++) {
            arr[i] = Integer.parseInt(parts[i].trim());
        }
        return arr;
    }

    private static int[][] parseInt2DArray(String s) {
        s = s.trim();
        if (s.startsWith("[") && s.endsWith("]")) {
            s = s.substring(1, s.length() - 1).trim();
        }
        List<String> subArrays = splitTokens(s);
        int[][] res = new int[subArrays.size()][];
        for (int i = 0; i < subArrays.size(); i++) {
            res[i] = parseIntArray(subArrays.get(i));
        }
        return res;
    }

    private static String[] parseStringArray(String s) {
        s = s.trim();
        if (s.startsWith("[") && s.endsWith("]")) {
            s = s.substring(1, s.length() - 1).trim();
        }
        List<String> items = splitTokens(s);
        String[] res = new String[items.size()];
        for (int i = 0; i < items.size(); i++) {
            String item = items.get(i).trim();
            if (item.startsWith("\\"") && item.endsWith("\\"") && item.length() >= 2) {
                item = item.substring(1, item.length() - 1);
            }
            res[i] = item;
        }
        return res;
    }

    private static List<Object> parseList(String s) {
        s = s.trim();
        if (s.startsWith("[") && s.endsWith("]")) {
            s = s.substring(1, s.length() - 1).trim();
        }
        List<String> items = splitTokens(s);
        List<Object> list = new ArrayList<>();
        for (String item : items) {
            try {
                list.add(Integer.parseInt(item.trim()));
            } catch (Exception e) {
                list.add(item.trim());
            }
        }
        return list;
    }

    private static String formatOutput(Object obj) {
        if (obj == null) return "null";
        if (obj instanceof int[]) {
            return Arrays.toString((int[]) obj);
        } else if (obj instanceof Object[]) {
            return Arrays.deepToString((Object[]) obj);
        } else if (obj instanceof boolean[]) {
            return Arrays.toString((boolean[]) obj);
        } else if (obj instanceof double[]) {
            return Arrays.toString((double[]) obj);
        } else if (obj instanceof long[]) {
            return Arrays.toString((long[]) obj);
        } else if (obj instanceof String) {
            return (String) obj;
        }
        return String.valueOf(obj);
    }

    private static boolean compareOutputs(String actual, String expected) {
        if (actual == null || expected == null) return false;
        String a = actual.trim();
        String e = expected.trim();
        if (a.equals(e) || a.equalsIgnoreCase(e)) return true;

        String aClean = a.replaceAll("\\\\s+", "");
        String eClean = e.replaceAll("\\\\s+", "");
        return aClean.equals(eClean);
    }

    private static String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\\\", "\\\\\\\\")
                .replace("\\"", "\\\\\\\"")
                .replace("\\b", "\\\\b")
                .replace("\\f", "\\\\f")
                .replace("\\n", "\\\\n")
                .replace("\\r", "\\\\r")
                .replace("\\t", "\\\\t");
    }

    private static Method targetMethod;
    private static Object solutionInstance;
    private static Class<?>[] paramTypes;
    private static List<String> resultsJson = new ArrayList<>();

    private static void runCase(String id, String input, String expected, boolean isHidden) {
        long start = System.currentTimeMillis();
        String actualOutput = "";
        String errorMsg = null;
        boolean passed = false;

        try {
            List<String> tokens = splitTokens(input);
            Object[] args = new Object[paramTypes.length];

            for (int i = 0; i < paramTypes.length; i++) {
                String token = i < tokens.size() ? tokens.get(i) : "";
                args[i] = parseArg(token, paramTypes[i]);
            }

            Object result = targetMethod.invoke(solutionInstance, args);
            actualOutput = formatOutput(result);
            passed = compareOutputs(actualOutput, expected);
        } catch (InvocationTargetException ite) {
            Throwable cause = ite.getCause() != null ? ite.getCause() : ite;
            errorMsg = cause.getClass().getName() + ": " + cause.getMessage();
            actualOutput = "Error: " + errorMsg;
        } catch (Exception e) {
            errorMsg = e.getClass().getName() + ": " + e.getMessage();
            actualOutput = "Error: " + errorMsg;
        }

        long elapsed = Math.max(1, System.currentTimeMillis() - start);

        StringBuilder sb = new StringBuilder();
        sb.append("{");
        sb.append("\\"id\\":\\"").append(escapeJson(id)).append("\\",");
        sb.append("\\"passed\\":").append(passed).append(",");
        sb.append("\\"status\\":\\"").append(passed ? "PASSED" : "FAILED").append("\\",");
        sb.append("\\"actualOutput\\":\\"").append(escapeJson(actualOutput)).append("\\",");
        sb.append("\\"executionTimeMs\\":").append(elapsed).append(",");
        if (errorMsg != null) {
            sb.append("\\"error\\":\\"").append(escapeJson(errorMsg)).append("\\",");
        }
        sb.append("\\"isHidden\\":").append(isHidden);
        sb.append("}");
        resultsJson.add(sb.toString());
    }

    public static void main(String[] args) {
        String targetMethodName = "findKthLargest";

        try {
            Class<?> solClass = Class.forName("Solution");
            try {
                Constructor<?> ctor = solClass.getDeclaredConstructor();
                ctor.setAccessible(true);
                solutionInstance = ctor.newInstance();
            } catch (Exception ignored) {}

            Method[] methods = solClass.getDeclaredMethods();

            if (!targetMethodName.isEmpty()) {
                for (Method m : methods) {
                    if (m.getName().equals(targetMethodName) && !Modifier.isPrivate(m.getModifiers())) {
                        targetMethod = m;
                        break;
                    }
                }
            }

            if (targetMethod == null) {
                for (Method m : methods) {
                    int mod = m.getModifiers();
                    if (Modifier.isPublic(mod) || !Modifier.isPrivate(mod)) {
                        String name = m.getName();
                        if (!name.equals("main") && !name.equals("equals") && !name.equals("hashCode") && !name.equals("toString")) {
                            targetMethod = m;
                            break;
                        }
                    }
                }
            }

            if (targetMethod == null) {
                System.out.println("{\\"compileError\\":\\"No executable public method found in Solution class.\\"}");
                return;
            }

            targetMethod.setAccessible(true);
            paramTypes = targetMethod.getParameterTypes();

            // Test cases
            runCase("tc-1", "nums = [3,2,1,5,6,4], k = 2", "5", false);
            runCase("tc-2", "nums = [3,2,3,1,2,4,5,5,6], k = 4", "4", false);

            System.out.println("{\\"results\\":[" + String.join(",", resultsJson) + "]}");
        } catch (Exception e) {
            System.out.println("{\\"compileError\\":\\"Reflection initialization error: " + escapeJson(e.getMessage()) + "\\"}");
        }
    }
}
`;

  await fs.writeFile(solPath, solutionCode, 'utf8');
  await fs.writeFile(mainPath, mainCode, 'utf8');

  console.log('Compiling...');
  await execFileAsync(javacPath, ['-encoding', 'UTF-8', 'Solution.java', 'Main.java'], { cwd: tmpDir });
  console.log('Running...');
  const { stdout } = await execFileAsync(javaPath, ['-Xmx256m', '-cp', '.', 'Main'], { cwd: tmpDir });
  console.log('OUTPUT:', stdout);
}

run();
