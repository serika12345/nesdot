import json

with open('src-tauri/tauri.conf.json', 'r') as f:
    data = json.load(f)

data['tauri']['bundle']['externalBin'] = data['tauri']['bundle'].get('externalBin', [])
# We actually want to modify the CSP specifically
data['tauri']['security']['csp']['style-src'] = ["'self'"]

with open('src-tauri/tauri.conf.json', 'w') as f:
    json.dump(data, f, indent=2)
