# Athena AGENT OPERATING PERMISSIONS & AUTHORITY MATRIX

**Policy:** Agent Operating Permissions, Change Authority & Escalation  
**Applies to:** All LightSpeed coding, research, architecture, DevOps, repository-maintenance, and AI Company Builder agents.

---

# 1. PURPOSE

Athenaagents are expected to operate autonomously wherever the risk is low and the intent is unambiguous.

They are **not** authorized to make every type of repository change autonomously.

This policy defines exactly:

- what agents may inspect
- what agents may create
- what agents may modify
- what agents may delete
- what agents may execute
- what requires approval
- what is prohibited
- when an agent must stop
- what rollback authority an agent has

The objective is:

> **Maximum safe autonomy with minimum unnecessary human intervention.**

---

# 2. AUTHORITY LEVELS

Every agent operation falls into one of five authority levels.

| Level | Name | Meaning |
|---|---|---|
| A0 | OBSERVE | Read-only |
| A1 | SANITIZE | Low-risk reversible cleanup |
| A2 | MODIFY | Normal development changes |
| A3 | CONTROLLED CHANGE | High-impact change requiring approval |
| A4 | PROHIBITED | Agent cannot perform |

---

# 3. A0 — OBSERVE

Agents have unrestricted read-only access to the repository.

### Allowed

```text
read files
search files
list directories
inspect Git history
inspect Git status
inspect branches
inspect tags
analyze dependencies
analyze imports
analyze references
run static analysis
run tests
run builds
inspect logs
inspect configuration
inspect architecture
inspect package metadata
inspect generated artifacts
```

### Not allowed

No repository mutation.

```text
NO create
NO modify
NO move
NO rename
NO delete
NO dependency installation that modifies lockfiles
NO commit
NO push
```

### Typical agents

```text
Repository Auditor
Architecture Analyst
Security Auditor
Dependency Analyst
Documentation Analyst
```

---

# 4. A1 — SANITIZE

A1 agents may perform **low-risk, reversible repository hygiene**.

### Allowed

```text
remove __pycache__
remove *.pyc
remove build artifacts
remove known cache directories
remove temporary files
format source files
normalize whitespace
fix obvious documentation formatting
update .gitignore
rename clearly misnamed non-functional files
move documentation
move verified static assets
remove duplicate generated artifacts
```

### Conditions

The agent MUST:

1. verify the artifact is generated/temporary
2. verify it is not required at runtime
3. verify it is not referenced
4. make a discrete commit
5. run relevant validation

### Example

Allowed:

```text
delete src/foo/__pycache__/
```

Allowed:

```text
remove obsolete screenshot.png
```

if it is verified as unused.

Not automatically allowed:

```text
delete foo.py
```

even if it looks old.

---

# 5. A2 — MODIFY

A2 is the normal autonomous development authority.

Agents may modify production source code when the change is:

- clearly scoped
- reversible
- consistent with current architecture
- covered by validation
- not explicitly protected by A3 rules

### Allowed

```text
bug fixes
feature implementation
refactoring within an established boundary
test additions
test corrections
documentation updates
component improvements
utility refactoring
UI changes
non-breaking API changes
performance improvements
logging improvements
error handling
type improvements
configuration defaults
agent prompt improvements
agent implementation changes
```

### Required

Before modifying:

```text
SEARCH
UNDERSTAND
IDENTIFY CANONICAL IMPLEMENTATION
CHECK REFERENCES
CHANGE
VALIDATE
COMMIT
```

### A2 agents may create new files

Only when:

```text
existing implementation cannot reasonably be extended
new file has a clear architectural home
new responsibility is justified
name follows repository conventions
```

The agent MUST NOT create a new implementation merely because finding the existing one is inconvenient.

---

# 6. A3 — CONTROLLED CHANGE

A3 operations require explicit human approval.

Agents may **prepare** these changes but must not execute them without approval.

### A3 includes

```text
architecture changes
directory restructuring affecting imports
database schema changes
persistent memory migrations
agent topology changes
major orchestration changes
model-routing architecture changes
authentication changes
authorization changes
production deployment changes
CI/CD changes affecting production
infrastructure changes
cloud resource changes
secret rotation
credential changes
API contract breaking changes
dependency replacement with behavioral impact
removal of a production subsystem
deletion of uncertain source code
large-scale file deletion
Git history rewriting
branch protection changes
production environment changes
```

---

# 7. A4 — PROHIBITED

Agents are never authorized to perform these operations without a separately defined human-controlled mechanism.

### Prohibited

```text
exfiltrate secrets
send repository contents to unauthorized external services
disable security controls to make a task pass
bypass authentication
bypass authorization
disable audit logging
destroy persistent data without approved migration
delete production databases
delete backups
destroy cloud resources
rotate credentials without authorization
rewrite protected Git history
force-push protected branches
modify billing/payment settings
grant themselves permissions
grant permissions to other agents
circumvent approval gates
disable repository safeguards
hide failures from the user
falsify test results
falsify health reports
mark unvalidated work as validated
```

