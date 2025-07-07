#!/bin/bash -e

# Script to typecheck individual TypeScript files with proper tsconfig path resolution
# Based on workaround from: https://github.com/microsoft/TypeScript/issues/41865

if [ $# -eq 0 ]; then
    echo "Usage: $0 <file1.ts> [file2.ts] ..."
    exit 1
fi

TMP=.tsconfig-single-file.json

# Create temporary tsconfig that extends main config and includes only specified files
cat >$TMP <<EOF
{
  "extends": "./tsconfig.json",
  "include": [
EOF

# Add each file to the include array
for file in "$@"; do
  echo "    \"$file\"," >> $TMP
done

# Add a dummy entry to prevent trailing comma issues
cat >>$TMP <<EOF
    "dummy-unused-entry"
  ]
}
EOF

echo "🔍 Type checking: $*"

# Run tsc with the temporary config
if bun tsc --project $TMP --skipLibCheck --noEmit; then
    echo "✅ Type check passed"
    rm -f $TMP
    exit 0
else
    echo "❌ Type check failed"
    rm -f $TMP
    exit 1
fi