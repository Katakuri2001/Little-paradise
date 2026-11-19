import json
import subprocess
import os

screen_files = [
    "e7e734ce2f6f489d84bc9aa1c50c42d1",
    "b5aed9f4205b4b848764152c0e0aa60b",
    "000b0ffad2b34bfd9f6db054fa855fde",
    "d4bb195f058d4338a74613e2ced133a5",
    "e47380ce2f6f489d84bc9aa1c50c42d1",
    "0dc7126c898042fc989d34e98da0543c",
    "339f539afbb04a45b2cc85d7e5ce9932",
    "9723fc58ef2a45429ad72b9b345c1b7c",
    "0c52066f3abe42ea9282fd64a639e21a",
    "3038cf4ba67c43deb625ea281421459a",
    "e7e734ce2f6f489d84bc9aa1c50c42d1"
]

api_key = "REDACTED"

for screen_id in screen_files:
    json_file = f"{screen_id}.json"
    html_file = f"{screen_id}.html"
    
    if not os.path.exists(json_file):
        print(f"Skipping {file} - no JSON file")
        continue
        
    with open(json_file) as f:
        data = json.load(f)
    
    download_url = data.get("htmlCode", {}).get("downloadUrl", "")
    if not download_url:
        print(f"No HTML URL for {screen_id} ({data.get('title', 'unknown')})")
        continue
    
    result = subprocess.run(
        ["curl", "-s", download_url, "-H", f"X-Goog-Api-Key: {api_key}"],
        capture_output=True, text=True
    )
    
    if result.returncode == 0:
        with open(html_file, "w") as f:
            f.write(result.stdout)
        print(f"Downloaded HTML for {data.get('title', screen_id)} ({len(result.stdout)} chars)")
    else:
        print(f"Failed to download HTML for {screen_id}: {result.stderr}")
