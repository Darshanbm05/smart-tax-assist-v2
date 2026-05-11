# 🔐 Security Setup Guide - Phase 2

## Quick Start (5 minutes)

### 1. Enable GitHub Dependabot & CodeQL (Auto, No Action Needed)

Both are **automatically enabled** via configuration files:
- ✅ `.github/dependabot.yml` - Auto-creates security update PRs
- ✅ `.github/workflows/security.yml` - Runs CodeQL on every push

Just push your code and they start working!

### 2. Set Up Pre-commit Hooks Locally

```bash
# Install pre-commit
pip install pre-commit

# Enable git hooks in your repo
pre-commit install

# (Optional) Test on all existing files
pre-commit run --all-files
```

**That's it!** Now every commit automatically checks for secrets and code quality.

---

## What's Been Configured

### ✅ Automated (GitHub - No Setup Needed)

**Dependabot**
- Scans dependencies daily
- Creates security update PRs
- Auto-merges patch/minor updates if tests pass
- Requests review for major updates

**CodeQL**
- AI security scanning on every push
- Detects vulnerabilities in Python & JavaScript
- Runs daily and on every PR

**TruffleHog**
- Scans for exposed secrets
- Part of security.yml workflow
- Runs on every push

### ⚙️ Local Setup Required

**Pre-commit Hooks**
- Run before each commit
- Detect hardcoded secrets → Blocks commit
- Format Python code → Auto-fixes
- Lint JavaScript → Auto-fixes
- Validate YAML/JSON syntax

---

## Local Setup Instructions

### Step 1: Install Pre-commit

```bash
pip install pre-commit
```

### Step 2: Install Hooks

```bash
cd /path/to/smart-tax-assist-v2
pre-commit install
```

### Step 3: (Optional) Add ESLint for Frontend

If you want JavaScript linting:

```bash
cd frontend
npm install --save-dev eslint eslint-config-next
```

### Step 4: Verify Installation

```bash
# Check that hooks are installed
git config core.hooksPath
# Should output: .git/hooks

# List installed hooks
cat .git/hooks/pre-commit
# Should show pre-commit framework
```

---

## How Pre-commit Works

### When You Commit Code

```bash
$ git commit -m "update dependencies"

# Pre-commit automatically:
1. ✅ Runs secret detection
2. ✅ Formats Python code (Black)
3. ✅ Lints Python code (Ruff)
4. ✅ Lints JavaScript (ESLint)
5. ✅ Validates YAML/JSON
6. ✅ Checks for trailing whitespace

# Result: Clean, secure, formatted commit ✨
```

### Example: Secret Detected

```bash
$ git commit -m "add config"

🔐 Running security check on staged files...
❌ SECURITY ALERT: Potential MONGODB_URI detected in backend/app/main.py

❌ COMMIT BLOCKED: Secrets detected!

💡 Fix suggestions:
   1. Move secrets to .env or .env.local files (already in .gitignore)
   2. Verify .gitignore includes all sensitive files
   3. Use environment variables in your application
   4. If this was accidental, rotate the exposed secrets immediately!

📖 See SECURITY_CHECKLIST.md for more information
```

---

## Detected Secrets (Pre-commit Will Block)

Pre-commit blocks commits if it detects:

| Secret Type | Pattern | Example |
|-------------|---------|---------|
| MongoDB URI | `mongodb+srv://user:pass@` | URI in connection string |
| JWT Secret | `JWT_SECRET = "xxxxx"` | Hardcoded JWT key |
| API Keys | `api_key = "xxxxx"` | Any API key |
| AWS Keys | `AKIA` + credentials | AWS access key |
| Private Keys | `-----BEGIN ... KEY-----` | SSH/RSA keys |
| GitHub Tokens | `gh[a-z]_` + long string | GitHub PAT |
| Vercel Tokens | `vercel_` + string | Vercel API token |

---

## Fixing Pre-commit Issues

### Issue: Pre-commit Blocks Commit With Secret

**Solution 1: Use .env Files (Recommended)**
```bash
# ❌ Wrong - in app code
echo "JWT_SECRET = 'my-secret'" >> backend/app/config.py

# ✅ Right - in .env
echo "JWT_SECRET = 'my-secret'" >> backend/.env
# Already in .gitignore, won't be committed!
```

**Solution 2: Bypass Hook (Not Recommended)**
```bash
# Skip pre-commit checks (DANGEROUS!)
git commit --no-verify -m "message"

# Use only if absolutely necessary and you know what you're doing
```

### Issue: Black/Ruff Formatting Conflicts

Pre-commit auto-fixes most issues. If not:
```bash
# Manually format
cd backend
black .
ruff check . --fix

# Then commit
git add .
git commit -m "format: apply code style"
```

### Issue: ESLint Complains

```bash
# Fix JavaScript issues
cd frontend
npm run lint -- --fix

# Then commit
git add src/
git commit -m "fix: lint errors"
```

---

## GitHub Security Settings

### Enable in GitHub (Settings → Code Security and Analysis)

All should already be enabled, but verify:

1. **Dependabot alerts** ✅
   - Shows security vulnerabilities
   - Located in: Security → Dependabot alerts

2. **Dependabot security updates** ✅
   - Automatically creates PRs for vulnerabilities
   - Located in: Settings → Code security and analysis

3. **Dependabot version updates** (Optional)
   - Updates to latest versions (not just security)
   - Located in: Settings → Code security and analysis

4. **Code scanning - CodeQL** ✅
   - AI security analysis
   - Runs via `.github/workflows/security.yml`

---

## Monitoring Security

### 1. Check GitHub Security Dashboard

**Go to:** Repo → Security tab

