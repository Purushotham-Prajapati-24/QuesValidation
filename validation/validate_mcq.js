/**
 * validate_mcq.js
 * 
 * Validates all MCQ JSON files for the MCS-CSE course.
 * Checks schema correctness, option uniqueness, answer validity,
 * difficulty distribution, and content quality.
 * 
 * Usage:
 *   node validate_mcq.js                        → validates all week files
 *   node validate_mcq.js week-9.json            → validates a single file
 *   node validate_mcq.js --dir ../MCS-CSE       → validates all JSONs in a dir
 */

const fs = require('fs');
const path = require('path');

// ─── Config ──────────────────────────────────────────────────────────────────

const DEFAULT_DIR = path.resolve(__dirname, '../MCQ-Based-Questions/MCS-CSE');

const VALID_DIFFICULTY = new Set(['EASY', 'MEDIUM', 'HARD']);
const VALID_ANSWERS = new Set(['A', 'B', 'C', 'D']);
const OPTION_KEYS = ['A', 'B', 'C', 'D'];

// Difficulty distribution rule (per rules.md)
const MIN_EASY = 3;

// ─── ANSI colours ────────────────────────────────────────────────────────────

const C = {
    reset: '\x1b[0m',
    bold: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    gray: '\x1b[90m',
};

function colour(text, ...codes) {
    return codes.join('') + text + C.reset;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isNonEmptyString(val) {
    return typeof val === 'string' && val.trim().length > 0;
}

function isUUID(val) { return typeof val === 'string' && val.trim().length >= 5; }

// ─── Per-question validator ───────────────────────────────────────────────────

function validateQuestion(q, index) {
    const errors = [];
    const warnings = [];
    const label = `Q${index + 1} (id: ${q.id || 'MISSING'})`;

    // 1. id
    if (!isUUID(q.id)) {
        errors.push('`id` is missing or not a valid UUID v4.');
    }

    // 2. question_type
    if (q.question_type !== 'MCQ') {
        errors.push(`\`question_type\` must be "MCQ", got "${q.question_type}".`);
    }

    // 3. question text
    if (!isNonEmptyString(q.question)) {
        errors.push('`question` is empty or missing.');
    } else if (q.question.trim().length < 20) {
        warnings.push('`question` text is very short (< 20 chars) — may be incomplete.');
    }

    // 4. difficulty_level
    if (!VALID_DIFFICULTY.has(q.difficulty_level)) {
        errors.push(`\`difficulty_level\` must be EASY/MEDIUM/HARD, got "${q.difficulty_level}".`);
    }

    // 5. options — presence, completeness, uniqueness
    if (!q.options || typeof q.options !== 'object') {
        errors.push('`options` object is missing.');
    } else {
        const missingKeys = OPTION_KEYS.filter(k => !isNonEmptyString(q.options[k]));
        if (missingKeys.length > 0) {
            errors.push(`Options missing or empty for key(s): ${missingKeys.join(', ')}.`);
        }

        // Check for duplicate option texts (case+whitespace normalised)
        const normalised = OPTION_KEYS.map(k => (q.options[k] || '').trim().toLowerCase());
        const seen = new Set();
        const dupes = [];
        normalised.forEach((txt, i) => {
            if (seen.has(txt)) dupes.push(OPTION_KEYS[i]);
            else seen.add(txt);
        });
        if (dupes.length > 0) {
            errors.push(`Duplicate option text detected for key(s): ${dupes.join(', ')}.`);
        }
    }

    // 6. answer
    if (!VALID_ANSWERS.has(q.answer)) {
        errors.push(`\`answer\` must be A/B/C/D, got "${q.answer}".`);
    } else if (q.options && !isNonEmptyString(q.options[q.answer])) {
        errors.push(`\`answer\` is "${q.answer}" but that option is empty or missing.`);
    }

    // 7. test_cases must be null for MCQ
    if (q.test_cases !== null) {
        errors.push(`\`test_cases\` must be null for MCQs, got: ${JSON.stringify(q.test_cases)}.`);
    }

    // 8. solution_explanation
    if (!isNonEmptyString(q.solution_explanation)) {
        errors.push('`solution_explanation` is empty or missing.');
    } else if (q.solution_explanation.trim().length < 50) {
        warnings.push('`solution_explanation` is very short (< 50 chars) — may lack detail.');
    }

    // 9. language
    if (q.language !== 'C') {
        errors.push(`\`language\` must be "C", got "${q.language}".`);
    }

    return { label, errors, warnings };
}

// ─── Per-file validator ───────────────────────────────────────────────────────

function validateFile(filePath) {
    const filename = path.basename(filePath);
    const results = { filename, totalQ: 0, passed: 0, failed: 0, warned: 0, details: [], distrib: {} };

    // Parse JSON
    let data;
    try {
        const raw = fs.readFileSync(filePath, 'utf8');
        data = JSON.parse(raw);
    } catch (err) {
        results.parseError = err.message;
        return results;
    }

    if (!Array.isArray(data)) {
        results.parseError = 'Root JSON value must be an array of question objects.';
        return results;
    }

    results.totalQ = data.length;

    // Count difficulty distribution
    const dist = { EASY: 0, MEDIUM: 0, HARD: 0 };
    data.forEach(q => { if (VALID_DIFFICULTY.has(q.difficulty_level)) dist[q.difficulty_level]++; });
    results.distrib = dist;

    // Difficulty distribution check
    const distribIssues = [];
    if (dist.EASY < MIN_EASY) {
        distribIssues.push(`Only ${dist.EASY} EASY question(s) — minimum is ${MIN_EASY} (rules.md).`);
    }
    if (dist.MEDIUM < 3) {
        distribIssues.push(`Only ${dist.MEDIUM} MEDIUM question(s) — expected majority (≥3).`);
    }
    if (distribIssues.length > 0) {
        results.distribWarnings = distribIssues;
    }

    // Check for duplicate IDs within file
    const idsSeen = new Set();
    const dupeIds = [];
    data.forEach(q => {
        if (q.id) {
            if (idsSeen.has(q.id)) dupeIds.push(q.id);
            else idsSeen.add(q.id);
        }
    });
    if (dupeIds.length > 0) {
        results.fileErrors = [`Duplicate question IDs: ${dupeIds.join(', ')}`];
    }

    // Validate each question
    data.forEach((q, i) => {
        const res = validateQuestion(q, i);
        results.details.push(res);
        if (res.errors.length > 0) results.failed++;
        else results.passed++;
        if (res.warnings.length > 0) results.warned++;
    });

    return results;
}

// ─── Reporter ─────────────────────────────────────────────────────────────────

function printReport(results) {
    const { filename, totalQ, passed, failed, warned, details, parseError, distrib, distribWarnings, fileErrors } = results;

    const statusSymbol = parseError || failed > 0 || fileErrors
        ? colour('✗ FAIL', C.red, C.bold)
        : colour('✓ PASS', C.green, C.bold);

    console.log(`\n${colour('─'.repeat(60), C.gray)}`);
    console.log(`${statusSymbol}  ${colour(filename, C.bold)}`);
    console.log(`${colour('─'.repeat(60), C.gray)}`);

    if (parseError) {
        console.log(`  ${colour('JSON Parse Error:', C.red)} ${parseError}`);
        return;
    }

    console.log(`  Questions : ${totalQ}  |  Passed: ${colour(String(passed), C.green)}  |  Failed: ${colour(String(failed), failed > 0 ? C.red : C.gray)}  |  Warned: ${colour(String(warned), warned > 0 ? C.yellow : C.gray)}`);
    console.log(`  Difficulty: ${colour('EASY:' + distrib.EASY, C.cyan)} | ${colour('MEDIUM:' + distrib.MEDIUM, C.cyan)} | ${colour('HARD:' + distrib.HARD, C.cyan)}`);

    if (fileErrors) {
        fileErrors.forEach(e => console.log(`  ${colour('[FILE ERROR]', C.red)} ${e}`));
    }
    if (distribWarnings) {
        distribWarnings.forEach(w => console.log(`  ${colour('[DIST WARN]', C.yellow)} ${w}`));
    }

    details.forEach(({ label, errors, warnings }) => {
        if (errors.length === 0 && warnings.length === 0) return; // skip clean questions
        if (errors.length > 0) {
            console.log(`\n  ${colour('• ' + label, C.red)}`);
            errors.forEach(e => console.log(`    ${colour('[ERR]', C.red)} ${e}`));
        }
        if (warnings.length > 0) {
            if (errors.length === 0) console.log(`\n  ${colour('• ' + label, C.yellow)}`);
            warnings.forEach(w => console.log(`    ${colour('[WARN]', C.yellow)} ${w}`));
        }
    });
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function main() {
    const args = process.argv.slice(2);
    let files = [];

    // Parse --dir flag
    const dirFlagIdx = args.indexOf('--dir');
    const targetDir = dirFlagIdx >= 0 ? path.resolve(args[dirFlagIdx + 1]) : DEFAULT_DIR;

    const explicitFiles = args.filter((a, i) => !a.startsWith('--') && i !== dirFlagIdx + 1);

    if (explicitFiles.length > 0) {
        // Specific file(s) passed as args
        files = explicitFiles.map(f => path.resolve(targetDir, f));
    } else {
        // Scan the target directory for week-*.json files
        if (!fs.existsSync(targetDir)) {
            console.error(`${colour('Error:', C.red)} Directory not found: ${targetDir}`);
            process.exit(1);
        }
        files = fs.readdirSync(targetDir)
            .filter(f => /^week-\d+.*\.json$/i.test(f))
            .sort()
            .map(f => path.join(targetDir, f));
    }

    if (files.length === 0) {
        console.log(colour('No MCQ JSON files found to validate.', C.yellow));
        process.exit(0);
    }

    console.log(colour(`\nValidating ${files.length} MCQ file(s)...\n`, C.bold));

    let totalFiles = files.length;
    let passedFiles = 0;
    let totalQ = 0;
    let totalPassed = 0;
    let totalFailed = 0;

    files.forEach(fp => {
        const r = validateFile(fp);
        printReport(r);
        totalQ += r.totalQ || 0;
        totalPassed += r.passed || 0;
        totalFailed += r.failed || 0;
        if (!r.parseError && !r.fileErrors && r.failed === 0) passedFiles++;
    });

    // ── Overall summary ──
    const allClean = totalFailed === 0;
    console.log(`\n${colour('═'.repeat(60), C.gray)}`);
    console.log(colour('OVERALL SUMMARY', C.bold));
    console.log(`${colour('═'.repeat(60), C.gray)}`);
    console.log(`  Files      : ${totalFiles}  |  Clean: ${colour(String(passedFiles), C.green)}  |  Issues: ${colour(String(totalFiles - passedFiles), totalFiles - passedFiles > 0 ? C.red : C.gray)}`);
    console.log(`  Questions  : ${totalQ}  |  Valid: ${colour(String(totalPassed), C.green)}  |  Invalid: ${colour(String(totalFailed), totalFailed > 0 ? C.red : C.gray)}`);
    console.log(`  Result     : ${allClean ? colour('ALL QUESTIONS VALID ✓', C.green, C.bold) : colour('VALIDATION FAILED — see issues above ✗', C.red, C.bold)}`);
    console.log();

    process.exit(allClean ? 0 : 1);
}

main();
