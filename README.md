# Where's Dad? 📍

A tiny, static "share my location" site for Nicola &amp; Elliott. No servers, no third-party
tracking apps — just this repo, GitHub Pages, and an iPhone Shortcut.

**How it works**
1. An iOS Shortcut on Dad's phone gets his current GPS location and commits an updated
   `data/location.json` straight to this repo using the GitHub REST API.
2. GitHub Pages serves `index.html`, which fetches `data/location.json` every minute and
   drops a pin on a map (Leaflet + OpenStreetMap, both free, no API key needed).
3. The site is public with no login — it's protected only by having an unguessable-ish
   nothing, i.e. it's fully open by design (per Derek's choice). Don't put anything
   sensitive in `location.json` beyond coordinates/timestamp.

## One-time setup

### 1. Enable GitHub Pages
Already configured by automation to serve from the `main` branch, root folder.
Site URL: `https://devopsderek.github.io/where-is-dad/`

### 2. Create a scoped GitHub Personal Access Token (for the Shortcut only)
Use a **fine-grained PAT**, restricted to this one repo, so a lost/stolen phone can't do
any damage beyond this repo's `data/location.json` file:

1. GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens →
   *Generate new token*.
2. Resource owner: `DevOpsDerek`. Repository access: **Only select repositories** →
   `where-is-dad`.
3. Permissions → Repository permissions → **Contents: Read and write**. Leave everything
   else as "No access".
4. Set an expiry (e.g. 90 days — just remember to rotate it before/after your trip) and
   generate the token. Copy it once; you won't see it again.

### 3. Build the iOS Shortcut
Create a new **Personal Automation** (Shortcuts app → Automation tab → + → Create Personal
Automation) so it can run unattended (turn OFF "Ask Before Running").

**Trigger:** "Location Changed" (fires on significant location changes — good balance of
freshness vs. battery while travelling). Alternative: a repeating "Time of Day" automation
if you want a fixed interval instead.

**Actions:**
1. `Get Current Location`
2. `Get Contents of URL`
   - URL: `https://api.github.com/repos/DevOpsDerek/where-is-dad/contents/data/location.json`
   - Method: GET
   - Headers: `Authorization: Bearer YOUR_PAT`, `Accept: application/vnd.github+json`
   - This returns the file's current `sha`, which GitHub requires for updates.
3. `Get Dictionary Value` → key `sha` from the result of step 2 → save as **Current SHA**.
4. `Text` action, build the JSON payload (use the Location variable from step 1 for
   latitude/longitude):
   ```
   {"lat": [Latitude], "lon": [Longitude], "timestamp": "[Current Date, ISO 8601]", "message": "Thinking of you both! ❤️"}
   ```
5. `Base64 Encode` the text from step 4 → save as **Encoded Content**.
6. `Get Contents of URL` (the actual update):
   - URL: same as step 2
   - Method: PUT
   - Headers: `Authorization: Bearer YOUR_PAT`, `Accept: application/vnd.github+json`
   - Request Body (JSON):
     ```
     {
       "message": "Update location",
       "content": "Encoded Content",
       "sha": "Current SHA",
       "branch": "main"
     }
     ```

That's it — every time the automation fires, it pushes a new `data/location.json`, GitHub
Pages picks it up on next fetch (within ~60s), and the map updates for anyone with the link.

## Security notes
- The site and the location file are fully public, per your choice — anyone with the URL
  can see your current pin. Don't share the link outside your family unless you're happy
  with that.
- The PAT lives only on your phone, inside the Shortcut, and can only write to this one
  file in this one repo — revoke/rotate it any time from GitHub token settings.
- If you change your mind later, you can add a passphrase gate in `script.js`, or make the
  repo private and add Cloudflare Access / a proper auth layer in front.
