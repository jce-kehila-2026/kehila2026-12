# Translate Worker (Azure Translator proxy)

A tiny Cloudflare Worker that hides the Azure Translator key. The Shena app calls
this Worker (never Azure directly) to translate admin-edited content into
Hebrew / English / Arabic at save time.

- **Cost:** Cloudflare Workers free plan (100k requests/day, no credit card) +
  Azure Translator **F0** free tier (2M characters/month). No billing required.
- **Contract:** `POST { texts: string[], to?: string[] }` →
  `{ results: Array<{ he, en, ar }> }` (aligned to `texts`).

## 1. Create the Azure Translator resource
1. https://portal.azure.com → **Create a resource** → search **"Translator"** → Create.
2. Pricing tier: **Free F0**. Pick a region (note its name, e.g. `westeurope`).
3. After it deploys → **Keys and Endpoint** → copy **Key 1** and the **Location/Region**.

## 2. Deploy the Worker (dashboard, no CLI needed)
1. https://dash.cloudflare.com → **Workers & Pages** → **Create** → **Create Worker**.
2. Name it e.g. `shena-translate`, deploy the default, then **Edit code**.
3. Paste the contents of [`worker.js`](./worker.js) and **Deploy**.
4. **Settings → Variables**:
   - `AZURE_KEY` → **Encrypt** (Secret) → paste Azure Key 1.
   - `AZURE_REGION` → your region, e.g. `westeurope`.
   - `ALLOWED_ORIGINS` → `http://localhost:5173,https://YOUR-PROD-DOMAIN`
     (add your real deployed domain; keep localhost for dev).
5. Copy the Worker URL, e.g. `https://shena-translate.<account>.workers.dev`.

> Alternative: `npx wrangler deploy` + `npx wrangler secret put AZURE_KEY`.

## 3. Point the app at it
In `frontend/.env.local`:

```
VITE_TRANSLATE_PROXY_URL=https://shena-translate.<account>.workers.dev
```

Then restart `npm run dev`.

## 4. Test it
```bash
curl -X POST "$VITE_TRANSLATE_PROXY_URL" \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:5173" \
  -d '{"texts":["שלום עולם"]}'
# → {"results":[{"he":"שלום עולם","en":"Hello world","ar":"مرحبا بالعالم"}]}
```
