# Strict Guidelines for Generating CP-MCQ JSON Files

The generated MCQ JSON files must adhere rigidly to the structure, formatting, and particularities found in `mcq-sample.json`. Any generator must follow these exact instructions line by line, word by word, tracking every special character and convention used.

## JSON File Global Rules
1. **Single Object**: The file must contain a single JSON object.
2. **Key Sequencing**: Keys should appear in the following strict order: `question_text`, `difficulty`, `marks`, `explanation`, `answer`, `options`, `topics`, `companyIndex`.
3. **Indentation**: 
    - First-level keys must be indented with exactly 8 spaces.
    - Items inside the `options` array must be indented with exactly 12 spaces.
    - The opening `{` and closing `}` of the main object must be at column 0 (no indentation).
4. **Line Densification**: The keys `"difficulty"` and `"marks"` **MUST** be placed on the exact same line, separated by a comma and a single space (e.g., `        "difficulty": "EASY", "marks": 1,`).

## Detailed Key-by-Key Breakdown

### 1. `"question_text"` (String)
*   **Format**: Plain string.
*   **Structure**: Unlike coding questions, this string is plain text. Do NOT use HTML tags (like `<h3>` or `<p>`) unless explicitly part of the question's raw code block expectation. Must be a single line without literal `\n` characters breaking the JSON structure.

### 2. `"difficulty"` (String) & 3. `"marks"` (Integer)
*   **Format**: MUST be defined on the same line as mentioned above.
*   **`difficulty`**: Uppercase string. Allowed Values: `"EASY"`, `"MEDIUM"`, `"HARD"`. No extra spaces.
*   **`marks`**: Bare integer, NOT a string (e.g., `1`).

### 4. `"explanation"` (String)
*   **Format**: Plain text string. NO HTML tags. NO internal newline (`\n`) characters.
*   **Content**: Explain exactly why the correct answer is true and (if necessary) why others are false.

### 5. `"answer"` (String)
*   **Format**: A string linking to the correct option index using the prefix `"o"`.
*   **Rule**: The index is **1-based**. For example, if the 3rd option in the `options` array is the correct one, the value must be strictly `"o3"`.

### 6. `"options"` (Array of Objects)
*   **Structure**: A list of exactly 4 option objects.
*   **Formatting**: Each option object MUST be written entirely on a single line.
*   **Each object has exactly two keys**:
    *   `"text"` (String): The answer choice text. Do not include A/B/C/D prefixes.
    *   `"is_correct"` (Boolean): A boolean literal (`true` or `false`). No quotes. **Exactly one** option in the array must have `"is_correct": true`, and it must correspond linearly to the `"answer"` key (e.g., if `"answer": "o3"`, then the 3rd object must be `true`).

### 7. `"topics"` (Array of Strings)
*   **Format**: Title-cased typical algorithm/data structure topics (e.g., `["Sliding Window", "Array"]`).

### 8. `"companyIndex"` (Integer)
*   **Format**: Plain integer (e.g., `1`).
