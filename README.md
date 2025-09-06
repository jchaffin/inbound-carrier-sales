## FDE Technical Challenge: Inbound Carrier Sales

This repository contains a working POC for automating inbound carrier calls using Next.js APIs, with mock integrations and a dashboard to visualize outcomes and metrics.

### Features
- Verify carriers via FMCSA mock (`/api/verify`)
- Search loads from mock data (`/api/loads`)
- Negotiate pricing with up to 3 rounds (`/api/negotiate`)
- Webhook-style agent endpoint for HappyRobot web call trigger (`/api/agent`)
- Log calls and summarize metrics (`/api/logs`)
  - Also records HappyRobot session status events at `/api/webhooks/happyrobot/session-status` and exposes status counts via `/api/logs` response field `hrStatusCounts`
- Dashboard UI at `/dashboard`
- API key middleware securing `/api/*`
- Dockerfile for containerization

### Quick Start
1. Copy env:
```bash
cp .env.example .env
```
2. Install deps:
```bash
npm install
```
3. Run dev:
```bash
npm run dev
```
4. Visit app:
 - App POC: http://localhost:3000
 - Dashboard: http://localhost:3000/dashboard

### Environment Variables
- `API_KEY`: required for API requests (middleware). Default `dev` in `.env.example`.
- `NEXT_PUBLIC_API_KEY`: sent by browser to call APIs. Default `dev`.
- `FMCSA_API_KEY`: when set, `/api/verify` will call the FMCSA API instead of mock data.
- `FMCSA_BASE_URL` (optional): override FMCSA API base URL. Defaults to `https://api.fmcsa.example`.

Clients must send header `x-api-key: <API_KEY>` on all `/api/*` calls.

### API Reference
- `GET /api/verify?mc=123456` → `{ status, eligible, legalName }`
  - Uses real FMCSA API if `FMCSA_API_KEY` is configured; otherwise falls back to mock verification.
- `GET /api/loads?origin=...&destination=...&equipment_type=...` → `{ results: Load[] }`
- `POST /api/negotiate` body:
```json
{ "sessionId": "uuid", "loadId": "L-1001", "listPrice": 2200, "carrierOffer": 2000 }
```
Response includes negotiation `state`, optional `systemOffer`, and `done` flag.
- `POST /api/logs` body: `CallLogEntry` to record a call. `GET /api/logs` returns `{ logs, metrics }`.
- `POST /api/agent` webhook driving the conversation with steps: `start|verify|search|negotiate|transfer|end`.

### HappyRobot Integration (Web Call Trigger)
Configure a web call trigger to POST to `https://<host>/api/agent` including `x-api-key` header and JSON body. Suggested flow:
1. Start: `{ "step": "start" }`
2. Provide MC: `{ "sessionId": "...", "step": "verify", "mcNumber": "123456" }`
3. Search: `{ "sessionId": "...", "step": "search", "search": { "origin": "Chicago, IL", "destination": "Dallas, TX", "equipment_type": "Dry Van" } }`
4. Negotiate counters: `{ "sessionId": "...", "step": "negotiate", "counterOffer": 2000, "transcriptSummary": "good" }`
5. Accept/transfer: `{ "sessionId": "...", "step": "negotiate", "accept": true }`

### HappyRobot Session Status Webhook
Configure the platform to send the CloudEvents payload documented in the HappyRobot docs to:
`POST /api/webhooks/happyrobot/session-status`

Reference: [HappyRobot session status change webhook](https://docs.happyrobot.ai/webhook-payload-contract/session-status-change)

### Docker
Build and run:
```bash
docker build -t inbound-carrier-sales .
docker run -e API_KEY=dev -e NEXT_PUBLIC_API_KEY=dev -p 3000:3000 inbound-carrier-sales
```

### Notes
- FMCSA integration is mocked with `verifyCarrier` but the scaffolding is present to swap to a real API.
- Data is in-memory for simplicity. Replace with DB for persistence.
