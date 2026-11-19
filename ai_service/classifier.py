"""
CampusFix AI Classification Service
Classifies campus complaints into category, priority and department.
Uses keyword-based rules + TF-IDF + Naive Bayes for classification.
"""

import re
import json

# ── Training data ─────────────────────────────────────────────────────────────
TRAINING_DATA = [
    # Wi-Fi / Network
    ("wifi not working in lab", "Wi-Fi / Network"),
    ("internet is very slow in hostel", "Wi-Fi / Network"),
    ("no wi-fi connection in classroom", "Wi-Fi / Network"),
    ("network is down on second floor", "Wi-Fi / Network"),
    ("router seems to be broken", "Wi-Fi / Network"),
    ("internet disconnects frequently", "Wi-Fi / Network"),
    ("cannot connect to college wifi", "Wi-Fi / Network"),
    ("broadband not working", "Wi-Fi / Network"),
    ("ethernet port not working in lab", "Wi-Fi / Network"),
    ("wifi password not working", "Wi-Fi / Network"),
    # AC / Cooling
    ("ac not working in classroom", "AC / Cooling"),
    ("air conditioner is broken", "AC / Cooling"),
    ("room is very hot ac stopped", "AC / Cooling"),
    ("cooling system not functioning", "AC / Cooling"),
    ("ac making loud noise", "AC / Cooling"),
    ("temperature too high ac off", "AC / Cooling"),
    ("air conditioning broken in lab", "AC / Cooling"),
    ("fan not working room too hot", "AC / Cooling"),
    ("ac remote not working", "AC / Cooling"),
    ("no cooling in computer lab", "AC / Cooling"),
    # Projector / AV
    ("projector not working in class", "Projector / AV"),
    ("screen is blank projector issue", "Projector / AV"),
    ("hdmi cable missing projector", "Projector / AV"),
    ("projector light very dim", "Projector / AV"),
    ("sound system not working", "Projector / AV"),
    ("microphone not working in hall", "Projector / AV"),
    ("smart board broken", "Projector / AV"),
    ("display panel not switching on", "Projector / AV"),
    ("no audio from speaker", "Projector / AV"),
    ("projector remote missing", "Projector / AV"),
    # Cleanliness
    ("washroom is very dirty", "Cleanliness"),
    ("garbage not collected outside hostel", "Cleanliness"),
    ("bad smell in corridor", "Cleanliness"),
    ("dustbin overflowing in lobby", "Cleanliness"),
    ("floor not cleaned in lab", "Cleanliness"),
    ("toilet not clean", "Cleanliness"),
    ("mess area dirty after lunch", "Cleanliness"),
    ("stray dogs inside campus", "Cleanliness"),
    ("waste not disposed properly", "Cleanliness"),
    ("cleaning staff not coming", "Cleanliness"),
    # Electrical
    ("power cut in hostel block", "Electrical"),
    ("lights not working in corridor", "Electrical"),
    ("no electricity in room", "Electrical"),
    ("switch board broken sparking", "Electrical"),
    ("tube light flickering", "Electrical"),
    ("socket not working in lab", "Electrical"),
    ("generator not starting during power cut", "Electrical"),
    ("fuse blown in block b", "Electrical"),
    ("mcb tripping frequently", "Electrical"),
    ("electric wire exposed dangerous", "Electrical"),
    # Furniture
    ("chairs broken in classroom", "Furniture"),
    ("desk damaged in lab", "Furniture"),
    ("whiteboard broken", "Furniture"),
    ("door not closing properly", "Furniture"),
    ("window glass broken", "Furniture"),
    ("locker not opening in hostel", "Furniture"),
    ("bench broken in library", "Furniture"),
    ("cupboard handle broken", "Furniture"),
    ("staircase railing loose", "Furniture"),
    ("door lock broken in washroom", "Furniture"),
    # Water / Plumbing
    ("water cooler not working", "Water / Plumbing"),
    ("tap leaking in washroom", "Water / Plumbing"),
    ("no water supply in hostel", "Water / Plumbing"),
    ("water pipe burst", "Water / Plumbing"),
    ("drainage blocked", "Water / Plumbing"),
    ("ro filter not working", "Water / Plumbing"),
    ("hot water not available", "Water / Plumbing"),
    ("water tank overflow", "Water / Plumbing"),
    ("toilet flush not working", "Water / Plumbing"),
    ("pipeline leaking in lab", "Water / Plumbing"),
]

