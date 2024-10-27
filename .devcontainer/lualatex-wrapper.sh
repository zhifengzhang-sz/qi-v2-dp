#!/bin/bash

# Define the URL of your Pandoc/LaTeX service (assuming it's the same service)
SERVICE_URL="http://pandoc-texlive:5000/compile"

# Check for the presence of any arguments
if [[ $# -lt 1 ]]; then
  echo "Usage: $0 [lualatex_arguments...]"
  exit 1
fi

# Capture all the arguments as they are
ARGS="$@"

# Call the LaTeX service via HTTP
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$SERVICE_URL" \
  -H "Content-Type: application/json" \
  -d "{\"type\": \"lualatex\", \"args\": \"$ARGS\"}")

# Separate response content and HTTP status code
HTTP_BODY=$(echo "$RESPONSE" | sed '$d')
HTTP_STATUS=$(echo "$RESPONSE" | tail -n1)

if [[ "$HTTP_STATUS" -ne 200 ]]; then
  echo "Error executing lualatex: $HTTP_BODY"
  exit 1
fi

echo "$HTTP_BODY"