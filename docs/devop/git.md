# Git Workflow for QiCore Data Platform

## 🎯 **Philosophy: Simple & Practical**

This project uses a **pragmatic Git workflow** optimized for solo development with occasional stable releases. No complex branching ceremonies - just effective version management.

## 🏗️ **Core Workflow**

### **Development Pattern**
1. **One Active Branch**: Work in long-lived feature branch (`feature/fp-system-implementation`)
2. **Periodic Releases**: Merge to main when version is stable (v-0.2.0, v-0.2.1, etc.)
3. **Preserve History**: Create version branches before major changes

### **Branch Strategy**
```
main ← Latest stable release
v-0.1.0 ← Preserved v-0.1.0 system (2-layer architecture)
v-0.2.0 ← Preserved v-0.2.0 system (DSL upgrade) [future]
feature/fp-system-implementation ← Active development
```

## 📋 **Common Operations**

### **1. Daily Development**
```bash
# Normal development cycle
git add .
git commit -m "Descriptive commit message"
git push origin feature/fp-system-implementation

# Continue working in same branch
```

### **2. Version Preservation (Before Major Release)**

**Problem**: You want to preserve current GitHub main before replacing it

**Solution**: Fresh clone approach
```bash
# Step 1: Clone fresh copy to preserve GitHub state
cd /tmp
git clone https://github.com/username/qi-v2-dp-ts-actor.git preservation
cd preservation

# Step 2: Create preservation branch from clean GitHub main
git checkout -b v-0.1.0  # or whatever version you're preserving
git push origin v-0.1.0

# Step 3: Clean up
cd - && rm -rf /tmp/preservation
```

**Why Fresh Clone?**: Local main might be polluted with development changes. Fresh clone gets pristine GitHub state.

### **3. Release to Main**

**GitHub Web Interface** (Recommended):
1. Push your feature branch: `git push origin feature/fp-system-implementation`
2. GitHub shows: "feature/fp-system-implementation had recent pushes"
3. Click "Compare & pull request"
4. Create and merge PR

**Command Line** (Alternative):
```bash
# Only if you prefer command line
git checkout main
git pull origin main
git merge feature/fp-system-implementation
git push origin main
```

### **4. Continue After Release**
```bash
# Just keep working in your feature branch
# No need to create new branches unless you want to
git checkout feature/fp-system-implementation
# Continue development...
```

## 🎯 **Version Management**

### **Release Versioning**
- **v-0.1.0**: Original 2-layer architecture (preserved)
- **v-0.2.0**: DSL system upgrade - crypto market complete
- **v-0.2.1**: DSL improvements (planned)
- **v-0.2.2**: Stock market support (planned)
- **v-0.2.3**: Kafka integration (planned)

### **Branch Naming Convention**
```
main                           # Latest stable
v-0.1.0, v-0.2.0, v-0.2.1    # Version preservation branches
feature/descriptive-name       # Feature development
hotfix/urgent-fix             # Emergency fixes (if needed)
```

### **When to Create New Branches**
- **Version preservation**: Before major releases
- **Experimental work**: If trying risky changes
- **Collaboration**: If working with others
- **Otherwise**: Stay in your working branch!

## 🚀 **Release Workflow**

### **Complete Release Process**
```bash
# 1. Preserve current main (if major version)
cd /tmp
git clone https://github.com/username/qi-v2-dp-ts-actor.git preserve
cd preserve
git checkout -b v-0.1.0  # current version
git push origin v-0.1.0
rm -rf /tmp/preserve

# 2. Ensure your work is pushed
cd /your/working/directory
git add .
git commit -m "Release v-0.2.0: Complete description"
git push origin feature/fp-system-implementation

# 3. Create PR on GitHub
# Click "Compare & pull request" → "Create pull request" → "Merge"

# 4. Continue development
# Just keep working in feature/fp-system-implementation
```

## 📚 **Best Practices**

### **Commit Messages**
```bash
# Good examples
git commit -m "Add TwelveData multi-asset demo - Complete actor showcase"
git commit -m "Fix TypeScript compilation errors in demo files"  
git commit -m "Release v-0.2.0: DSL System Upgrade - Crypto Market Actors Complete"

# Include GitHub co-author for AI assistance
git commit -m "Your message

🚀 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### **What to Commit**
✅ **Always commit**:
- Source code changes
- Documentation updates
- Configuration files
- Test files
- Demo files

❌ **Never commit**:
- `.env` files (use `.env.example` instead)
- `node_modules/`
- Build artifacts
- Temporary files
- Personal API keys

### **When to Push**
- **Daily**: End of coding session
- **Before breaks**: Before stepping away
- **After features**: When something works
- **Before releases**: Always push before creating PRs

## 🛡️ **Safety & Recovery**

### **Backup Current Work**
```bash
# Create safety backup before risky operations
git branch backup-$(date +%Y%m%d)
git push origin backup-$(date +%Y%m%d)
```

### **Undo Last Commit** (if not pushed)
```bash
git reset --soft HEAD~1  # Keep changes staged
git reset --hard HEAD~1  # Discard changes (dangerous!)
```

### **See What Changed**
```bash
git status              # Current changes
git diff               # Unstaged changes  
git diff --staged      # Staged changes
git log --oneline -10  # Recent commits
```

## 🔧 **Project-Specific Notes**

### **Quality Checks Before Release**
```bash
# Always run before creating PR
bun run typecheck      # TypeScript compilation
bun run lint          # Biome linting  
bun run test:unit     # Unit tests
bun run app/demos/platform.validation.ts  # Full validation
```

### **Environment Setup**
```bash
# Required for development
export TWELVE_DATA_API_KEY=your_key_here
```

### **Demo Validation**
```bash
# Test all demos before release
bun run app/demos/dsl.basic-usage.ts
bun run app/demos/coingecko.live-data.ts  
bun run app/demos/ccxt.exchange-data.ts
bun run app/demos/twelvedata.multi-asset.ts
bun run app/demos/platform.validation.ts
```

## 🎉 **Success Metrics**

### **Good Release Checklist**
- [ ] All demos working
- [ ] TypeScript clean compilation
- [ ] Biome linting clean
- [ ] Unit tests passing (51+ tests)
- [ ] Real external data validation working
- [ ] Documentation updated
- [ ] Version branch preserved (if major release)
- [ ] PR created and merged cleanly

### **Branch Health**
```bash
# Check branch status
git log --oneline -5                    # Recent commits
git status                             # Working tree status
git remote -v                          # Remote repositories
git branch -a                          # All branches
```

---

**Philosophy**: Keep it simple, preserve history, release when ready. No ceremony, just effective development.

**Last Updated**: 2025-07-10  
**Current Workflow**: v-0.2.0 release process  
**Next**: v-0.2.1 development planning