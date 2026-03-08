# Report: `sample.json`

## Question 1

**ID:** `0116ce3c-24e6-42d6-ad46-77bcb6b46b0d`
**Type:** MCQ
**Difficulty:** HARD
**Language:** C

**Question:**  
Analyze the C code below, paying close attention to operator precedence, side effects of increment operators, and short-circuit evaluation. What will be the final values of a, b, and c printed to the console?

```c
#include <stdio.h>

int main() {
    int a = 5, b = 10, c = 15;
    if ((a++ > 5) && (b++ > 10)) {
        c += a;
    } else if ((++b > 10) || (c++ > 15)) {
        c += b;
    } else {
        c += 1;
    }
    printf("a=%d, b=%d, c=%d\n", a, b, c);
    return 0;
}
```

**Options:**  
- **A:** a=6, b=11, c=26
- **B:** a=6, b=11, c=27
- **C:** a=6, b=12, c=28
- **D:** a=5, b=10, c=16

**Correct Answer:** A

**Solution Explanation:**  
1. *Initialization: Variables are initialized as a = 5, b = 10, c = 15.
2. **First if Condition: The condition (a++ > 5) && (b++ > 10) is evaluated.
   - a++ > 5: The value of a (5) is used in the comparison 5 > 5, which is **false. Then, a is incremented to 6 (post-increment).
   - **Short-circuiting: Since the left side of the logical AND (&&) is false, the right side (b++ > 10) is **not evaluated. Therefore, b remains 10.
   - The entire if condition is false.
3. *else if Condition*: The condition (++b > 10) || (c++ > 15) is evaluated.
   - ++b > 10: b is first incremented to 11 (pre-increment). Then, the value 11 is used in the comparison 11 > 10, which is **true. b is now 11.
   - **Short-circuiting: Since the left side of the logical OR (||) is true, the right side (c++ > 15) is **not evaluated. Therefore, c remains 15.
   - The entire else if condition is true.
4. *else if Block Execution*: The code inside the else if block is executed: c += b;.
   - The current value of c is 15 and b is 11. So, c becomes 15 + 11 = 26.
5. *else Block*: The else block is skipped because the else if condition was true.
6. **Final Output*: The printf statement prints the final values of the variables.
   - a is 6.
   - b is 11.
   - c is 26.
   - The output is a=6, b=11, c=26.
