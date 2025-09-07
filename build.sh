#!/usr/bin/env bash
set -euo pipefail

: "${APP:=inbound-carrier-sales-$(openssl rand -hex 4)}"
echo "Using app: $APP"

# Create app if missing
flyctl apps create "$APP" || true

# Set required secrets (no duplicates)
flyctl secrets set -a "$APP" \
  API_KEY=dev-secret-key \
  NEXT_PUBLIC_API_KEY=dev-secret-key \
  NEXT_PUBLIC_BASE_URL="https://$APP.fly.dev"

# Ensure port 3000 (Next default) and Fly maps it via fly.toml http_service
flyctl secrets unset -a "$APP" PORT || true

# Deploy with cache-bust
flyctl deploy -a "$APP" --build-arg CACHEBUST=$(date +%s)

echo "Open: https://$APP.fly.dev"
echo "Metrics: curl -H 'x-api-key: dev-secret-key' https://$APP.fly.dev/api/metrics"
