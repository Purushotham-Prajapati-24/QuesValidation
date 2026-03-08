const fs = require('fs');
const path = require('path');

const filesToValidate = [
    'odevc-secb.json',
    'odevltc-unit3.json',
    'odeltvc-unit5.json'
];

let hasErrors = false;

function error(file, msg) {
    console.error(`[ERROR] ${file}: ${msg}`);
    hasErrors = true;
}

function validateFile(file) {
    const filePath = path.join(__dirname, file);
    if (!fs.existsSync(filePath)) {
        error(file, `File not found`);
        return;
    }

    let data;
    try {
        data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (e) {
        error(file, `Invalid JSON: ${e.message}`);
        return;
    }

    if (!Array.isArray(data)) {
        error(file, `Root must be an array`);
        return;
    }

    for (let i = 0; i < data.length; i++) {
        const rootObj = data[i];
        if (typeof rootObj.name !== 'string') {
            error(file, `Root object [${i}] missing string 'name'`);
        }
        if (!Array.isArray(rootObj.questions)) {
            error(file, `Root object [${i}] missing 'questions' array`);
        }
        if (!Array.isArray(rootObj.children)) {
            error(file, `Root object [${i}] missing 'children' array`);
            continue;
        }

        for (let j = 0; j < rootObj.children.length; j++) {
            const child = rootObj.children[j];
            if (typeof child.name !== 'string') {
                error(file, `Child [${i}][${j}] missing string 'name'`);
            }
            if (!Array.isArray(child.questions)) {
                error(file, `Child [${i}][${j}] missing 'questions' array`);
                continue;
            }

            for (let k = 0; k < child.questions.length; k++) {
                const q = child.questions[k];
                const prefix = `Question ${q.id || k} in ${child.name}`;

                if (typeof q.id !== 'string') {
                    error(file, `${prefix}: 'id' must be a string`);
                }
                if (typeof q.question_text !== 'string') {
                    error(file, `${prefix}: 'question_text' must be a string`);
                } else if (!q.question_text.includes('$')) {
                    error(file, `${prefix}: 'question_text' must contain LaTeX ($...$)`);
                }

                if (q.question_type !== 'LATEX') {
                    error(file, `${prefix}: 'question_type' must be exactly 'LATEX'`);
                }

                if (!['EASY', 'MEDIUM', 'HARD'].includes(q.difficulty)) {
                    error(file, `${prefix}: 'difficulty' must be EASY, MEDIUM, or HARD`);
                }

                if (typeof q.answer !== 'string') {
                    error(file, `${prefix}: 'answer' must be a string`);
                } else {
                    if (!q.answer.includes('### Final Solution')) {
                        error(file, `${prefix}: 'answer' must contain '### Final Solution'`);
                    }
                }

                if (typeof q.solution_explanation !== 'string') {
                    error(file, `${prefix}: 'solution_explanation' must be a string`);
                }

                if (q.options !== null) {
                    error(file, `${prefix}: 'options' must be null`);
                }

                if (q.test_cases !== null) {
                    error(file, `${prefix}: 'test_cases' must be null`);
                }
            }
        }
    }
}

for (const file of filesToValidate) {
    console.log(`Validating ${file}...`);
    validateFile(file);
}

if (hasErrors) {
    console.error('\nValidation failed with errors.');
    process.exit(1);
} else {
    console.log('\nAll files passed validation successfully!');
    process.exit(0);
}
