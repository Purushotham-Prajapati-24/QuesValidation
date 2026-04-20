# Prompt Engineering & Context Engineering Question Rules

## 1. Schema Adherence
All generated MCQ JSON files must strictly follow this key schema:
- `id`: Unique UUID format.
- `question`: The main question text.
- `question_type`: "MCQ"
- `difficulty_level`: "HARD", "MEDIUM", or "EASY".
- `answer`: "A", "B", "C", or "D".
- `options`: JSON object with keys "A", "B", "C", "D" containing the possible answers.
- `test_cases`: Usually `null` unless code evaluation is needed.
- `solution_explanation`: Detailed breakdown of why the correct answer is right and why others are wrong.
- `language`: `null` (since this is conceptual architecture/prompting, not specific code execution like C/C++).

## 2. High-Level Complexity
- **Professional Edge:** Questions must reflect 10+ years of enterprise experience. Avoid simple definitions (e.g., "What does RAG stand for?").
- **Scenario-Based:** Frame questions around real-world production issues (cost vs. token tradeoffs, context degradation, safety vs. capability conflicts, non-deterministic variance).
- **Nuance:** Options should be plausible but flawed (distractors should represent common junior engineer mistakes).

## 3. Explanation Structure
- **Core Concept:** Briefly explain the underlying mechanism in the explanation.
- **Why it's correct:** Justify the exact answer logically.
- **Why alternatives fail:** Provide a clear reason why the distractors are sub-optimal or factually wrong in production.

This rules file ensures that all context generated in the future aligns seamlessly with the initial request.
