const cp = require('child_process');
const fs = require('fs');

const files = [
    'questionbygroup/week-4-cse.json',
    'questionbygroup/week-5-cse.json',
    'questionbygroup/week-6-cse.json',
    'questionbygroup/week-7-cse.json',
    'questionbygroup/week-9-cse.json',
    'questionbygroup/week-10-cse.json',
    'questionbygroup/week-11-cse.json',
    'questionbygroup/week-12-cse.json',
    'questionbygroup/week-13-cse.json'
];

let results = '# Validation Results\n\n';

files.forEach(file => {
    console.log(`Running validation for ${file}...`);
    results += `\n## Validation for ${file}\n\n`;
    const res = cp.spawnSync('node', ['validation/validate_questions.js', file, file.replace('.json', '-fixed.json')], {
        env: { ...process.env, SAMBANOVA_API_KEY: '78355605-7234-4181-96c7-8c36d3be9b4d' }
    });

    results += '```text\n';
    if (res.stdout) results += res.stdout.toString();
    if (res.stderr) results += res.stderr.toString();
    if (res.error) results += res.error.message;
    results += '\n```\n';
});

fs.writeFileSync('validation_logs.md', results);
console.log('Validations complete. Output written to validation_logs.md');