See:
- ✅ Dependabot alerts & PRs
- ✅ CodeQL findings
- ✅ Deployment history
- ✅ Secret scanning results

### 2. Check Dependency PRs

**Go to:** Pull Requests → Filter by "Dependabot"

Example PR:
```
[Dependabot] Bump fastapi from 0.111.0 to 0.112.0

Security: This version includes fix for CVE-2024-XXXXX

✅ Tests passing - Auto-merge in 24h
or
⚠️ Major update - Manual review required
```

### 3. Check CodeQL Results

**Go to:** Security → Code scanning alerts

Example finding:
```
Potential SQL Injection at backend/app/routes/bills.py:45

Severity: ⚠️ WARNING
Fix: Use parameterized queries instead of string concatenation
```

---

## Best Practices

### ✅ Do:

1. **Keep hooks installed**
   ```bash
   # After pulling latest code
   pre-commit install
   ```

2. **Review Dependabot PRs**
   - Check what changed
   - Verify tests pass
   - Approve for merge

3. **Act on CodeQL alerts**
   - Review security findings
   - Fix vulnerabilities promptly
   - Document if findings are false positives

4. **Rotate secrets regularly**
   - JWT_SECRET: Every 90 days
   - Database passwords: When access changes
   - API tokens: Every 6 months

### ❌ Don't:

1. **Don't commit `.env` files**
   ```bash
   # ❌ Wrong
   git add backend/.env
   
   # ✅ Right
   git add backend/.env.example  # Template only
   ```

2. **Don't bypass pre-commit for "quick" commits**
   ```bash
   # ❌ Never do this
   git commit --no-verify -m "quick fix"
   
   # Use only in emergencies with team notification
   ```

3. **Don't ignore security alerts**
   - CodeQL findings
   - Dependabot PRs
   - Secret warnings

4. **Don't reuse the same secret**
   - Each service needs unique keys
   - Rotate when compromised
   - Never hardcode secrets

---

## Configuration Files Explained

### `.github/dependabot.yml`
Controls when Dependabot scans and creates PRs
- Scans Python (pip), npm, Docker, GitHub Actions
- Creates PRs daily at 4 AM UTC
- Auto-merges patch/minor if tests pass

### `.github/workflows/security.yml`
Runs CodeQL security scanning
- Scans on every push, PR, and daily
- Analyzes Python and JavaScript
- Also runs Safety and npm audit

### `.pre-commit-config.yaml`
Defines what hooks run before each commit
- Black (Python formatting)
- Ruff (Python linting)
- ESLint (JavaScript linting)
- Secret detection
- YAML/JSON validation

### `.githooks/pre-commit`
Custom Python script that detects secrets
- Patterns for MongoDB, JWT, API keys, etc.
- Blocks commit if secrets found
- Provides helpful suggestions

---

## Troubleshooting

### Pre-commit Not Running on Commit

```bash
# Check if installed
test -f .git/hooks/pre-commit && echo "Installed" || echo "Not installed"

# Reinstall
pre-commit install

# Verify with a test commit
git commit --allow-empty -m "test"
```

### "pre-commit: command not found"

```bash
# Install pre-commit
pip install pre-commit

# Or with brew (macOS)
brew install pre-commit
```

### Hook Running Too Slowly

```bash
# Run in parallel (faster)
pre-commit run --all-files -j 4

# Or skip certain hooks
pre-commit run --all-files --hook-stage commit --exclude-stages push
```

### CodeQL Not Showing Results

```bash
# Check workflow status
# Go to: Repo → Actions → Security workflow
# View logs for errors

# CodeQL results appear in Security → Code scanning tab
# Takes a few minutes to process
```

### Dependabot Not Creating PRs

```bash
# Verify configuration
test -f .github/dependabot.yml && echo "Config exists"

# Check GitHub Settings
# Settings → Code security and analysis → Dependabot updates

# Wait 24 hours for first scan
```

---

## Workflow: Day-to-Day

### Making a Commit

```bash
# 1. Make changes
vim backend/app/routes/bills.py

# 2. Stage changes
git add backend/app/routes/bills.py

# 3. Commit (pre-commit runs automatically)
git commit -m "feat: add bill filtering"

# Pre-commit checks:
# ✅ No secrets
# ✅ Code formatted
# ✅ Linting passed
# ✅ YAML valid
```

### Handling Dependabot PR

```bash
# 1. Dependabot creates PR
# [Dependabot] Bump fastapi from 0.111.0 to 0.112.0

# 2. Tests run automatically
# ✅ CI pipeline passes

# 3. PR auto-merges (or waits for review)
# Merge commit added to main

# 4. Code deployed to production
# Via your CD pipeline
```

### Checking Security

```bash
# Daily/Weekly
1. Go to GitHub repo → Security tab
2. Check for Dependabot alerts
3. Check for CodeQL findings
4. Review any open Dependabot PRs

# Monthly
1. Review security settings
2. Check for any missed vulnerabilities
3. Plan secret rotations
```

---

## Summary

**Phase 2 Security Setup:**
- ✅ Dependabot scans dependencies automatically
- ✅ CodeQL scans code for vulnerabilities automatically
- ✅ Pre-commit hooks run locally (5 min setup)
- ✅ Secrets cannot be accidentally committed
- ✅ Code is automatically formatted and linted

**All configured. Just run:**
```bash
pip install pre-commit && pre-commit install
```

**Then everything is automatic!** 🎉

---

## Questions?

- Pre-commit docs: https://pre-commit.com
- CodeQL: https://codeql.github.com/
- Dependabot: https://docs.github.com/en/code-security/dependabot
- GitHub Security: https://github.com/features/security

