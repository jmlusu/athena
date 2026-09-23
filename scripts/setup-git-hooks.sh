#!/usr/bin/env bash
set -e

echo "Setting up custom Git merge drivers for pnpm lockfiles..."
git config merge.ours_lockfile.name "Keep local pnpm lockfile during merges"
git config merge.ours_lockfile.driver "git merge-file --ours %A %O %B"
echo "Git merge drivers successfully configured."