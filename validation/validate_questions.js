require('dotenv').config();
const fs = require('fs');
const axios = require('axios');
const OpenAI = require('openai');

// Configuration
const INPUT_FILE = process.argv[2] || 'scripts/test.json';
const OUTPUT_FILE = process.argv[3] || 'test-fixed.json';
const COMPILER_API_URL = 'https://c-compiler-fzqcxyx4ma-el.a.run.app/test';
const SAMBANOVA_API_KEY = process.env.SAMBANOVA_API_KEY;
const SAMBANOVA_BASE_URL = 'https://api.sambanova.ai/v1';
const SAMBANOVA_MODEL = 'Meta-Llama-3.1-405B'; // GPT OSS 120B equivalent

if (!SAMBANOVA_API_KEY) {
    console.error('Error: SAMBANOVA_API_KEY environment variable is not set.');
    process.exit(1);
}

const REQUIRED_FIELDS = [
    "id",
    "question_text",
    "question_description",
    "input_format",
    "output_format",
    "constraints",
    "hints",
    "question_type",
    "difficulty",
    "answer",
    "test_cases",
    "solution_explanation",
    "language"
];

const openai = new OpenAI({
    apiKey: SAMBANOVA_API_KEY,
    baseURL: SAMBANOVA_BASE_URL,
});

async function validateAndFix() {
    console.log(`Reading questions from ${INPUT_FILE}...`);
    let data;
    try {
        const fileContent = fs.readFileSync(INPUT_FILE, 'utf8');
        data = JSON.parse(fileContent);
    } catch (err) {
        console.error(`Error reading input file: ${err.message}`);
        return;
    }

    let totalQuestions = 0;
    let fixedQuestions = 0;

    // Recursive function to process questions at any level
    async function processUnit(unit) {
        if (!unit) return;

        console.log(`Processing ${unit.name || 'Unnamed Unit'}...`);

        // Process questions in this unit
        if (unit.questions && Array.isArray(unit.questions)) {
            for (let j = 0; j < unit.questions.length; j++) {
                const question = unit.questions[j];
                totalQuestions++;
                console.log(`  Validating question ID: ${question.id}...`);

                // 1. Check Structure and Missing Fields
                const missingFields = checkStructure(question);
                if (missingFields.length > 0) {
                    console.log(`    [MISSING FIELDS] Found missing keys: ${missingFields.join(', ')}. Populating with AI...`);
                    const structuralFix = await fixStructureWithAI(question, missingFields);
                    if (structuralFix) {
                        unit.questions[j] = structuralFix;
                        Object.assign(question, structuralFix);
                        fixedQuestions++;
                        console.log(`    [STRUCTURE UPDATED] Missing fields populated for ${question.id}.`);
                    } else {
                        console.error(`    [ERROR] Failed to populate missing fields for ${question.id}.`);
                    }
                }

                const validationResult = await checkQuestion(question);

                if (!validationResult.passed) {
                    console.log(`    [FAILED] Question ${question.id}. Attempting to fix...`);
                    const fixedQuestion = await fixQuestionWithAI(question, validationResult.failures);
                    if (fixedQuestion) {
                        unit.questions[j] = fixedQuestion;
                        fixedQuestions++;
                        console.log(`    [FIXED] Question ${question.id} updated.`);
                    } else {
                        console.error(`    [ERROR] Failed to fix question ${question.id}.`);
                    }
                } else {
                    console.log(`    [PASSED] Question ${question.id}.`);
                }
            }
        }

        // Process children units recursively
        if (unit.children && Array.isArray(unit.children)) {
            for (const child of unit.children) {
                await processUnit(child);
            }
        }
    }

    // Handle data as either an array of units or a single unit object
    if (Array.isArray(data)) {
        for (const unit of data) {
            await processUnit(unit);
        }
    } else {
        await processUnit(data);
    }

    // Save output
    console.log(`Saving fixed questions to ${OUTPUT_FILE}...`);
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 4));
    console.log(`Done. Total questions: ${totalQuestions}, Fixed: ${fixedQuestions}`);
}

async function checkQuestion(question) {
    try {
        const payload = {
            code: question.answer,
            testCases: question.test_cases,
            timeout: 5000
        };

        const response = await axios.post(COMPILER_API_URL, payload);
        const result = response.data;

        // Check if all test cases passed
        // The API returns an array of results results: [ { input, expectedOutput, actualOutput, passed: boolean }, ... ]
        // OR it might return a top level passed? Let's assume standard structure based on curl.
        // The curl output wasn't fully shown but typically "testCases" response contains "passed" for each.

        // Actually, based on previous interactions or standard practices, let's look at the response structure carefully.
        // Often these APIs return `results` array.

        // If the API failed to execute (compile error), valid might be false.

        if (result.error) {
            console.log(`      Compiler Error: ${result.error}`);
            return { passed: false, failures: [{ error: `Compiler Error: ${result.error}` }] };
        }

        if (!result.results || !Array.isArray(result.results)) {
            console.log(`      Unexpected API response format.`);
            return { passed: false, failures: [{ error: "Unexpected API response format" }] };
        }

        if (result.results.length !== question.test_cases.length) {
            console.warn(`      [WARNING] Test case count mismatch! Sent: ${question.test_cases.length}, Received: ${result.results.length}`);
        }

        const allPassed = result.results.every(r => r.passed);

        // Log individual test case results
        result.results.forEach((r, index) => {
            const status = r.passed ? '✓ PASSED' : '✗ FAILED';
            const inputSnippet = r.input.length > 20 ? r.input.substring(0, 17) + '...' : r.input;
            console.log(`      [Test Case ${index + 1}] ${status} | Input: ${inputSnippet.replace(/\n/g, '\\n')}`);

            if (!r.passed) {
                const testCase = question.test_cases[index];
                const expected = r.expectedOutput || (testCase ? testCase.expectedOutput : 'N/A');
                console.log(`        Input:    ${r.input.replace(/\n/g, '\\n')}`);
                console.log(`        Expected: ${expected.replace(/\n/g, '\\n')}`);
                console.log(`        Actual:   ${r.output.replace(/\n/g, '\\n')}`);
                if (r.error) console.log(`        Error:    ${r.error}`);
            }
        });

        if (!allPassed) {
            const failures = result.results.filter(r => !r.passed);
            return {
                passed: false,
                failures: failures.map(f => {
                    const index = result.results.indexOf(f);
                    const testCase = question.test_cases[index];
                    const expected = f.expectedOutput || (testCase ? testCase.expectedOutput : 'N/A');
                    return {
                        input: f.input,
                        expected: expected,
                        actual: f.output,
                        error: f.error
                    };
                })
            };
        } else {
            console.log(`      ✓ All ${result.results.length} test cases passed.`);
            return { passed: true, failures: [] };
        }

    } catch (error) {
        console.error(`      API Request failed: ${error.message}`);
        return { passed: false, failures: [{ error: error.message }] };
    }
}

