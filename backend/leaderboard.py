from scraper import fetch_espn_leaderboard, map_espn_field
from scoring import score_field, SCORING_RULES, classify_result
import time
from dataclasses import dataclass
from typing import Dict, List


@dataclass
class HoleScore:
    round:int
    hole:int
    par:int
    strokes:int
    result:str
    points: float

@dataclass
class LivePlayerScorecard:
    athlete_id: str
    name: str
    fantasy_points: float
    holes: List[HoleScore]
    updated_ts: float


def get_leaderboard():
    data = fetch_espn_leaderboard()
    golfers = map_espn_field(data)

    scored_field = score_field(golfers, SCORING_RULES)

    leaderboard = sorted(
        scored_field,
        key=lambda x: x['fantasy_points'],
        reverse=True
    )
    return leaderboard

def print_top(top : int):
    leaderboard = get_leaderboard()
    for player in leaderboard[:top]:
        print(player['name'], player['fantasy_points'])

def slugify(s: str) -> str:
    return (
        s.strip()
        .lower()
        .replace("’", "")
        .replace("'", "")
        .replace(".", "")
        .replace(",", "")
        .replace("å", "a")
        .replace("ö", "o")
        .replace("ä", "a")
        .replace("ü", "u")
        .replace("é", "e")
        .replace("è", "e")
        .replace("ê", "e")
        .replace("á", "a")
        .replace("í", "i")
        .replace("ó", "o")
        .replace("ú", "u")
        .replace("ñ", "n")
        .replace(" ", "-")
    )

def points_for_result(result: str) -> float:
    return SCORING_RULES['hole_points'].get(result, 0)

def build_hole_list(rounds: list[list[dict]]) -> list[HoleScore]:
    holes_out = []
    for index, data in enumerate(rounds, start = 1):
        for hole in data:
            strokes = hole.get('strokes')
            par = hole.get('par')

            if strokes is None or par is None:
                continue

            result = classify_result(strokes, par)

            holes_out.append(
                HoleScore(
                    round=index,
                    hole=hole.get('hole'),
                    par=par,
                    strokes=strokes,
                    result=result,
                    points=points_for_result(result)

                )
            )
    return holes_out

def fetch_live_scorecards() -> Dict[str, LivePlayerScorecard]:
    data = fetch_espn_leaderboard()
    golfers = map_espn_field(data)
    scored = score_field(golfers, SCORING_RULES)

    out: Dict[str, LivePlayerScorecard] = {}

    for raw_golfer, scored_golfer in zip(golfers, scored):
        athlete_id = slugify(raw_golfer['name'])

        out[athlete_id] = LivePlayerScorecard(
            athlete_id=athlete_id,
            name=raw_golfer['name'],
            fantasy_points=scored_golfer['fantasy_points'],
            holes=build_hole_list(raw_golfer['rounds']),
            updated_ts=time.time(),
        )
    return out





#QuickTest

#print_top(10)