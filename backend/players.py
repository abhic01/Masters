import requests
import pandas as pd
import json

url = "http://sports.core.api.espn.com/v2/sports/golf/leagues/pga/athletes/1792?lang=en&region=us"
resp = requests.get(url, params={"limit": 3, "page": 1}, timeout=15)
print(resp.status_code)
data = resp.json()
print(json.dumps(data, indent=2)[:2000])
items = data.get("items", [])
print(f"items on page 1: {len(items)}")




'''
url = "https://sports.core.api.espn.com/v2/sports/golf/leagues/pga/athletes"
resp = requests.get(url, params={"limit": 3, "page": 1}, timeout=15)
print(resp.status_code)
data = resp.json()
print(json.dumps(data, indent=2)[:2000])
'''

'''

players = []

for athlete in data.get("athletes", []):
    players.append({
        "name": athlete.get("displayName"),
        "espn_id": athlete.get("id")
    })

espn_df = pd.DataFrame(players)

players_df = pd.read_csv("players.csv")

# normalize both
players_df["name_clean"] = players_df["name"].str.lower().str.strip()
espn_df["name_clean"] = espn_df["name"].str.lower().str.strip()

merged = players_df.merge(
    espn_df[["name_clean", "espn_id"]],
    on="name_clean",
    how="left"
)

# fill espn_id
merged["espn_id"] = merged["espn_id_y"]

merged.drop(columns=["name_clean", "espn_id_y"], inplace=True)

merged.to_csv("players.csv", index=False)

'''