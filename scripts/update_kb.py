import json
import re
import os

# Define portion mapping (heuristic based on Sri Lankan cuisine)
PORTION_MAP = {
    "rice": "200g",
    "dhal": "100g",
    "fish": "100g",
    "chicken": "100g",
    "meat": "100g",
    "beef": "100g",
    "pork": "100g",
    "vegetable": "100g",
    "veg": "100g",
    "beans": "100g",
    "carrot": "100g",
    "beetroot": "100g",
    "pumpkin": "100g",
    "sambol": "30g",
    "mallung": "30g",
    "chutney": "30g",
    "string hoppers": "30g each",
    "string hopper": "30g each",
    "hoppers": "50g each",
    "hopper": "50g each",
    "roti": "60g each",
    "chapati": "60g each",
    "thosai": "80g each",
    "bread": "30g slice",
    "paan": "30g slice",
    "egg": "50g",
    "omelette": "60g",
    "fruit": "100g",
    "banana": "100g",
    "papaya": "100g",
    "curd": "150g",
    "yogurt": "125g",
    "oats": "50g (dry)",
    "chickpea": "150g",
    "green gram": "150g",
    "mung bean": "150g",
    "cowpea": "150g",
    "manioc": "150g",
    "sweet potato": "150g",
    "kiribath": "100g piece",
    "pittu": "100g piece",
    "kola kanda": "200ml",
    "tea": "200ml",
    "coffee": "200ml",
    "milk": "200ml",
    "nuts": "30g",
    "peanuts": "30g",
    "salad": "100g"
}

def estimate_portion(item_name):
    """
    Returns a portion string if a keyword is found in the item name.
    """
    item_lower = item_name.lower()
    
    # Check for specific quantity indicators in the text first (e.g., "2 cups")
    # If found, we might skip adding default or append it as clarification.
    # For now, we append defaults.
    
    found_portions = []
    
    # Sort keys by length desc to match "string hoppers" before "hoppers"
    sorted_keys = sorted(PORTION_MAP.keys(), key=len, reverse=True)
    
    for key in sorted_keys:
        if key in item_lower:
            # Avoid double matching (e.g. "rice flour roti" matching "rice" and "roti")
            # Simple heuristic: if we matched a longer key that contains this key, skip?
            # Actually, "rice flour roti" -> "roti" (60g) is better than "rice" (200g).
            # But "string hoppers" -> "string hoppers" (30g) is better than "hoppers" (50g).
            # The sorted order helps.
            
            # Check if this key is already covered by a longer match
            already_covered = False
            for found in found_portions:
                if key in found: 
                    already_covered = True
                    break
            
            if not already_covered:
                found_portions.append(key)
                
    if not found_portions:
        return ""
        
    # Construct portion string
    details = []
    for key in found_portions:
        # Don't add if the text already seems to have a quantity for this item
        # e.g. "2 roti" -> we can add "(~60g each)"
        details.append(f"{key.capitalize()}: ~{PORTION_MAP[key]}")
        
    return ", ".join(details)

def process_kb(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    updated_count = 0
    
    for entry in data:
        if entry.get('type') == 'meal_options':
            new_options = []
            options = entry.get('options', [])
            
            for opt in options:
                # Check if we already added portions (avoid re-running on updated file)
                if "(Approx." in opt:
                    new_options.append(opt)
                    continue
                
                # Split by '+' to analyze components
                components = [c.strip() for c in opt.split('+')]
                
                total_portions = []
                for comp in components:
                    p = estimate_portion(comp)
                    if p:
                        total_portions.append(p)
                
                # Deduplicate and format
                # Flatten list
                flat_portions = []
                for p_str in total_portions:
                    flat_portions.extend([x.strip() for x in p_str.split(',')])
                
                # Unique items, preserving order
                seen = set()
                unique_portions = []
                for p in flat_portions:
                    if p not in seen:
                        seen.add(p)
                        unique_portions.append(p)
                
                if unique_portions:
                    portion_text = "; ".join(unique_portions)
                    new_opt = f"{opt} (Approx. {portion_text})"
                    new_options.append(new_opt)
                else:
                    new_options.append(opt)
            
            if new_options != options:
                entry['options'] = new_options
                # Update text field too
                preamble = entry['text'].split(':')[0]
                numbered_list = [f"{i+1}) {opt}" for i, opt in enumerate(new_options)]
                entry['text'] = f"{preamble}: {' '.join(numbered_list)}"
                updated_count += 1
                
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4, ensure_ascii=False)
        
    print(f"Updated {updated_count} entries in {file_path}")

if __name__ == "__main__":
    kb_path = os.path.join(os.path.dirname(__file__), "../app/data/kb.json")
    process_kb(kb_path)
