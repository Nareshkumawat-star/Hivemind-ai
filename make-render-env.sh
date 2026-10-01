#!/usr/bin/env bash
# Gathers every env var Render needs from your local .env files and writes
# render-env-values.txt (gitignored). Secret values never leave this machine.
cd "$(dirname "$0")" || exit 1

OUT="render-env-values.txt"

# Search order: first file that defines a key wins.
FILES=(
  "backend/services/agent/.env"
  "backend/services/billing/.env"
  "backend/services/auth/.env"
  "backend/services/chat/.env"
  "backend/gateway/.env"
  "frontend/.env"
)

val_of() { # val_of KEY -> print value from the first file that defines it
  local key="$1" f line
  for f in "${FILES[@]}"; do
    [ -f "$f" ] || continue
    line=$(grep -E "^[[:space:]]*${key}=" "$f" | tail -n 1 | cut -d= -f2-)
    if [ -n "$line" ]; then
      line="${line%\"}"; line="${line#\"}"; line="${line%\'}"; line="${line#\'}"
      printf '%s' "$line"
      return 0
    fi
  done
  return 1
}

add() { # add RENDER_KEY
  local key="$1" v flag=""
  if v=$(val_of "$key"); then
    case "$v" in
      *localhost*|*127.0.0.1*)
        flag="   << WARNING: points at localhost - Render CANNOT reach your machine. Replace with the cloud URL (Atlas / Upstash)."
        ;;
    esac
    printf '%s=%s\n' "$key" "$v" >> "$OUT"
    printf '  OK    %s%s\n' "$key" "$flag"
  else
    printf '  MISS  %s   (not in any local .env - add it manually)\n' "$key"
  fi
}

: > "$OUT"
echo "Collecting env vars for Render -> $OUT"
echo

for k in MONGODB_URI REDIS_URL QDRANT_URL QDRANT_API_KEY \
         GROQ_API_KEY GOOGLE_API_KEY OPENROUTER_API_KEY TAVILY_API_KEY \
         RAZORPAY_KEY_ID RAZORPAY_KEY_SECRET \
         AWS_REGION AWS_ACCESS_KEY_ID AWS_SECRET_KEY AWS_BUCKET_NAME \
         VITE_FIREBASE_API_KEY VITE_RAZORPAY_KEY_ID; do
  add "$k"
done

# Firebase service account -> base64 (the file is gitignored, so it must ship as an env var)
SA="backend/services/auth/serviceAccountKey.json"
if [ -f "$SA" ]; then
  printf 'FIREBASE_SERVICE_ACCOUNT_BASE64=%s\n' "$(base64 -w0 "$SA")" >> "$OUT"
  echo "  OK    FIREBASE_SERVICE_ACCOUNT_BASE64   (encoded from $SA)"
else
  echo "  MISS  FIREBASE_SERVICE_ACCOUNT_BASE64   ($SA not found)"
fi

echo
echo "Done -> $OUT"
echo "Open it, copy each value into Render: your service -> Environment -> Add Environment Variable."
echo "Deliberately NOT included: VITE_SERVER_URL (must stay unset so the API stays same-origin)."
