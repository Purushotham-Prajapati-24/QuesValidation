import json

def pa(arr):
    return " ".join(map(str, arr))

def c_merge(arr, l, m, r, out_str):
    n1 = m - l + 1
    n2 = r - m
    L = arr[l:l+n1]
    R = arr[m+1:m+1+n2]
    i = 0; j = 0; k = l
    while i < n1 and j < n2:
        if L[i] <= R[j]:
            arr[k] = L[i]
            i += 1
        else:
            arr[k] = R[j]
            j += 1
        k += 1
    while i < n1:
        arr[k] = L[i]
        i += 1
        k += 1
    while j < n2:
        arr[k] = R[j]
        j += 1
        k += 1
    out_str.append(pa(arr))

def c_mergeSort(arr, l, r, out_str):
    if l < r:
        m = l + (r - l) // 2
        c_mergeSort(arr, l, m, out_str)
        c_mergeSort(arr, m + 1, r, out_str)
        c_merge(arr, l, m, r, out_str)

def swap(arr, a, b):
    arr[a], arr[b] = arr[b], arr[a]

def c_partition(arr, low, high, out_str):
    pivot = arr[high]
    i = low - 1
    for j in range(low, high):
        if arr[j] < pivot:
            i += 1
            swap(arr, i, j)
    swap(arr, i + 1, high)
    out_str.append(pa(arr))
    return i + 1

def c_quickSort(arr, low, high, out_str):
    if low < high:
        pi = c_partition(arr, low, high, out_str)
        c_quickSort(arr, low, pi - 1, out_str)
        c_quickSort(arr, pi + 1, high, out_str)

def c_heapify(arr, sz, i):
    largest = i
    l = 2 * i + 1
    r = 2 * i + 2
    if l < sz and arr[l] > arr[largest]:
        largest = l
    if r < sz and arr[r] > arr[largest]:
        largest = r
    if largest != i:
        swap(arr, i, largest)
        c_heapify(arr, sz, largest)

def c_heapSort(arr, sz, out_str):
    for i in range(sz // 2 - 1, -1, -1):
        c_heapify(arr, sz, i)
    out_str.append(pa(arr))
    for i in range(sz - 1, 0, -1):
        swap(arr, 0, i)
        c_heapify(arr, i, 0)
        out_str.append(pa(arr))

def process_test(tc_input, algo):
    lines = tc_input.strip().split()
    if not lines:
        return "\n"
    n = int(lines[0])
    if n <= 0:
        return "\n"
    if n == 1:
        return lines[1]
    
    arr = [int(x) for x in lines[1:n+1]]
    out_str = []
    
    if algo == "Merge Sort":
        c_mergeSort(arr, 0, n - 1, out_str)
    elif algo == "Quick Sort":
        c_quickSort(arr, 0, n - 1, out_str)
    elif algo == "Heap Sort":
        c_heapSort(arr, n, out_str)
        
    return "\n".join(out_str)


def main():
    cse_file = r"d:\College Projects\CodeLearn(Json files)\question-CSE\week-10-cse.json"
    ame_11 = r"d:\College Projects\CodeLearn(Json files)\question-AME\week-11-AME.json"
    ame_12 = r"d:\College Projects\CodeLearn(Json files)\question-AME\week-12-AME.json"
    
    with open(cse_file, 'r', encoding='utf-8') as f:
        cse_data = json.load(f)
        
    with open(ame_11, 'r', encoding='utf-8') as f:
        ame_11_data = json.load(f)
        
    with open(ame_12, 'r', encoding='utf-8') as f:
        ame_12_data = json.load(f)
        
    ame_merge = ame_11_data[0]['questions'][0]
    ame_quick = ame_11_data[0]['questions'][1]
    ame_heap = ame_12_data[0]['questions'][0]
    
    for q in cse_data[0]['questions']:
        algo = None
        if "Merge Sort" in q['question_text']:
            source = ame_merge
            algo = "Merge Sort"
        elif "Heap Sort" in q['question_text']:
            source = ame_heap
            algo = "Heap Sort"
        elif "Quick Sort" in q['question_text']:
            source = ame_quick
            algo = "Quick Sort"
        else:
            continue
            
        q['question_text'] = source['question_text']
        q['question_description'] = source['question_description']
        q['output_format'] = source['output_format']
        q['hints'] = source['hints']
        q['answer'] = source['answer']
        
        print(f"Updating test cases for {algo}...")
        for tc in q['test_cases']:
            new_out = process_test(tc['input'], algo)
            tc['expectedOutput'] = new_out
                
    with open(cse_file, 'w', encoding='utf-8') as f:
        json.dump(cse_data, f, indent=4, ensure_ascii=False)
        
    print("Updated week-10-cse.json successfully!")

if __name__ == "__main__":
    main()
