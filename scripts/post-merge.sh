#!/usr/bin/env bash
set -euo pipefail

npm install --no-audit --no-fund --no-package-lock
npm run lint
npm run build
