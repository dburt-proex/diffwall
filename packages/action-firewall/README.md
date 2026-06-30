# DiffWall Action Firewall

A stdlib-only Python CASA enforcement adapter for proposed AI/agent actions.

It validates structured action objects before execution and routes them to:

- `ALLOW` — read-only / low-impact
- `REVIEW` — impactful or unknown; human review required
- `HALT` — destructive, financial, secret-leaking, or unsafe

## Run

```bash
python -m unittest discover -s tests -v
python demo/halt_demo.py
python -m diffwall.cli validate examples/actions/allow_read_file.json
python -m diffwall.cli validate examples/actions/halt_delete_prod_db.json
```

## CLI

```bash
python -m diffwall.cli validate <file_or_dir> [--json]
```

Exit codes:

| Exit | Verdict |
|---:|---|
| 0 | ALLOW |
| 1 | REVIEW |
| 2 | HALT |

## Module map

| Module | Responsibility |
|---|---|
| `diffwall/models.py` | Verdicts, actions, rule results, reports, severity merge |
| `diffwall/rules.py` | CASA rule set |
| `diffwall/engine.py` | Rule execution, most-restrictive merge, fail-safe default |
| `diffwall/report.py` | Human-readable audit report |
| `diffwall/cli.py` | Batch validation and CI exit codes |

## Why this exists

Agentic systems need a hard boundary between proposed intent and actual execution. Prompt instructions are not enforcement. DiffWall Action Firewall evaluates the action object itself and emits an auditable route decision.
