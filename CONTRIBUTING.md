# Contributing to DiffWall

DiffWall is intentionally modular. The fastest useful contributions are:

- Add a risky diff fixture in `test/fixtures/`
- Add a framework policy in `examples/`
- Add or tune a detector in `src/rules/`
- Improve route explanations in `src/output/`
- Add CI examples for GitHub, GitLab, or Bitbucket

## Local loop

```bash
npm install
npm run build
npm test
npm run scan:demo
```

Keep rules deterministic, explainable, and conservative around critical risk.
