#!/bin/bash

# URL of your Pandoc service
SERVICE_URL="http://pandoc-texlive:5000/convert"

# Check for the presence of at least one argument to prevent running with empty input
if [[ $# -lt 1 ]]; then
  echo "Usage: $0 [pandoc_arguments...]"
  exit 1
fi

# Capture all the arguments as they are
ARGS="$@"

# Call the Pandoc service via HTTP
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$SERVICE_URL" \
  -H "Content-Type: application/json" \
  -d "{\"args\": \"$ARGS\"}")

# Separate response content and HTTP status code
HTTP_BODY=$(echo "$RESPONSE" | sed '$d')
HTTP_STATUS=$(echo "$RESPONSE" | tail -n1)

if [[ "$HTTP_STATUS" -ne 200 ]]; then
  echo "Error executing Pandoc: $HTTP_BODY"
  exit 1
fi

echo "$HTTP_BODY"