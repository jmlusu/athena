#!/bin/sh
set -e

# Environment-aware security headers for dual-environment parity:
# In AI Studio preview, framing the app is allowed (backend CSP allows
# *.google.com / *.aistudio.google.com). Locally/production, keep DENY.
if [ "${AISTUDIO_PREVIEW:-false}" = "true" ]; then
  sed -i '/add_header X-Frame-Options/d' /etc/nginx/conf.d/default.conf
fi

exec "$@"