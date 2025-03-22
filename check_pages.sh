#!/bin/bash

# Get all *.tsx files in src/pages
all_pages=$(find src/pages -type f -name "*.tsx" | sort)

# Get pages that have ThemeExtras interface
updated_pages=$(grep -l "interface ThemeExtras\|const themeColors" src/pages/*.tsx | sort | uniq)

# Compare and show pages that need to be updated
echo "Pages that need to be updated:"
for page in $all_pages; do
  if ! grep -q "$page" <<< "$updated_pages"; then
    echo "$page"
  fi
done
chmod +x check_pages.sh
./check_pages.sh
