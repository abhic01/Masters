from __future__ import annotations
from typing import Dict, Optional

POINTS_BY_RESULT: Dict[str, int] = {
    "ALBATROSS": 5,
    "DOUBLE_EAGLE": 5,
    "EAGLE": 2,
    "BIRDIE": 1,
    "PAR": 0,
    "BOGEY": -1,
    "DOUBLE_BOGEY": -2,
    "TRIPLE_BOGEY": -3,
    "QUADRUPLE_BOGEY": -4,
    "OTHER": 0,
}

def classify_result(strokes: Optional[int], par: Optional[int]) -> str:
    if strokes is None or par is None:
        return "OTHER"
    diff = strokes - par
    if diff <= -3:
        return "ALBATROSS"
    if diff == -2:
        return "EAGLE"
    if diff == -1:
        return "BIRDIE"
    if diff == 0:
        return "PAR"
    if diff == 1:
        return "BOGEY"
    if diff == 2:
        return "DOUBLE_BOGEY"
    if diff == 3:
        return "TRIPLE_BOGEY"
    return "QUADRUPLE_BOGEY"

def points_for_hole(strokes: Optional[int], par: Optional[int]) -> int:
    return POINTS_BY_RESULT.get(classify_result(strokes, par), POINTS_BY_RESULT["OTHER"])