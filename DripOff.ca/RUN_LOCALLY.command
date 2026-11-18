#!/bin/bash
# Double-click this file to preview the DripOff catalog on this Mac.
cd "$(dirname "$0")" || exit 1

PORT=8766
URL="http://127.0.0.1:$PORT/index.html"

if curl -s -o /dev/null "$URL"; then
  echo "Catalog is already running at $URL — opening it in your browser."
else
  echo "Starting the catalog at $URL"
  echo "Leave this window open while you use the site. Press Ctrl+C to stop it."
  python3 -m http.server "$PORT" --bind 127.0.0.1 &
  SERVER_PID=$!
  sleep 1
  open "$URL"
  wait "$SERVER_PID"
fi
