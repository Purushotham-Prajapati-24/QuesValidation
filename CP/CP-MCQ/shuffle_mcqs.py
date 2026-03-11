import json
import random
import os

directory = r"d:\College Projects\CodeLearn(Json files)\CP\CP-MCQ"

def process_file(filepath):
    if not os.path.exists(filepath):
        return
        
    with open(filepath, 'r', encoding='utf-8') as f:
        try:
            data = json.load(f)
        except json.JSONDecodeError:
            print(f"Error parsing JSON in {filepath}")
            return
            
    if not isinstance(data, list):
        return
        
    modified = False
    for q in data:
        if "marks" in q:
            q["marks"] = 1
            modified = True
            
        if "options" in q and isinstance(q["options"], list):
            options = q["options"]
            
            # Find the correct text before shuffling
            correct_text = None
            for opt in options:
                if opt.get("is_correct"):
                    correct_text = opt.get("text")
                    break
            
            if correct_text is not None:
                random.shuffle(options)
                
                # Update answer key based on new position
                for i, opt in enumerate(options):
                    if opt.get("text") == correct_text:
                        q["answer"] = f"o{i+1}"
                        break
                modified = True
                
    if modified:
        with open(filepath, 'w', encoding='utf-8') as f:
            # We want to match the previous compact option formatting if possible
            # Standard json.dump will format the whole options dict on multiple lines
            # This is acceptable for JSON validity, but formatting may slightly drift.
            json.dump(data, f, indent=4)
        print(f"Processed and shuffled: {os.path.basename(filepath)}")

# List of all standard topic files we've touched or might exist
topics = [
    "Trees.json", "Graphs.json", "DynamicProgramming.json", 
    "Heaps.json", "Hashing.json", "UnionFind.json", 
    "RangeQueryStructures.json", "StringStructures.json", 
    "SortingAndSearching.json", "BasicDataStructures.json", 
    "BitManipulation.json", "Mathematics.json", "Greedy.json"
]

for topic in topics:
    filepath = os.path.join(directory, topic)
    process_file(filepath)

print("Processing complete.")
