#!/usr/bin/env bash
#
# Build the site and publish it to the `gh-pages` branch, which GitHub Pages
# serves at https://bruce12-glitch.github.io/cluster/
#
# Usage:  npm run deploy
#
# Why a throwaway repo instead of `git subtree`: `dist/` is gitignored, so there
# is nothing for subtree to push. Staging the build into a scratch directory and
# pushing it as an orphan branch keeps the deploy out of the main history
# entirely — `main` stays source-only, `gh-pages` stays build-only.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REMOTE="$(git -C "$ROOT" remote get-url origin)"
STAGE="$(mktemp -d)"

cleanup() { rm -rf "$STAGE"; }
trap cleanup EXIT

echo "==> building"
cd "$ROOT"
npm run build

# Pages runs Jekyll by default, which would try to process the output. An empty
# .nojekyll file tells it to serve the files verbatim.
touch dist/.nojekyll

echo "==> staging build into $STAGE"
cp -r dist/. "$STAGE"/

cd "$STAGE"
git init -q -b gh-pages
git add -A

# Reuse the identity from the parent repo so the deploy commit is attributed
# correctly, without depending on a global git config being present.
git -c user.name="$(git -C "$ROOT" config user.name)" \
    -c user.email="$(git -C "$ROOT" config user.email)" \
    commit -q -m "deploy: publish the built site"

git remote add origin "$REMOTE"

echo "==> pushing gh-pages"
git push --force origin gh-pages

echo
echo "==> published. live at https://bruce12-glitch.github.io/cluster/"
echo "    (Pages takes ~30s to rebuild after the push)"