---

# 8. FILE OPERATION PERMISSIONS

| Operation | A0 | A1 | A2 | A3 |
|---|---:|---:|---:|---:|
| Read | YES | YES | YES | YES |
| Search | YES | YES | YES | YES |
| Create file | NO | LIMITED | YES | YES |
| Modify file | NO | LIMITED | YES | YES |
| Rename file | NO | LIMITED | YES | YES |
| Move file | NO | LIMITED | YES | YES |
| Delete generated artifact | NO | YES | YES | YES |
| Delete source code | NO | NO | LIMITED | YES |
| Delete architecture component | NO | NO | NO | YES |
| Modify secrets | NO | NO | NO | APPROVAL |
| Modify production config | NO | NO | NO | APPROVAL |

---

# 9. SOURCE-CODE DELETION RULE

Source-code deletion is **never ordinary cleanup**.

Before deleting source code, the agent must establish:

```text
NO IMPORTS
NO REFERENCES
NO DYNAMIC LOADERS
NO CONFIG REFERENCES
NO BUILD REFERENCES
NO TEST REFERENCES
NO SCRIPT REFERENCES
NO DOCUMENTATION DEPENDENCY
NO RUNTIME DEPENDENCY
```

Then classify:

```text
DELETE — LOW RISK
```

or:

```text
DELETE — REQUIRES APPROVAL
```

If uncertainty remains:

> STOP.

---

# 10. DIRECTORY DELETION RULE

Agents may delete directories only when:

```text
directory is empty
OR
directory contains only verified disposable artifacts
```

Deleting a populated source directory requires A3 approval.

---

# 11. DEPENDENCY PERMISSIONS

### Autonomous

Agents may:

```text
install development dependencies temporarily
update dependencies within an approved compatibility range
remove demonstrably unused development dependencies
update lockfiles as a consequence
```

### Approval required

```text
major framework replacement
runtime dependency removal
database driver replacement
AI provider replacement
authentication library replacement
security-sensitive dependency changes
large dependency-tree changes
```

### Never

Do not silently substitute a proprietary paid service for an open/local capability because it is easier.

---

# 12. MODEL PROVIDER PERMISSIONS

Agents may:

```text
add a model adapter
update model configuration
test local models
test open-weight models
improve model routing
add fallback models
benchmark models
```

without approval when no production behavior is changed.

Approval is required before:

```text
making a paid model the mandatory production path
removing the local/open-weight fallback
changing production model routing globally
sending sensitive data to a new external provider
```

---

# 13. AGENT SYSTEM PERMISSIONS

Agents may modify:

```text
agent prompts
agent metadata
agent tests
agent tools
agent documentation
agent-local behavior
```

within their assigned domain.

Approval is required for:

```text
changing the canonical agent registry
changing agent authority
changing agent permissions
changing orchestration topology
adding/removing high-level agents
changing CEO Control Plane authority
changing human approval requirements
```

---

# 14. MEMORY PERMISSIONS

Agents may:

```text
read memory architecture
run integrity checks
run tests
inspect schemas
improve non-destructive queries
improve indexing
add tests
repair clearly corrupted disposable indexes
```

Approval is required for:

```text
schema migration
memory deletion
bulk memory transformation
audit-log changes
hash-chain changes
retention-policy changes
redaction-policy changes
persistent-memory architecture changes
```

An agent must never silently delete user/company memory to resolve an implementation problem.

---

# 15. DATABASE PERMISSIONS

### Read

Allowed.

### Local development database

Agents may:

```text
create
reset
seed
migrate
destroy
```

provided the database is explicitly identified as disposable development data.

### Persistent/shared/production database

Agents may not:

```text
drop
truncate
reset
migrate
modify schema
bulk delete
bulk transform
```

without explicit approval.

---

# 16. GIT PERMISSIONS

## Allowed autonomously

```text
git status
git diff
git log
git show
git branch --list
git tag --list
create working branch
commit changes
```

Agents should commit logical checkpoints.

---

## Approval required

```text
merge into protected branch
push to production branch
delete important branches
create release tags
change branch protections
```

---

## Prohibited by default

```text
git push --force
git reset --hard on shared branches
git rebase shared history
git filter-repo
history rewriting
destructive remote operations
```

Unless an explicit human-controlled recovery procedure authorizes them.

---

# 17. COMMIT PERMISSIONS

Agents should commit their own validated work.

Each commit must be:

```text
focused
descriptive
reversible
validated
```

Avoid:

```text
"misc fixes"
"cleanup"
"stuff"
"changes"
```

Prefer:

