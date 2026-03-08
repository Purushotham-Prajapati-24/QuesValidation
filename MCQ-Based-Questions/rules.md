# Rules for Generating MCQ JSON Files

When generating new Multiple Choice Questions (MCQs) for different topics, you must strictly follow the JSON schema and rules defined below. The output must be an array of JSON objects, where each object represents a single question.

### JSON Structure

Each question object must contain the following keys exactly as specified:

```json
[
  {
    "id": "UUID-string",
    "question": "Question text, optionally containing a code block.",
    "question_type": "MCQ",
    "difficulty_level": "EASY|MEDIUM|HARD",
    "answer": "A|B|C|D",
    "options": {
      "A": "Option A text",
      "B": "Option B text",
      "C": "Option C text",
      "D": "Option D text"
    },
    "test_cases": null,
    "solution_explanation": "Detailed step-by-step markdown explanation.",
    "language": "Language of the code (e.g., C, Python, JavaScript, null if logic/theory)"
  }
]
```

### Constraints & Rules

1. **`id` (String):**
   - Must be a valid UUID v4 format.
   - Example: `"0116ce3c-24e6-42d6-ad46-77bcb6b46b0d"`

2. **`question` (String):**
   - Must clearly state the problem.
   - If the question contains code, embed the code block within the text using standard markdown or newline formatting (e.g., `\n\n```c\n...code...\n```\n`).
   - Escape double quotes `"` and newlines `\n` appropriately for JSON.

3. **`question_type` (String):**
   - Must be strictly set to `"MCQ"`.

4. **`difficulty_level` (String):**
   - Must be one of: `"EASY"`, `"MEDIUM"`, `"HARD"`.
   - **Difficulty Priority Rule:** For every set of 10 questions, strictly follow this distribution:
     - **MEDIUM** — majority (typically 5–6 questions). Core conceptual, pointer logic, edge cases.
     - **HARD** — secondary (typically 2–3 questions). Multi-step reasoning, complex pointer manipulation or algorithm analysis.
     - **EASY** — minimum 2 questions. Fundamental definitions or straightforward single-concept checks.


5. **`options` (Object):**
   - Must have exactly four keys: `"A"`, `"B"`, `"C"`, `"D"`.
   - Each key must hold the corresponding option text as a string.
   - Make sure options are mutually exclusive and unambiguous.

6. **`answer` (String):**
   - Must be the exact key of the correct option: `"A"`, `"B"`, `"C"`, or `"D"`.

7. **`test_cases` (null):**
   - Must always be `null` for MCQs.

8. **`solution_explanation` (String):**
   - Provide a clear, step-by-step explanation of why the correct answer is right and why other plausible answers are wrong.
   - Format using markdown conventions inside the string (e.g., numbered lists `1. `, bullet points `- `, bold text `**`).
   - Use escaped newlines `\n` to maintain line breaks within the string.

9. **`language` (String):**
   - Specify the programming language if the question is code-related (e.g., `"C"`, `"Java"`, `"Python"`).
   - If the question is theoretical or not tied to a specific language, set it to `"General"` or `null`.

### Formatting Strictness
- Ensure the final output is **valid JSON**. Trailing commas or unescaped characters are not allowed.
- Keys must match the casing exactly as shown (snake_case).
