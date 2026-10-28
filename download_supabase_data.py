"""
Skript pro stazeni veskerych dat z databaze Supabase (tabulka votes).
Uklada data do JSON i CSV a spocita vysledne Elo hodnoceni deliktu.
"""

import json
import csv
import os
import sys
import urllib.request
import urllib.error

SUPABASE_URL = "https://byvjqnbpltjwcluigkfj.supabase.co"
SUPABASE_KEY = "sb_publishable_IMAMxmi6B1ui_CposyQnGA_G_wZPVcd"

PAGE_SIZE = 1000

def fetch_all_votes(url=SUPABASE_URL, key=SUPABASE_KEY):
    print(f"Pripajeni k Supabase: {url}")
    all_votes = []
    page = 0

    while True:
        from_idx = page * PAGE_SIZE
        to_idx = from_idx + PAGE_SIZE - 1
        endpoint = f"{url}/rest/v1/votes?select=*&order=created_at.asc"

        req = urllib.request.Request(endpoint, headers={
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Range": f"{from_idx}-{to_idx}"
        })

        try:
            with urllib.request.urlopen(req) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                if not data or not isinstance(data, list):
                    break
                all_votes.extend(data)
                print(f"Nacteno {len(all_votes)} hlasu (stranka {page + 1})...")
                if len(data) < PAGE_SIZE:
                    break
                page += 1
        except urllib.error.HTTPError as e:
            err_body = e.read().decode("utf-8", errors="ignore")
            print(f"HTTP Chyba {e.code}: {err_body}")
            raise
        except Exception as e:
            print(f"Chyba pripojeni: {e}")
            raise

    return all_votes

def save_votes(votes):
    json_path = "supabase_votes_export.json"
    csv_path = "supabase_votes_export.csv"

    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(votes, f, ensure_ascii=False, indent=2)
    print(f"Ulozeno do {json_path} ({len(votes)} zaznamu)")

    if votes:
        keys = list(votes[0].keys())
        with open(csv_path, "w", encoding="utf-8", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=keys)
            writer.writeheader()
            writer.writerows(votes)
        print(f"Ulozeno do {csv_path}")

def calculate_elo(votes):
    scores = {}
    k_factor = 24

    for v in votes:
        w_id = v.get("winner_id")
        l_id = v.get("loser_id")
        if not w_id or not l_id:
            continue

        if w_id not in scores:
            scores[w_id] = {"elo": 1500, "wins": 0, "matches": 0}
        if l_id not in scores:
            scores[l_id] = {"elo": 1500, "wins": 0, "matches": 0}

        w = scores[w_id]
        l = scores[l_id]
        expected_w = 1.0 / (1.0 + 10.0 ** ((l["elo"] - w["elo"]) / 400.0))
        w["elo"] += round(k_factor * (1.0 - expected_w))
        l["elo"] += round(k_factor * (0.0 - (1.0 - expected_w)))
        w["wins"] += 1
        w["matches"] += 1
        l["matches"] += 1

    return scores

if __name__ == "__main__":
    try:
        votes = fetch_all_votes()
        save_votes(votes)
        if votes:
            scores = calculate_elo(votes)
            with open("supabase_scores_summary.json", "w", encoding="utf-8") as f:
                json.dump(scores, f, ensure_ascii=False, indent=2)
            print("Vypocet Elo dokoncen a ulozen do supabase_scores_summary.json")
        else:
            print("V tabulce votes nebyly nalezeny zadne zaznamy.")
    except Exception as e:
        print(f"\nNelze stahnout data: {e}")
        print("\nTip: Pokud je projekt na Supabase v rezimu 'Paused' (pozastaveny z duvodu neaktivity),")
        print("staci otevrit https://supabase.com/dashboard a kliknout na 'Restore project'.")