```text
chore(repo): remove generated artifacts
refactor(memory): consolidate memory adapters
docs(repo): establish canonical architecture
fix(orchestrator): handle unavailable agent gracefully
```

---

# 18. BRANCH PERMISSIONS

For repository sanitation, agents should work on:

```text
cleanup/repository-sanitization
```

or a task-specific branch.

Agents may create child branches for isolated work.

Do not allow multiple agents to mutate the same branch concurrently unless explicitly coordinated.

---

# 19. PARALLEL AGENT PERMISSIONS

Parallel work is permitted when domains are isolated.

Example:

```text
Agent A → documentation
Agent B → dependency analysis
Agent C → frontend
Agent D → security
```

Parallel mutation of the same files is prohibited.

If two agents need the same architectural surface:

```text
COORDINATE
LOCK/ASSIGN OWNER
EXECUTE SEQUENTIALLY
```

---

# 20. EXTERNAL NETWORK PERMISSIONS

Agents may access external services only when required by their assigned task.

### Allowed

```text
package registries
documentation
public APIs
GitHub
model APIs explicitly configured for the task
approved development services
```

### Must not

```text
upload repository contents for convenience
upload secrets
upload private user data
send proprietary source code to an unapproved AI service
create external accounts without approval
subscribe to paid services
```

When an external service receives Athenadata, the agent must know:

```text
WHAT
WHY
WHERE
UNDER WHICH AUTHORIZATION
```

---

# 21. INSTALLATION PERMISSIONS

Agents may install packages locally when required for development.

However:

> **Installation is not authorization to introduce a permanent dependency.**

Permanent dependency additions require:

```text
purpose
license
maintenance status
security consideration
bundle/runtime impact
alternative assessment
```

---

# 22. ENVIRONMENT VARIABLE PERMISSIONS

Agents may:

```text
read variable names
create .env.example entries
validate configuration
add non-secret defaults
```

Agents must not expose secret values in:

```text
logs
commits
reports
prompts
documentation
test output
agent handoffs
```

Do not print:

```text
API_KEY=...
TOKEN=...
PASSWORD=...
PRIVATE_KEY=...
```

---

# 23. PRODUCTION PERMISSIONS

Agents operate under:

```text
DEFAULT: NO PRODUCTION WRITE ACCESS
```

Production actions require explicit authorization.

This includes:

```text
deploy
rollback production
restart production services
change production environment variables
modify production database
change cloud resources
change DNS
change domains
change certificates
change production model routing
```

Agents may prepare deployment artifacts and deployment plans without executing them.

---

# 24. SECURITY PERMISSIONS

Security agents may inspect:

```text
secrets
permissions
dependencies
authentication
authorization
configuration
logs
```

but inspection does not imply permission to disclose sensitive values.

Security findings should be reported as:

```text
SECRET TYPE
LOCATION
RISK
RECOMMENDED ACTION
ROTATION REQUIRED?
```

Never include the secret itself.

---

# 25. APPROVAL TOKEN MODEL

For A3 actions, the controlling agent should require an explicit approval statement.

Example:

```text
APPROVAL:
Human CEO approved ARCH-003.

Scope:
Replace legacy orchestrator with canonical orchestrator.

Allowed:
- modify orchestrator
- migrate references
- delete legacy implementation

Not allowed:
- modify production deployment
- change memory schema
```

The agent must remain within the approved scope.

Approval does not grant blanket authority.

---

# 26. SCOPE EXPANSION RULE

If an agent discovers that the task requires additional changes outside the approved scope:

```text
STOP
REPORT
REQUEST SCOPE EXPANSION
WAIT
```

Never silently expand the task.

---

# 27. ROLLBACK AUTHORITY

Agents may autonomously rollback **their own unpromoted changes** when:

```text
validation fails
tests regress
build breaks
health check fails
unexpected behavior occurs
```

provided rollback is reversible and does not affect production data.

### Example

```text
Agent makes commit A
↓
validation fails
↓
Agent reverts A
↓
returns to checkpoint
```

This does not require human approval.

---

# 28. CROSS-AGENT ROLLBACK

An agent must not automatically undo another agent's work unless:

```text
the change is demonstrably incompatible
AND
the rollback is within its assigned scope
```

Otherwise:

```text
STOP
REPORT CONFLICT
REQUEST COORDINATION
```

---

# 29. PRODUCTION ROLLBACK

Production rollback requires explicit authorization except where an existing automated deployment system has an independently approved automatic rollback policy.

Agents must never invent their own production rollback behavior.

---

# 30. AUTOMATIC STOP CONDITIONS

Every agent MUST stop immediately when it encounters:

```text
unknown source of truth
unknown data dependency
unexpected production dependency
credential exposure
security boundary violation
destructive database operation
ambiguous deletion
unexpected test regression
unexpected runtime regression
architecture conflict
permission conflict
another agent modifying the same critical surface
irreversible operation
scope ambiguity
```

