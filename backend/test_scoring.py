from scoring import score_golfer, SCORING_RULES

# Simple test golfer
golfer_data = {
    "name": "Clavicular",
    "rounds": [
        [
            {"hole": 1, "par": 4, "strokes": 3},  # birdie
            {"hole": 2, "par": 5, "strokes": 4},  # birdie
            {"hole": 3, "par": 3, "strokes": 2},  # birdie → streak
            {"hole": 4, "par": 4, "strokes": 4},  # par
            {"hole": 5, "par": 4, "strokes": 5},  # bogey
        ]
    ],
    "finishing_position": 12
}

result = score_golfer(golfer_data, SCORING_RULES)

print("FINAL RESULT:")
print(result)