#!/usr/bin/env bash
# First publication and later updates. Run in the user's ordinary terminal.
set -euo pipefail

project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$project_root"

target_owner='wonderjz99'
target_name='AI-lian'
target_repo="$target_owner/$target_name"
target_remote="https://github.com/$target_repo.git"

for tool in git gh node npm; do
  if ! command -v "$tool" >/dev/null 2>&1; then
    echo "Missing command: $tool. Install it before publishing." >&2
    exit 1
  fi
done

# API access must work; a cached CLI login alone is insufficient.
if ! active_login="$(gh api user --jq .login)"; then
  echo 'Run: gh auth login --hostname github.com --web --git-protocol https --scopes repo,workflow' >&2
  exit 1
fi
if [[ "$active_login" != "$target_owner" ]]; then
  echo "Expected GitHub account $target_owner, currently signed in as $active_login. No changes made." >&2
  exit 1
fi

if [[ ! -d .git ]]; then
  echo 'Expected this project to have its own .git directory. No changes made.' >&2
  exit 1
fi
if [[ "$(git symbolic-ref --short HEAD)" != 'main' ]]; then
  echo 'Expected local branch main. Switch to main before publishing; no branch was renamed.' >&2
  exit 1
fi
if [[ -n "$(git diff --cached --name-only)" ]]; then
  echo 'There are already staged changes. Commit or unstage them before using this script.' >&2
  exit 1
fi

existing_remote="$(git remote get-url origin 2>/dev/null || true)"
if [[ -n "$existing_remote" ]]; then
  case "$existing_remote" in
    "$target_remote"|"https://github.com/$target_repo"|"git@github.com:$target_repo.git"|"git@github.com:$target_repo") ;;
    *) echo "origin points to a different repository: $existing_remote. No changes made." >&2; exit 1 ;;
  esac
fi

echo 'Checking the desktop website before publishing...'
if [[ ! -d node_modules ]]; then npm ci; fi
npm run check

repo_exists=false
if repo_info="$(gh repo view "$target_repo" --json isEmpty,visibility --jq '[.isEmpty,.visibility] | @tsv' 2>/dev/null)"; then
  repo_exists=true
  if [[ "$repo_info" != *$'\tPUBLIC' ]]; then
    echo 'The existing repository is private. This script will not change its visibility.' >&2
    exit 1
  fi
  if [[ -z "$existing_remote" && "$repo_info" != true$'\tPUBLIC' ]]; then
    echo 'A nonempty repository with this name already exists, but is not linked to this project. No remote changes made.' >&2
    exit 1
  fi
fi

if [[ -z "$(git config user.name || true)" ]]; then
  git config user.name "$active_login"
fi
if [[ -z "$(git config user.email || true)" ]]; then
  account_id="$(gh api user --jq .id)"
  git config user.email "$account_id+$active_login@users.noreply.github.com"
fi

# Stage only project deliverables. Build output, local work and credentials stay ignored.
git add -- .gitignore .github AGENTS.md README.md docs e2e index.html \
  package.json package-lock.json playwright.config.ts progress.md scripts src tests \
  tsconfig.json vite.config.ts
if ! git diff --cached --quiet; then
  git commit -m 'feat: publish AI 经纬 desktop website'
fi

if [[ "$repo_exists" == false ]]; then
  gh repo create "$target_repo" --public --description 'AI 经纬：中国 AI 公司关系地图'
fi
if [[ -z "$existing_remote" ]]; then
  git remote add origin "$target_remote"
fi
# Per-command authentication; does not rewrite global Git credential settings.
git -c credential.helper= -c 'credential.helper=!gh auth git-credential' push -u origin main

pages_type="$(gh api "repos/$target_repo/pages" --jq .build_type 2>/dev/null || true)"
if [[ -z "$pages_type" ]]; then
  gh api --method POST "repos/$target_repo/pages" -f build_type=workflow >/dev/null
elif [[ "$pages_type" != workflow ]]; then
  gh api --method PUT "repos/$target_repo/pages" -f build_type=workflow >/dev/null
fi
gh repo edit "$target_repo" --homepage "https://$target_owner.github.io/$target_name/"

# A manual dispatch after enabling Pages also covers an initial push/settings race.
dispatch_ok=false
for attempt in 1 2 3; do
  if gh workflow run pages.yml --repo "$target_repo" --ref main; then
    dispatch_ok=true
    break
  fi
  if [[ "$attempt" != 3 ]]; then sleep 3; fi
done

echo "Repository: https://github.com/$target_repo"
echo "Deployment status: https://github.com/$target_repo/actions"
echo "Expected website after successful deployment: https://$target_owner.github.io/$target_name/"
if [[ "$dispatch_ok" != true ]]; then
  echo 'Code was pushed and Pages enabled, but dispatch failed. Open Actions and run the website workflow.' >&2
  exit 1
fi
echo 'Upload and deployment request complete. The website is live only after Actions succeeds.'