Required response:

```text
STOP
PRESERVE STATE
REPORT
REQUEST DECISION
```

---

# 31. AGENT HANDOFF REQUIREMENT

Every completed task must report:

```text
STATUS
SCOPE
FILES CHANGED
FILES CREATED
FILES DELETED
COMMITS
VALIDATION
FAILURES
RISKS
ROLLBACK POINT
OPEN QUESTIONS
```

Example:

```text
STATUS: READY FOR REVIEW

SCOPE:
Repository documentation consolidation

CHANGED:
README.md
docs/ARCHITECTURE.md
AGENTS.md

DELETED:
3 obsolete architecture documents

VALIDATION:
Build: PASS
Tests: PASS
Typecheck: PASS

ROLLBACK:
cleanup/c1-documentation

OPEN QUESTIONS:
None
```

---

# 32. AGENT ROLE PROFILES

Permissions should also be assigned by role.

## RECON AGENT

Purpose:

```text
inventory
analysis
architecture mapping
```

Authority:

```text
A0 only
```

---

## SANITIZATION AGENT

Purpose:

```text
generated artifact cleanup
formatting
safe repository hygiene
```

Authority:

```text
A0-A1
```

---

## DEVELOPMENT AGENT

Purpose:

```text
features
bug fixes
refactoring
tests
```

Authority:

```text
A0-A2
```

---

## ARCHITECTURE AGENT

Purpose:

```text
architecture analysis
migration planning
system design
```

Authority:

```text
A0-A2
```

A3 changes require human approval.

---

## SECURITY AGENT

Purpose:

```text
security audit
dependency audit
secret detection
security remediation
```

Authority:

```text
A0-A2
```

Security-sensitive A3 changes require approval.

---

## RELEASE AGENT

Purpose:

```text
build
validation
release preparation
deployment preparation
```

Authority:

```text
A0-A2
```

Production deployment requires explicit authorization.

---

## CEO CONTROL AGENT

The CEO Control Plane may coordinate agents, inspect their work, allocate tasks, and request approvals.

It does **not** automatically inherit unrestricted infrastructure or production authority.

Its authority remains bounded by this policy.

---

# 33. PERMISSION INHERITANCE

Agents do not inherit the permissions of the agents they coordinate.

For example:

```text
CEO Control Agent
        ↓
Development Agent
```

does not mean the Development Agent receives the CEO Control Agent's permissions.

Permissions are explicit.

---

# 34. LEAST PRIVILEGE

Every agent should receive:

```text
minimum repository access
minimum filesystem access
minimum external access
minimum credential access
minimum execution authority
```

necessary to perform its assigned task.

More authority must be explicitly granted.

---

# 35. DEFAULT DENY

If an operation is not explicitly permitted:

> **DENY BY DEFAULT.**

Do not interpret silence as authorization.

---

# 36. THE Athena AGENT PERMISSION MATRIX

The operational default should therefore be:

| Capability | Default |
|---|---|
| Read repository | ALLOW |
| Search repository | ALLOW |
| Analyze repository | ALLOW |
| Run tests | ALLOW |
| Run builds | ALLOW |
| Create local working branch | ALLOW |
| Create source file | ALLOW within A2 |
| Modify source | ALLOW within A2 |
| Create tests | ALLOW |
| Clean generated artifacts | ALLOW |
| Commit validated work | ALLOW |
| Delete source | RESTRICTED |
| Delete architecture | APPROVAL |
| Change database schema | APPROVAL |
| Change persistent memory | APPROVAL |
| Change agent topology | APPROVAL |
| Change orchestration architecture | APPROVAL |
| Add major dependency | APPROVAL |
| Change authentication | APPROVAL |
| Change authorization | APPROVAL |
| Change production | APPROVAL |
| Push protected branch | APPROVAL |
| Rewrite Git history | PROHIBITED |
| Expose secrets | PROHIBITED |
| Disable security controls | PROHIBITED |
| Destroy production data | PROHIBITED |
| Bypass approval gates | PROHIBITED |

---

# 37. FINAL OPERATING RULE

The Athenaagent system should operate according to:

```text
READ FREELY
       ↓
ANALYZE DEEPLY
       ↓
MODIFY WITHIN SCOPE
       ↓
VALIDATE AUTOMATICALLY
       ↓
COMMIT ATOMICALLY
       ↓
ROLLBACK WHEN NECESSARY
       ↓
ESCALATE HIGH-RISK DECISIONS
       ↓
NEVER BYPASS GOVERNANCE
```

The purpose of these permissions is **not to make Athenabureaucratic**.

It is to create a system where agents can autonomously perform 80–90% of routine engineering work while reserving the genuinely consequential decisions for the Human CEO.

> **Fast agents. Clear boundaries. Small blast radius. Automatic recovery. Human control over irreversible decisions.**