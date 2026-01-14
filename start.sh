#!/bin/sh
echo "=== DEBUG: Variables de Entorno ==="
echo "PORT: $PORT"
echo "GEMINI_API_KEY: ${GEMINI_API_KEY:0:20}..."
echo "NETLIFY_DATABASE_URL_UNPOOLED: ${NETLIFY_DATABASE_URL_UNPOOLED:0:40}..."
echo "DATABASE_URL: ${DATABASE_URL:0:40}..."
echo "=================================="
node server.js
