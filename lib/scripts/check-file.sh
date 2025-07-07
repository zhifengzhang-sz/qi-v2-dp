#!/bin/bash -e

# Script to typecheck individual TypeScript files from within lib directory
# Changes to root directory and uses the root tsconfig.json for proper path resolution

if [ $# -eq 0 ]; then
    echo "Usage: $0 <file1.ts> [file2.ts] ..."
    exit 1
fi

# Change to root directory where tsconfig.json is located
cd "$(dirname "$0")/../.."

TMP=.tsconfig-single-file.json

# Create temporary tsconfig that extends root config and includes only specified files
cat >$TMP <<EOF
{
  "extends": "./tsconfig.json",
  "include": [
EOF

# Add each file to the include array (prefix with lib/ for root tsconfig)
for file in "$@"; do
  echo "    \"lib/$file\"," >> $TMP
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