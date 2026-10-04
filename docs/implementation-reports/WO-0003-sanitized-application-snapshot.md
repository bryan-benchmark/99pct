# WO-0003 — Sanitized application snapshot

Date: 2026-10-03

Source tree: tracked commit `321d4b6cf88737c096918cad51069f2294e8c934`  
Method: `git archive` of that commit into a temporary directory outside this worktree. The developer working directory was not copied. Private Git history was not merged, mirrored, or grafted.

No Firebase project, domain, or database was changed. Nothing was deployed.

## What was imported

247 tracked source files from the sanitized archive, plus this report.

Kept: explanatory application, protocol/content/components, workspace code and migrations, workspace scripts, package and build config, CI workflow, public spec and operations docs, Spark/Pilot/experiment/team-up/toolshare source, and experimental Mission Units and talent source.

Mission Units code remains experimental. It is not an issued-equity ledger.

## What was omitted

- 3 named-person compensation, employment-deal, or role-negotiation documents, plus index links to those documents
- 2 office-document binaries not required to build
- 3 nonessential brand archives/PDFs
- the helper script whose only job is shipping private corporate records, and the two package scripts that called it
- ignored or untracked local artifacts, by using `git archive` rather than a directory copy: database dumps, prototype data files, debug logs, review archives, environment files, and private corporate records
- sibling projects that are not in that Git tree
- predecessor `AGENTS.md`, root `README.md`, and `spec/README.md`, because they would overwrite this repo's control-plane files

`spec/canonical.json` was compared byte-for-byte and left unchanged.

## Migration-only edits

- Experimental scorecard and scenario identifiers that named a private party were renamed to non-identifying labels, including the barrel re-export. Tests were updated to those labels. Numeric expectations were not changed.
- A follow-up publication pass replaced remaining named-person identities on simulator compensation, cash, investment, and ownership examples with neutral labels such as Founder A, Founder B, and Contributor A. Amounts, dates, and test expectations were not changed. Dependency versions were not changed.
- A CI Firebase web API key fixture matched gitleaks rule `generic-api-key`. It was replaced with the example fixture string already used by the workspace build-config test. Loopback database userinfo for the disposable Actions Postgres service was not flagged and was left in place.
- `package.json` `license` is `AGPL-3.0-only`. Third-party packages were not relicensed. `docs/` and `spec/` were not placed under AGPL.

## Scans

Credential scan, before copy into this worktree:

- tool: gitleaks 8.30.1
- command class: `gitleaks dir <candidate> --redact`
- first result: 1 finding, the CI API key fixture above
- after the fixture edit: 0 findings

A later worktree scan also matched generated `.next` build output. That output is gitignored and is not in the commit.

The first privacy/publication review was not sufficient. It checked named-person compensation documents, private legal records, personal email domains, local-machine absolute paths, database dumps, environment files, and review archives, and it missed named-person identities attached to illustrative simulator and ownership inputs.

A follow-up review checked that additional category: person names placed beside annual-reference, cash, investment, or ownership examples. Those identities were replaced with neutral labels. The numeric inputs were left in place. The review did not treat generic teaching names in protocol explanations as that category, and it did not change the public repository name.

`npm audit` still reports 10 high severity issues. They stay unresolved in this order. No dependency was added, removed, or upgraded to clear them.

## Verification

Node v22.23.3, in this repository after the import:

| Command | Result |
|---|---|
| `npm ci` | Exit 0 |
| `npm run verify` | Exit 0. 81 passed, 0 failed. Canonical badge check passed. |
| `npm run lint` | Exit 0 |
| `npx tsc --noEmit` | Exit 0, after Next generated its gitignored types file |
| `npm run build` | Exit 0 |

The same four commands were run again on 2026-10-04 after the named-person simulator and ownership labels were neutralized. `npm ci`, verify, lint, typecheck, and build each exited 0. Tests were not deleted or weakened.

`npm audit` reported 10 high severity issues on both runs and was not used as a merge gate. Those issues were not changed in this order.

## History and control plane

This branch's parent is only 99pct `main`. The private repository's commits are not ancestors.

Protected control-plane files were not overwritten. Root `LICENSE` and `LICENSE_SCOPE.md` remain intact.

## Remaining risks

- Firebase configuration still names the predecessor project and backend. Do not deploy this snapshot or point traffic at it.
- Workspace routes still fail closed without server configuration. No shared database was migrated.
- Local-disk Spark and demo stores are included as prototype code. They are not durable production storage.
- Older spec prose can still describe an MCU as an ownership claim. ADR-005 is still proposed. ADR-001 is unchanged.
- The public interface does not yet offer corresponding AGPL source. That is required before a public network deployment, not before this import.
- `docs/` and `spec/` still have no document license.
