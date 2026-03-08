# Rules for Generating Math Questions JSON

This document outlines the strict rules and structure for generating JSON files containing mathematical questions based on a provided syllabus. Whenever a new syllabus or topic list is provided, generate questions that strictly adhere to these specifications.

## 1. Overall JSON Structure
The output must be a valid JSON array containing a single root object. The root object represents the overall section (e.g., "Section-B") and contains a `children` array that groups questions by syllabus unit.

```json
[
  {
    "name": "Section-B",
    "questions": [],
    "children": [
      {
        "name": "UNIT - X: UNIT TITLE",
        "questions": [
           // Question objects go here
        ]
      }
    ]
  }
]
```

## 2. Unit/Child Object Structure
For each unit in the syllabus, create a child object within the `children` array containing:
- `name`: The exact unit name and title from the syllabus (e.g., "UNIT - II: HIGHER ORDER ORDINARY DIFFERENTIAL EQUATIONS WITH CONSTANT COEFFICIENTS").
- `questions`: An array containing the generated question objects for this specific unit.

## 3. Question Object Schema
Every question inside the `questions` array must strictly follow this schema and include all these keys:

- `id` (String): A unique identifier for the question. The format should generally follow `{prefix}{Unit_Number}01-q{Question_Number}` (e.g., `"e201-q1"` for Unit 2, Question 1, or `"e301-q4"` for Unit 3, Question 4).
- `question_text` (String): The problem statement. All mathematical equations, variables, and expressions must be wrapped in inline LaTeX syntax using single dollar signs (`$...$`).
- `question_type` (String): Must always be exactly `"LATEX"`.
- `difficulty` (String): Must be one of `"EASY"`, `"MEDIUM"`, or `"HARD"`. Ensure a realistic mix of difficulties within each unit.
- `answer` (String): The step-by-step mathematical solution, formatted using Markdown headers.
  - Break down the solution using headers like `### Step 1: [Step Name]`, `### Step 2: [Step Name]`, etc.
  - End with a `### Final Solution` header containing the final answer.
  - All mathematical expressions within the answer must use inline LaTeX syntax (`$...$`).
  - Use newline characters `\n` to separate lines and maintain readability within the JSON string.
- `solution_explanation` (String): A brief, abstract, one-sentence conceptual explanation of the mathematical method, theorem, or trick used to solve the given problem.
- `options` (null): Must be explicitly set to the primitive `null` (since these are subjective/long-form mathematical problems, not multiple-choice).
- `test_cases` (null): Must be explicitly set to the primitive `null`.

### Example Question Object:
```json
{
    "id": "e201-q1",
    "question_text": "Solve $(D+2)(D-1)^2y = e^{-2x} + 2\\sinh x$",
    "question_type": "LATEX",
    "difficulty": "MEDIUM",
    "answer": "### Step 1: Complementary Function (C.F.)\nThe auxiliary equation is $(m+2)(m-1)^2 = 0$. Roots are $m = -2, 1, 1$.\n$y_c = c_1 e^{-2x} + (c_2 + c_3 x)e^x$.\n\n### Step 2: Particular Integral (P.I.)\n$P.I. = \\frac{1}{(D+2)(D-1)^2} [e^{-2x} + e^x - e^{-x}]$.\n\n### Final Solution\n$y = c_1 e^{-2x} + (c_2 + c_3 x)e^x + \\frac{x e^{-2x}}{9} + \\frac{x^2 e^x}{6} - \\frac{e^{-x}}{4}$",
    "solution_explanation": "We solve the characteristic equation for roots and handle the 'Case of Failure' by differentiating the denominator for the P.I.",
    "options": null,
    "test_cases": null
}
```

## 4. Content Generation Guidelines
When a syllabus is provided for generation:
1. **Analyze the Syllabus:** Identify the key mathematical concepts, theorems, and specific types of problems required for each unit.
2. **Formulate Questions:** Create entirely new mathematical problems that accurately test the concepts. Include standard textbook-style problems alongside edge cases.
3. **Step-by-Step Accuracy:** Ensure the calculations provided in the `answer` string are mathematically rigorous, totally correct, and the methodology aligns with standard academic approaches.
4. **LaTeX Escaping Rules:** Because the output is JSON, you MUST properly escape LaTeX backslashes within strings. For example, `\frac` must be written as `\\frac`, `\sin` as `\\sin`, and `\cos` as `\\cos` in the JSON output.
