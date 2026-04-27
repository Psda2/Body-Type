"""
Sri Lankan Food Calorie Lookup Table
--------------------------------------
Keys match EXACTLY the class names from the trained YOLO model
(lowercased versions of Roboflow dataset classes).

Sources: approximate values per standard Sri Lankan portion sizes.
"""

CALORIE_MAP: dict[str, dict] = {
    # class name (lowercased)      cal/100g   avg portion (g)
    "basmathi rice":        {"cal_per_100g": 130,  "avg_portion_g": 200},
    "bean curry":           {"cal_per_100g": 85,   "avg_portion_g": 120},
    "beat":                 {"cal_per_100g": 43,   "avg_portion_g": 80},   # beetroot
    "bitter gourd curry":   {"cal_per_100g": 55,   "avg_portion_g": 100},
    "boiled eggs":          {"cal_per_100g": 155,  "avg_portion_g": 60},   # 1 egg ~60g
    "brinjal":              {"cal_per_100g": 65,   "avg_portion_g": 100},
    "capsicum curry":       {"cal_per_100g": 60,   "avg_portion_g": 100},
    "cashew nuwt curry":    {"cal_per_100g": 180,  "avg_portion_g": 80},
    "cauliflower curry":    {"cal_per_100g": 55,   "avg_portion_g": 100},
    "chicken":              {"cal_per_100g": 165,  "avg_portion_g": 150},
    "coconut relish":       {"cal_per_100g": 200,  "avg_portion_g": 40},   # pol sambol
    "cucumber":             {"cal_per_100g": 16,   "avg_portion_g": 60},
    "cutlet":               {"cal_per_100g": 250,  "avg_portion_g": 60},
    "dhal curry":           {"cal_per_100g": 116,  "avg_portion_g": 100},
    "dried halmasso":       {"cal_per_100g": 275,  "avg_portion_g": 30},   # dried fish
    "fish ambulthiyal":     {"cal_per_100g": 120,  "avg_portion_g": 120},
    "fish curry":           {"cal_per_100g": 120,  "avg_portion_g": 130},
    "fried potato":         {"cal_per_100g": 270,  "avg_portion_g": 100},
    "fried sprat":          {"cal_per_100g": 290,  "avg_portion_g": 50},
    "grilled fish":         {"cal_per_100g": 130,  "avg_portion_g": 150},
    "lunu miris":           {"cal_per_100g": 80,   "avg_portion_g": 20},   # chilli relish
    "mallum":               {"cal_per_100g": 55,   "avg_portion_g": 80},
    "mango curry":          {"cal_per_100g": 75,   "avg_portion_g": 100},
    "meat curry":           {"cal_per_100g": 200,  "avg_portion_g": 150},
    "omlet":                {"cal_per_100g": 155,  "avg_portion_g": 80},
    "pappadam":             {"cal_per_100g": 380,  "avg_portion_g": 10},
    "pea curry":            {"cal_per_100g": 90,   "avg_portion_g": 100},
    "polos ambula":         {"cal_per_100g": 95,   "avg_portion_g": 120},  # jackfruit curry
    "potato milkycurry":    {"cal_per_100g": 95,   "avg_portion_g": 120},
    "pumpkin curry":        {"cal_per_100g": 60,   "avg_portion_g": 120},
    "shrimp curry":         {"cal_per_100g": 115,  "avg_portion_g": 130},
    "soya curry":           {"cal_per_100g": 130,  "avg_portion_g": 100},
    "vegetable salad":      {"cal_per_100g": 35,   "avg_portion_g": 80},
    "white rice":           {"cal_per_100g": 130,  "avg_portion_g": 200},
}


def get_calories(class_name: str) -> dict:
    """
    Return calorie info for a detected food class.
    Tries exact match first, then partial match, then returns a safe fallback.
    """
    key = class_name.lower().strip()

    # Exact match
    if key in CALORIE_MAP:
        return CALORIE_MAP[key]

    # Partial match (handles minor capitalisation/spacing drift from model)
    for known_key in CALORIE_MAP:
        if known_key in key or key in known_key:
            return CALORIE_MAP[known_key]

    # Unknown class fallback
    return {"cal_per_100g": 120, "avg_portion_g": 100}