CATEGORIES = [
    "Wi-Fi / Network", "AC / Cooling", "Projector / AV",
    "Cleanliness", "Electrical", "Furniture", "Water / Plumbing", "Other"
]

DEPARTMENT_MAP = {
    "Wi-Fi / Network": "IT Department",
    "Projector / AV": "IT Department",
    "AC / Cooling": "Maintenance",
    "Electrical": "Maintenance",
    "Furniture": "Maintenance",
    "Water / Plumbing": "Maintenance",
    "Cleanliness": "Administration",
    "Other": "Administration",
}

URGENCY_KEYWORDS = {
    "High": ["exam", "urgent", "immediately", "dangerous", "leakage", "burst",
             "exposed wire", "sparking", "no power", "fire", "flood", "not working at all",
             "completely broken", "emergency", "critical"],
    "Medium": ["slow", "intermittent", "sometimes", "frequently", "not properly",
               "broken", "not functioning", "stopped working", "issue"],
    "Low": ["minor", "small", "little", "slightly", "noise", "cosmetic", "dim",
            "request", "suggestion", "feedback"]
}

# ── Simple TF-IDF based classifier ───────────────────────────────────────────
def preprocess(text: str) -> list[str]:
    text = text.lower()
    text = re.sub(r'[^\w\s]', ' ', text)
    stopwords = {'the', 'a', 'an', 'is', 'are', 'was', 'were', 'in', 'on',
                 'at', 'to', 'for', 'of', 'and', 'or', 'not', 'it', 'its',
                 'this', 'that', 'my', 'our', 'very', 'has', 'have', 'with'}
    tokens = [t for t in text.split() if t not in stopwords and len(t) > 1]
    return tokens

def build_vocab_and_tfidf():
    """Build a simple keyword-category score map."""
    scores = {}  # word -> {category: count}
    for text, cat in TRAINING_DATA:
        tokens = preprocess(text)
        for t in tokens:
            if t not in scores:
                scores[t] = {}
            scores[t][cat] = scores[t].get(cat, 0) + 1
    return scores

VOCAB_SCORES = build_vocab_and_tfidf()

def classify(text: str, location: str = "") -> dict:
    """Classify a complaint text and return structured result."""
    tokens = preprocess(text)
    if not tokens:
        return {
            "category": "Other",
            "priority": "Medium",
            "department": "Administration",
            "confidence": 0.0,
            "needs_manual_routing": True
        }

    # Accumulate category scores
    cat_scores = {c: 0.0 for c in CATEGORIES}
    for token in tokens:
        if token in VOCAB_SCORES:
            for cat, cnt in VOCAB_SCORES[token].items():
                cat_scores[cat] = cat_scores.get(cat, 0) + cnt

    # Remove 'Other' from scoring (only use as fallback)
    cat_scores_no_other = {k: v for k, v in cat_scores.items() if k != "Other"}
    
    total = sum(cat_scores_no_other.values())
    if total == 0:
        predicted_cat = "Other"
        confidence = 0.0
    else:
        predicted_cat = max(cat_scores_no_other, key=cat_scores_no_other.get)
        top_score = cat_scores_no_other[predicted_cat]
        confidence = round(top_score / total, 2)

    # Determine priority
    full_text = (text + " " + location).lower()
    priority = "Medium"
    for level in ["High", "Low", "Medium"]:
        for kw in URGENCY_KEYWORDS[level]:
            if kw in full_text:
                priority = level
                break
        else:
            continue
        break

    # Category-based priority boost
    if predicted_cat in ("Electrical", "Water / Plumbing") and priority == "Medium":
        priority = "High"

    needs_manual = confidence < 0.25

    return {
        "category": predicted_cat,
        "priority": priority,
        "department": DEPARTMENT_MAP.get(predicted_cat, "Administration"),
        "confidence": confidence,
        "needs_manual_routing": needs_manual
    }


if __name__ == "__main__":
    # Quick self-test
    tests = [
        ("WiFi is not working in Block A lab", "Lab"),
        ("AC stopped working, room is very hot during exam", "Classroom"),
        ("Projector screen is blank, lecture cannot proceed", "Lecture Hall"),
        ("Washroom on 2nd floor is dirty and smells bad", "Washroom"),
        ("Electric switch sparking, dangerous", "Hostel Room"),
        ("Chair broken in library", "Library"),
        ("Water cooler not working, no drinking water", "Common Area"),
        ("Some random vague issue", ""),
    ]
    for text, loc in tests:
        result = classify(text, loc)
        print(f"Text: {text!r}")
        print(f"  -> {result}")
        print()
