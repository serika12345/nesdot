#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SOURCE_ICON="$ROOT_DIR/nesdot.svg"
PUBLIC_DIR="$ROOT_DIR/public"
TAURI_ICONS_DIR="$ROOT_DIR/src-tauri/icons"
TMP_ROOT="$(mktemp -d)"
WEB_TMP_DIR="$TMP_ROOT/icons-web"
WORK_TMP_DIR="$TMP_ROOT/icons-work"
TAURI_SOURCE_ICON="$TMP_ROOT/nesdot-tauri-icon.svg"

cleanup() {
  rm -rf "$TMP_ROOT"
}
trap cleanup EXIT

if [[ ! -f "$SOURCE_ICON" ]]; then
  echo "Missing source icon: $SOURCE_ICON" >&2
  exit 1
fi

mkdir -p "$PUBLIC_DIR" "$WEB_TMP_DIR" "$WORK_TMP_DIR"

# Build a padded source for platform bundles so dock/taskbar icon size feels balanced.
perl -pe \
  's/viewBox="0 0 8 8"/viewBox="0 0 10 10"/; s/width="64"/width="80"/; s/height="64"/height="80"/; s/x="(\d+)"/"x=\"".($1+1)."\""/eg; s/y="(\d+)"/"y=\"".($1+1)."\""/eg' \
  "$SOURCE_ICON" > "$TAURI_SOURCE_ICON"

pnpm tauri icon "$TAURI_SOURCE_ICON"

pnpm tauri icon "$SOURCE_ICON" -o "$WEB_TMP_DIR" -p 32 -p 180 -p 192 -p 512

cp "$SOURCE_ICON" "$PUBLIC_DIR/favicon.svg"
cp "$WEB_TMP_DIR/32x32.png" "$PUBLIC_DIR/favicon-32x32.png"
cp "$WEB_TMP_DIR/180x180.png" "$PUBLIC_DIR/apple-touch-icon.png"
cp "$WEB_TMP_DIR/192x192.png" "$PUBLIC_DIR/pwa-192x192.png"
cp "$WEB_TMP_DIR/512x512.png" "$PUBLIC_DIR/pwa-512x512.png"
cp "$WEB_TMP_DIR/192x192.png" "$PUBLIC_DIR/pwa-192x192-maskable.png"
cp "$WEB_TMP_DIR/512x512.png" "$PUBLIC_DIR/pwa-512x512-maskable.png"
cp "$TAURI_ICONS_DIR/icon.ico" "$PUBLIC_DIR/favicon.ico"

# Build a mac-specific rounded tile icon while leaving other platform icons unchanged.
mkdir -p "$WORK_TMP_DIR/icon.iconset"

nix shell nixpkgs#imagemagick -c magick \
  -background none \
  "$SOURCE_ICON" \
  -resize 560x560 \
  "$WORK_TMP_DIR/logo.png"

nix shell nixpkgs#imagemagick -c magick \
  -size 1024x1024 xc:none \
  -fill "#0d1726" \
  -draw "roundrectangle 64,64 959,959 220,220" \
  "$WORK_TMP_DIR/tile.png"

nix shell nixpkgs#imagemagick -c magick \
  "$WORK_TMP_DIR/tile.png" \
  "$WORK_TMP_DIR/logo.png" \
  -gravity center \
  -compose over \
  -composite \
  "$WORK_TMP_DIR/mac-1024.png"

sips -z 16 16 "$WORK_TMP_DIR/mac-1024.png" --out "$WORK_TMP_DIR/icon.iconset/icon_16x16.png" >/dev/null
sips -z 32 32 "$WORK_TMP_DIR/mac-1024.png" --out "$WORK_TMP_DIR/icon.iconset/icon_16x16@2x.png" >/dev/null
sips -z 32 32 "$WORK_TMP_DIR/mac-1024.png" --out "$WORK_TMP_DIR/icon.iconset/icon_32x32.png" >/dev/null
sips -z 64 64 "$WORK_TMP_DIR/mac-1024.png" --out "$WORK_TMP_DIR/icon.iconset/icon_32x32@2x.png" >/dev/null
sips -z 128 128 "$WORK_TMP_DIR/mac-1024.png" --out "$WORK_TMP_DIR/icon.iconset/icon_128x128.png" >/dev/null
sips -z 256 256 "$WORK_TMP_DIR/mac-1024.png" --out "$WORK_TMP_DIR/icon.iconset/icon_128x128@2x.png" >/dev/null
sips -z 256 256 "$WORK_TMP_DIR/mac-1024.png" --out "$WORK_TMP_DIR/icon.iconset/icon_256x256.png" >/dev/null
sips -z 512 512 "$WORK_TMP_DIR/mac-1024.png" --out "$WORK_TMP_DIR/icon.iconset/icon_256x256@2x.png" >/dev/null
sips -z 512 512 "$WORK_TMP_DIR/mac-1024.png" --out "$WORK_TMP_DIR/icon.iconset/icon_512x512.png" >/dev/null
cp "$WORK_TMP_DIR/mac-1024.png" "$WORK_TMP_DIR/icon.iconset/icon_512x512@2x.png"

iconutil -c icns "$WORK_TMP_DIR/icon.iconset" -o "$TAURI_ICONS_DIR/icon.icns"

echo "Icon sync completed from nesdot.svg"