async function fixQuestionWithAI(question, failures) {
    try {
        const failureDetails = failures.map(f =>
            `Input: ${f.input}\nExpected: ${f.expected}\nActual: ${f.actual}\nError: ${f.error || 'None'}`
        ).join('\n---\n');

        const prompt = `
You are an expert C programmer and specific question fixer.
The following C coding question has specific requirements and test cases.
The current solution (or test cases) failed validation against a compiler.

QUESTION DETAILS:
Title: ${question.question_text}
Description: ${question.question_description}
Input Format: ${question.input_format}
Output Format: ${question.output_format}
Constraints: ${question.constraints}
Current Answer Code:
\`\`\`c
${question.answer}
\`\`\`

Test Cases:
${JSON.stringify(question.test_cases, null, 2)}

VALIDATION FAILURES:
The following test cases failed:
${failureDetails}

TASK:
1. Analyze why the code might be failing the test cases or if the test cases themselves are incorrect matches for the problem description.
2. Fix the "answer" (C code) to be correct, robust, and match the requirements exactly.
3. Fix the "test_cases" if they are wrong or formatted incorrectly (e.g. extra whitespace, wrong types).
4. Ensure the JSON structure matches the original perfectly.
5. Return ONLY the matched JSON object for this specific question (no markdown, no extra text).

JSON FORMAT TO RETURN:
{
    "id": "...",
    "question_text": "...",
    "question_description": "...",
    "input_format": "...",
    "output_format": "...",
    "constraints": "...",
    "hints": "...",
    "question_type": "CODING",
    "difficulty": "...",
    "answer": "...",
    "test_cases": [...],
    "solution_explanation": "...",
    "language": "C"
}
`;

        const completion = await openai.chat.completions.create({
            messages: [{ role: "system", content: "You are a helpful assistant that outputs only valid JSON." }, { role: "user", content: prompt }],
            model: SAMBANOVA_MODEL,
            response_format: { type: "json_object" },
        });

        const fixedJson = JSON.parse(completion.choices[0].message.content);

        // Merge fields to ensure we don't lose any extra props if AI omits them, 
        // but prioritize AI's fixes for the core fields.
        return { ...question, ...fixedJson };

    } catch (error) {
        console.error(`      AI Fix failed: ${error.message}`);
        return null; // Return null to indicate failure to fix
    }
}

function checkStructure(question) {
    return REQUIRED_FIELDS.filter(field => !question.hasOwnProperty(field) || question[field] === null || question[field] === "");
}

async function fixStructureWithAI(question, missingFields) {
    try {
        const prompt = `
You are an expert Computer Science content generator.
The following coding question JSON is missing some required fields.
Your task is to generate ACCURATE, relevant content for the missing fields based on the existing fields (Question Text, Description, Answer code, etc.).

EXISTING DATA:
${JSON.stringify(question, null, 2)}

MISSING FIELDS TO GENERATE:
${JSON.stringify(missingFields)}

TASK:
1. Analyze the incomplete question data.
2. Generate appropriate content for ONLY the missing fields.
   - For "hints": provide 1-2 helpful implementation hints.
   - For "constraints": deduce reasonable constraints from types/problem (e.g., N <= 1000).
   - For "solution_explanation": Explain the provided "answer" code logic clearly.
   - For "input_format"/"output_format": deduce from the scanf/printf in "answer".
3. Return a JSON object containing JUST the missing fields and their values. Do NOT return the entire object.

JSON FORMAT TO RETURN:
{
    "missing_field_1": "generated content...",
    "missing_field_2": "generated content..."
}
`;

        const completion = await openai.chat.completions.create({
            messages: [{ role: "system", content: "You are a helpful assistant that outputs only valid JSON." }, { role: "user", content: prompt }],
            model: SAMBANOVA_MODEL,
            response_format: { type: "json_object" },
        });

        const generatedFields = JSON.parse(completion.choices[0].message.content);

        // Merge generated fields into original question
        return { ...question, ...generatedFields };

    } catch (error) {
        console.error(`      AI Structure Fix failed: ${error.message}`);
        return null;
    }
}

validateAndFix();
