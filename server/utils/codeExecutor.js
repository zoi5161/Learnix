const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const execAsync = promisify(exec);

// Temporary directory for code execution
const TEMP_DIR = path.join(__dirname, '../temp');
if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
}

/**
 * Clean up temporary files
 */
const cleanup = (filePaths) => {
    filePaths.forEach(filePath => {
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        } catch (error) {
            console.error(`Error cleaning up ${filePath}:`, error.message);
        }
    });
};

/**
 * Normalize output for comparison (trim whitespace, handle newlines)
 */
const normalizeOutput = (output) => {
    if (!output) return '';
    return output.toString().trim().replace(/\r\n/g, '\n').replace(/\r/g, '\n');
};

/**
 * Parse input string into arguments array
 * Supports: JSON array, space-separated, line-separated
 */
const parseInput = (input, format = 'json') => {
    if (!input || !input.trim()) return [];
    
    try {
        if (format === 'json') {
            // Try to parse as JSON first
            try {
                const parsed = JSON.parse(input);
                return Array.isArray(parsed) ? parsed : [parsed];
            } catch {
                // If not valid JSON, try space-separated
                return input.trim().split(/\s+/).map(v => {
                    // Try to convert to number if possible
                    const num = Number(v);
                    return isNaN(num) ? v : num;
                });
            }
        } else if (format === 'space_separated') {
            return input.trim().split(/\s+/).map(v => {
                const num = Number(v);
                return isNaN(num) ? v : num;
            });
        } else if (format === 'line_separated') {
            return input.trim().split('\n').map(v => {
                const num = Number(v);
                return isNaN(num) ? v : num;
            });
        }
    } catch (error) {
        // Fallback: return as single string
        return [input];
    }
    
    return [input];
};

/**
 * Format return value to string for comparison
 */
const formatReturnValue = (value) => {
    if (value === null || value === undefined) {
        return '';
    }
    
    // Handle arrays and objects
    if (Array.isArray(value)) {
        return JSON.stringify(value);
    }
    
    if (typeof value === 'object') {
        return JSON.stringify(value);
    }
    
    return String(value);
};

/**
 * Run Python code (function-based like LeetCode)
 */
const runPython = async (code, input, timeLimit = 5, functionName = 'solution', inputFormat = 'json') => {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    const fileName = `python_${timestamp}_${randomId}.py`;
    const filePath = path.join(TEMP_DIR, fileName);
    const inputFilePath = path.join(TEMP_DIR, `input_${timestamp}_${randomId}.txt`);

    let output = '';
    let error = '';
    let executionTime = 0;

    try {
        // Parse input into arguments
        const args = parseInput(input, inputFormat);
        
        // Wrap user code to call function and print result
        // Format: args as *args (unpack array as arguments)
        const argsStr = JSON.stringify(args);
        const argsSingleStr = args.length === 1 ? JSON.stringify(args[0]) : JSON.stringify(args);
        
        const wrappedCode = `${code}

# Auto-generated: Call function and print result
import json
try:
    args = ${argsStr}
    result = ${functionName}(*args)
    # Format output: arrays/objects as JSON, primitives as string
    if isinstance(result, (list, dict)):
        print(json.dumps(result))
    else:
        print(result)
except TypeError:
    # If function doesn't accept *args, try with single argument
    try:
        args_single = ${argsSingleStr}
        result = ${functionName}(args_single)
        if isinstance(result, (list, dict)):
            print(json.dumps(result))
        else:
            print(result)
    except Exception as err:
        print(f"Error: {err}", file=__import__('sys').stderr)
        raise
except Exception as e:
    print(f"Error: {e}", file=__import__('sys').stderr)
    raise
`;

        // Write wrapped code to file
        fs.writeFileSync(filePath, wrappedCode);

        const startTime = Date.now();

        // Execute code
        const command = `python3 "${filePath}"`;

        // Execute with timeout
        const { stdout, stderr } = await execAsync(command, {
            timeout: timeLimit * 1000,
            maxBuffer: 1024 * 1024 * 10 // 10MB
        });

        executionTime = Date.now() - startTime;
        output = stdout || '';
        error = stderr || '';

        // Python errors often go to stderr, but we want to distinguish between actual errors and warnings
        if (error && !error.includes('Warning')) {
            // Check if it's a real error (contains traceback, Error, etc.)
            if (error.includes('Traceback') || error.includes('Error') || error.includes('Exception')) {
                throw new Error(error);
            }
        }

    } catch (err) {
        executionTime = Date.now() - Date.now();
        
        if (err.code === 'ETIMEDOUT' || err.signal === 'SIGTERM') {
            error = `Execution timeout: Code exceeded ${timeLimit} seconds`;
        } else if (err.stderr) {
            error = err.stderr.toString();
        } else {
            error = err.message || 'Unknown error occurred';
        }
    } finally {
        // Cleanup
        cleanup([filePath, inputFilePath]);
    }

    return {
        output: normalizeOutput(output),
        error: normalizeOutput(error),
        executionTime
    };
};

