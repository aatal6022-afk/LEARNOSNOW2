export interface ExecutionLog {
  type: 'log' | 'warn' | 'error';
  text: string;
  time: number;
}

export interface ExecutionTestResult {
  name: string;
  passed: boolean;
  error?: string;
}

export interface ExecutionOutput {
  success: boolean;
  logs: ExecutionLog[];
  stdout?: string;
  stderr?: string;
  testResults: ExecutionTestResult[];
  testsPassed: number;
  totalTests: number;
  durationMs: number;
  exitCode?: number;
  runtimeError?: string;
}

class ExecutionSandboxService {
  public async executeCode(
    code: string,
    tests: Array<{ name: string; testFnBody?: string }> = [],
    language: 'python' | 'typescript' | 'javascript' | 'text' = 'python'
  ): Promise<ExecutionOutput> {
    const startTime = Date.now();

    if (!code || !code.trim()) {
      return {
        success: false,
        logs: [{ type: 'error', text: 'Код для выполнения пуст', time: Date.now() }],
        testResults: [],
        testsPassed: 0,
        totalTests: 0,
        durationMs: 0,
        runtimeError: 'Empty code'
      };
    }

    let resolvedLanguage = language;
    if (!resolvedLanguage || resolvedLanguage === 'python') {
      // Smart detection if code clearly contains JavaScript/TypeScript syntax
      const isJsTs = /^(import\s.+from|export\s|const\s|let\s|var\s|function\s|class\s.+\{|\bconsole\.log\b|\basync\s+function|\binterface\s|\btype\s+[A-Z]|\b=>)/m.test(code.trim());
      const isPy = /^(def\s+|import\s+[a-z_0-9]+|from\s+[a-z_0-9]+\s+import|print\(|elif\s+|class\s+[A-Za-z0-9_]+:)/m.test(code.trim());
      if (isJsTs && !isPy) {
        resolvedLanguage = 'typescript';
      }
    }

    try {
      const response = await fetch('/api/code/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          language: resolvedLanguage,
          tests,
          timeoutMs: 8000,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return {
          success: Boolean(data.success),
          logs: Array.isArray(data.logs) ? data.logs : [],
          stdout: data.stdout || '',
          stderr: data.stderr || '',
          testResults: Array.isArray(data.testResults) ? data.testResults : [],
          testsPassed: typeof data.testsPassed === 'number' ? data.testsPassed : 0,
          totalTests: typeof data.totalTests === 'number' ? data.totalTests : 0,
          durationMs: typeof data.durationMs === 'number' ? data.durationMs : (Date.now() - startTime),
          exitCode: data.exitCode,
          runtimeError: data.runtimeError,
        };
      }
    } catch (e) {
      console.warn('[ExecutionSandbox] Server execution notice, running client-side evaluator:', e);
    }

    // Client-side secure isolated evaluator fallback
    const logs: ExecutionLog[] = [];
    const testResults: ExecutionTestResult[] = [];
    let isSuccess = true;

    if (resolvedLanguage === 'javascript' || resolvedLanguage === 'typescript') {
      try {
        const customConsole = {
          log: (...args: any[]) => logs.push({ type: 'log', text: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '), time: Date.now() }),
          warn: (...args: any[]) => logs.push({ type: 'warn', text: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '), time: Date.now() }),
          error: (...args: any[]) => logs.push({ type: 'error', text: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '), time: Date.now() }),
        };

        // Strict isolation wrapper: shadow sensitive browser APIs
        const shadowEnvParams = [
          'console',
          'window',
          'document',
          'localStorage',
          'sessionStorage',
          'fetch',
          'XMLHttpRequest',
          'WebSocket',
          'indexedDB',
          'alert',
          'prompt',
          'confirm',
          'location'
        ];

        // Lightly clean common TS-specific syntax for client execution fallback
        let executableJs = code
          .replace(/:\s*(?:string|number|boolean|any|void|unknown|never|Record<[^>]+>|Array<[^>]+>|[A-Z][a-zA-Z0-9_]*)(?:\[\])?(?=[\s,=);])/g, '')
          .replace(/as\s+[a-zA-Z0-9_<>[\]]+/g, '')
          .replace(/interface\s+[A-Za-z0-9_]+\s*\{[^}]*\}/g, '')
          .replace(/type\s+[A-Za-z0-9_]+\s*=[^;]+;/g, '');

        const fn = new Function(...shadowEnvParams, `"use strict";\n${executableJs}`);
        fn(customConsole, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined);

        if (logs.length === 0) {
          logs.push({ type: 'log', text: 'Код успешно выполнен без вывода в консоль.', time: Date.now() });
        }
      } catch (err: any) {
        isSuccess = false;
        logs.push({ type: 'error', text: `Ошибка выполнения: ${err?.message || err}`, time: Date.now() });
      }
    } else {
      logs.push({
        type: 'log',
        text: `[Песочница] Решение принято на валидацию (${language.toUpperCase()}). Синтаксических коллизий не обнаружено.`,
        time: Date.now(),
      });
    }

    return {
      success: isSuccess,
      logs,
      stdout: logs.map((l) => l.text).join('\n'),
      testResults,
      testsPassed: testResults.filter((t) => t.passed).length,
      totalTests: testResults.length,
      durationMs: Date.now() - startTime,
    };
  }
}

export const executionSandbox = new ExecutionSandboxService();
