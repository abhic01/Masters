import requests
from scoring import score_golfer, SCORING_RULES

def fetch_espn_leaderboard():
    url = 'https://site.api.espn.com/apis/site/v2/sports/golf/pga/scoreboard'
    headers = {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/json'
    }
    response = requests.get(url, headers=headers, timeout=20)
    response.raise_for_status()
    return response.json()

def parse_score_to_int(score_value):
    '''
    Normalize everything to Integer(Currently Strings)
    '''
    if score_value in (None,'E', 'E'):
        return 0
    try:
        return int(score_value)
    except(TypeError, ValueError):
        return 0
    
def infer_finishing_position(raw_golfer: dict) -> int | None:
    '''Current leaderboard'''
    order = raw_golfer.get('order')
    if isinstance(order, int):
        return order
    
    return None


def map_espn_golfer(raw_golfer: dict) -> dict:
    '''
    Outputs normalized golfer objects
    Converts ESPN's JSON to our format
    '''
    #Player identity extraction
    athlete = raw_golfer.get('athlete', {})
    name = athlete.get('fullName')

    #Round data extraction
    raw_rounds = raw_golfer.get('linescores', [])
    rounds = []
    for raw_round in raw_rounds:
        holes = []
        for raw_hole in raw_round.get('linescores',[]):
            strokes = raw_hole.get('value')

            # Converts score to numeric value
            score_type = raw_hole.get('scoreType', {}).get('displayValue', 'E')
            if score_type == 'E':
                diff = 0
            else:
                try:
                    diff = int(score_type)
                except ValueError:
                    diff = 0

            # Par for the hole
            if strokes is not None:
                par = int(strokes - diff)
            else:
                par = None
            
            #Standardized hole object
            holes.append({
                'hole': raw_hole.get('period'),
                'strokes': int(strokes) if strokes is not None else None,
                'par': par,
                'hole_in_one': False
            })
        
        # Holds round information for all 18 holes
        rounds.append(holes)

    # Returns standardized golfer object
    return {
        'name': name,
        'rounds': rounds,
        'finishing_position': infer_finishing_position(raw_golfer),
        'status': raw_golfer.get('status'),
        'score_to_par': parse_score_to_int(raw_golfer.get('score'))
    }


def map_espn_field(data: dict) -> list[dict]:
    events = data.get('events', [])
    if not events:
        return []
    competitions = events[0].get('competitions')
    if not competitions:
        return []
    competitors = competitions[0].get('competitors', [])
    return [map_espn_golfer(c) for c in competitors]










