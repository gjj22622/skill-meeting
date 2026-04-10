# Commit Skill
1. Run `git status` to check current state
2. If index.lock exists, remove it: `Remove-Item .git/index.lock -ErrorAction SilentlyContinue`
3. Stage all changes: `git add -A`
4. Show diff summary and ask user for commit message
5. Commit and push to `main` branch (NOT master)
6. Use PowerShell-compatible commands only
