#!/bin/sh
set -eu
mkdir -p "$UPLOAD_DIR"
chown -R node:node "$UPLOAD_DIR"
exec su-exec node "$@"
