# Logical Differences & Evolution Report: Weeks 1, 4, 5, 6

This report documents the logical evolution and structural differences across the coding exercises strictly enforced in the JSON OJ configurations for Weeks 1 (Stacks), 4 (Deque), 5 (Single Linked List), and 6 (Circular Linked List).

## 1. Memory Management Paradigm Shift
The most fundamental logical difference observed between the weeks is how the program accesses and restricts memory allocation.

*   **Weeks 1 & 4 (Stacks & Deques):** These exercises strictly rely on **Static Array Allocation** (e.g., `int stack[100]`, `int dq[100]`). 
    *   *Logical constraint:* The structure has a hard physical bound. 
    *   *System implication:* The algorithmic complexity centers heavily around managing index pointers (`top`, `front`, `rear`) to prevent exceeding available physical space (`Overflow`) or attempting to read past an empty array (`Underflow`).
*   **Weeks 5 & 6 (Single & Circular Linked Lists):** These exercises transition completely to **Dynamic Memory Allocation** (e.g., `malloc(sizeof(Node))`).
    *   *Logical constraint:* The physical size limit is virtually boundless (bounded only by machine RAM or OJ constraints). 
    *   *System implication:* Programming logic shifts completely from "Is there room in my array?" to "Did I correctly allocate and free memory addresses?" Missing a `free()` call creates memory leaks, and mishandling a pointer creates catastrophic Segmentation Faults (Segfaults). "Overflow" warnings virtually disappear from these questions.

## 2. Traversal & Looping Mechanics
How the back-end evaluation algorithm iterates through the data changes significantly as the data structures evolve.

*   **Week 1 (Stacks):** Pure **linear integer iteration**. `for(int i = top; i >= 0; i--)` directly reads backwards sequentially through contiguous memory spaces. 
*   **Week 4 (Deques):** **Wrapped/Circular Modulus iteration**. A `while(1)` or index-wrapping loop is required because the `front` index functionally can be geometrically "higher" than the `rear` index due to circular buffering (e.g., front = 99, rear = 0).
*   **Week 5 (Single Linked List):** **Pointer-link iteration**. Iteration depends purely on `NULL` checks (`while(t != NULL)`). The program physically leaps across non-contiguous memory sectors by reading the `->next` address. 
*   **Week 6 (Circular Linked List):** **Endless Ring logic**. The most complex traversal paradigm. Because there is no `NULL` terminator, standard loops would run infinitely and crash the backend. Iterators must use `do { ... } while(t != head);` to artificially verify if they have completed exactly one cycle relative to their geometric start position. 

## 3. Boundary & Node Deletion Mechanics
A major difference lies in how elements are logically removed and how the system prevents crashes when boundaries are hit.

*   **Weeks 1 & 4 (Arrays):** "Deleting" (e.g., `pop` or `delete_front`) is purely theoretical. The OJ scripts simply execute `top--` or `front++`. *The physical data remains in the array*, it is simply ignored by the mathematical boundary pointers.
*   **Weeks 5 & 6 (Nodes):** "Deleting" is a rigorous physical action. 
    *   The `->next` links of the surrounding nodes must be surgically disconnected and bypassed.
    *   The orphaned node must be explicitly deleted from RAM using `free(tmp)`.
    *   *Logical Difference in W6:* Deleting the *final remaining node* in a Circular Linked List requires uniquely breaking the `tail->next = head` cycle by forcefully assigning them to `NULL` to prevent rogue memory references.

## 4. Advanced Algorithmic Implementations (Tortoise & Hare, Anchors)
The style of problem-solving evolves from pure data storage to abstract mathematical manipulation in later weeks.

*   **Weeks 1 & 4:** Problems rely on **Sequence manipulation** (e.g., Array Reversals, Palindrome bridging). Accessing any variable costs `O(1)` time instantly via indexes.
*   **Week 5:** Problems introduce **Algorithmic pointer logic**. Since direct index access `[i]` is impossible, the solutions introduce standard OJ mechanics like the "Tortoise and Hare" algorithm (moving one pointer fast, one slowly) to discover the Middle element in `O(N)` without explicitly counting the size, or utilizing **Dummy Nodes** as anchors to seamlessly merge multiple lists efficiently.
*   **Week 6:** Problems require **Cycle Detection**. Determining if a loop is inherently circular demands traversing it and explicitly confirming the `->next` geometric path organically crashes back into the established `head` memory address, not just reaching an end.

## 5. OJ Script Validation Strategies
Across all four weeks, one persistent logical thread bridges the datasets: 
1.  **Strict Safe Parsing:** `if(scanf("%d", &n) != 1) return 0;` prevents infinite loops if test cases break.
2.  **Robust Error Printouts:** The usage of exact string outputs ("Underflow", "Empty", "Overflow", "Not Found") establishes a universal expected contract across completely different architectural topics.