/**
 * Run JavaScript code (function-based like LeetCode)
 */
const runJavaScript = async (code, input, timeLimit = 5, functionName = 'solution', inputFormat = 'json') => {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    const fileName = `js_${timestamp}_${randomId}.js`;
    const filePath = path.join(TEMP_DIR, fileName);
    const inputFilePath = path.join(TEMP_DIR, `input_${timestamp}_${randomId}.txt`);

    let output = '';
    let error = '';
    let executionTime = 0;

    try {
        // Parse input into arguments
        const args = parseInput(input, inputFormat);
        
        // Wrap user code to call function and print result
        const wrappedCode = `${code}

// Auto-generated: Call function and print result
try {
    const result = ${functionName}(...${JSON.stringify(args)});
    // Format output: arrays/objects as JSON, primitives as string
    if (Array.isArray(result) || (typeof result === 'object' && result !== null)) {
        console.log(JSON.stringify(result));
    } else {
        console.log(result);
    }
} catch (err) {
    if (err.message && err.message.includes('is not a function')) {
        // If function doesn't exist or wrong name, try with single argument
        try {
            const result = ${functionName}(${args.length === 1 ? JSON.stringify(args[0]) : JSON.stringify(args)});
            if (Array.isArray(result) || (typeof result === 'object' && result !== null)) {
                console.log(JSON.stringify(result));
            } else {
                console.log(result);
            }
        } catch (e) {
            console.error('Error:', e.message);
            process.exit(1);
        }
    } else {
        console.error('Error:', err.message);
        process.exit(1);
    }
}
`;

        // Write wrapped code to file
        fs.writeFileSync(filePath, wrappedCode);

        const startTime = Date.now();

        // Execute with timeout
        const { stdout, stderr } = await execAsync(`node "${filePath}"`, {
            timeout: timeLimit * 1000,
            maxBuffer: 1024 * 1024 * 10 // 10MB
        });

        executionTime = Date.now() - startTime;
        output = stdout || '';
        error = stderr || '';

        if (error) {
            throw new Error(error);
        }

    } catch (err) {
        executionTime = Date.now() - Date.now();
        
        if (err.code === 'ETIMEDOUT' || err.signal === 'SIGTERM') {
            error = `Execution timeout: Code exceeded ${timeLimit} seconds`;
        } else if (err.stderr) {
            error = err.stderr.toString();
        } else {
            error = err.message || 'Unknown error occurred';
        }
    } finally {
        // Cleanup
        cleanup([filePath, inputFilePath]);
    }

    return {
        output: normalizeOutput(output),
        error: normalizeOutput(error),
        executionTime
    };
};

/**
 * Run code with test cases (function-based)
 */
const runTestCases = async (code, testCases, language, timeLimit = 5, functionName = 'solution', inputFormat = 'json') => {
    const results = [];

    for (let i = 0; i < testCases.length; i++) {
        const testCase = testCases[i];
        const startTime = Date.now();

        let result;
        try {
            if (language === 'python') {
                result = await runPython(code, testCase.input, timeLimit, functionName, inputFormat);
            } else if (language === 'javascript') {
                result = await runJavaScript(code, testCase.input, timeLimit, functionName, inputFormat);
            } else {
                throw new Error(`Unsupported language: ${language}`);
            }

            const expectedOutput = normalizeOutput(testCase.expected_output);
            const actualOutput = result.output;
            const passed = expectedOutput === actualOutput && !result.error;

            results.push({
                testCaseIndex: i,
                passed,
                output: actualOutput,
                expected_output: expectedOutput,
                error: result.error,
                execution_time: result.executionTime,
                points_earned: passed ? (testCase.points || 1) : 0
            });

        } catch (error) {
            results.push({
                testCaseIndex: i,
                passed: false,
                output: '',
                expected_output: normalizeOutput(testCase.expected_output),
                error: error.message || 'Execution failed',
                execution_time: Date.now() - startTime,
                points_earned: 0
            });
        }
    }

    return results;
};

module.exports = {
    runPython,
    runJavaScript,
    runTestCases
};

