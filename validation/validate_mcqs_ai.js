require('dotenv').config({ path: __dirname + '/.env' });
const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');

// Configuration
const MCQ_DIR = path.resolve(__dirname, '../CP/CP-MCQ');
const LOG_FILE = path.join(MCQ_DIR, 'ai_validation_logs.txt');
const SAMBANOVA_API_KEY = process.env.SAMBANOVA_API_KEY;
const SAMBANOVA_BASE_URL = 'https://api.sambanova.ai/v1';
const SAMBANOVA_MODEL = 'gpt-oss-120b'; 

if (!SAMBANOVA_API_KEY) {
    console.error('Error: SAMBANOVA_API_KEY environment variable is not set in ' + path.resolve(__dirname, '.env'));
    process.exit(1);
}

const openai = new OpenAI({
    apiKey: SAMBANOVA_API_KEY,
    baseURL: SAMBANOVA_BASE_URL,
});

const mcqFiles = [
    "DynamicProgramming.json"
];

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function validateMCQWithAI(question, retries = 5) {
    try {
        const prompt = `
You are an expert Computer Science professor verifying Multiple Choice Questions.
Analyze the following MCQ for technical accuracy.

QUESTION:
${question.question_text}

OPTIONS:
1. ${question.options[0].text} (Marked as Correct: ${question.options[0].is_correct})
2. ${question.options[1].text} (Marked as Correct: ${question.options[1].is_correct})
3. ${question.options[2].text} (Marked as Correct: ${question.options[2].is_correct})
4. ${question.options[3].text} (Marked as Correct: ${question.options[3].is_correct})

EXPLANATION:
${question.explanation}

TASK:
1. Is the question technically sound and unambiguous?
2. Is the marked correct option ACTUALLY the correct answer?
3. Are the other 3 options definitely incorrect?
4. Is the explanation accurate and helpful?

Respond ONLY with a valid JSON object in this format:
{
    "is_valid": true/false,
    "reasoning": "Brief explanation of why it is valid or invalid",
    "suggested_fix": "If invalid, string describing how to fix it, otherwise null"
}
`;

        const completion = await openai.chat.completions.create({
            messages: [
                { role: "system", content: "You are a helpful assistant that outputs only valid JSON." }, 
                { role: "user", content: prompt }
            ],
            model: SAMBANOVA_MODEL,
            response_format: { type: "json_object" },
            temperature: 0.1
        });

        return JSON.parse(completion.choices[0].message.content);

    } catch (error) {
        if (error.status === 429 && retries > 0) {
            console.log(`\nRate limited. Waiting 10 seconds before retry... (${retries} retries left)`);
            await sleep(10000); // Wait 10 seconds
            return await validateMCQWithAI(question, retries - 1);
        }
        
        console.error(`AI Analysis failed: ${error.message}`);
        return { is_valid: false, reasoning: `API Error: ${error.message}`, suggested_fix: "Retry" };
    }
}

async function main() {
    let logs = [];
    logs.push("=== AI MCQ Validation Logs ===");
    console.log("Starting AI Validation for all MCQs...");

    let totalQuestionsChecked = 0;
    let totalIssuesFound = 0;

    for (const file of mcqFiles) {
        const filePath = path.join(MCQ_DIR, file);
        if (!fs.existsSync(filePath)) {
            console.log(`Skipping ${file} - Not found.`);
            continue;
        }

        console.log(`\nValidating file: ${file}`);
        logs.push(`\n--- File: ${file} ---`);
        
        let data;
        try {
            data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        } catch (e) {
            console.error(`Error reading ${file}: ${e.message}`);
            continue;
        }

        if (!Array.isArray(data)) continue;

        let fileIssues = 0;
        
        // Processing sequentially to respect API rate limits
        for (let i = 0; i < data.length; i++) {
            const q = data[i];
            const qNum = i + 1;
            process.stdout.write(`  Checking Q${qNum}... `);
            
            // To avoid hitting API limits too hard, we might need a small delay
            await sleep(1000); 
            
            const result = await validateMCQWithAI(q);
            totalQuestionsChecked++;

            if (result.is_valid) {
                console.log("OK");
                logs.push(`[Q${qNum}] PASS`);
            } else {
                console.log(`ISSUES FOUND!`);
                fileIssues++;
                totalIssuesFound++;
                const issueStr = `[Q${qNum}] FAIL - Question: "${q.question_text.substring(0, 50)}..."\n  Reasoning: ${result.reasoning}\n  Suggested Fix: ${result.suggested_fix}`;
                console.log(issueStr);
                logs.push(issueStr);
            }
        }
        logs.push(`File Summary: ${fileIssues} issues found out of ${data.length} questions.`);
    }

    logs.push(`\n=== FINAL SUMMARY ===`);
    logs.push(`Total Questions Checked: ${totalQuestionsChecked}`);
    logs.push(`Total Issues Found: ${totalIssuesFound}`);
    logs.push(`Success Rate: ${((totalQuestionsChecked - totalIssuesFound) / Math.max(1, totalQuestionsChecked) * 100).toFixed(2)}%`);

    fs.writeFileSync(LOG_FILE, logs.join('\n'));
    console.log(`\nValidation complete. Logs written to ${LOG_FILE}`);
}

main().catch(console.error);
