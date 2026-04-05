import pandas as pd
import re
import unicodedata

INPUT_FILE = 'Oldplayers.csv'
OUTPUT_FILE = 'players.csv'

def slugify(value: str) -> str:
    value = value.strip().lower()

    value = unicodedata.normalize('NFKD', value)
    value = "".join(ch for ch in value if not unicodedata.combining(ch))
    value = value.replace("'","").replace("'", "")
    value = re.sub(r"[^a-z0-9]+", "-", value)

    return value.strip("-")

df = pd.read_csv(INPUT_FILE)
df['name'] = df['name'].str.strip()
df['athlete_id'] = df['name'].apply(slugify)

df['athlete_id'] = (
    df['athlete_id'].groupby(df['athlete_id'])
    .cumcount().astype(str).replace('0','')
    .radd(df['athlete_id'])
)
df['espn_id'] = ''
df['category'] = ''

df = df[['name', 'athlete_id', 'espn_id', 'category']]

df.to_csv(OUTPUT_FILE, index=False)
print("Saved player file", OUTPUT_FILE)



