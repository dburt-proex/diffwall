# DiffWall for GitLab CI

DiffWall's core scanner is a plain Node CLI (`dist/cli.js`), so it can run in
any CI system, not just GitHub Actions. This page documents a GitLab CI job
that scans a merge request's diff and fails the pipeline only when DiffWall
routes the change to `HALT`.

An example job is available at:

```text
examples/gitlab-ci.yml
```

Copy it into your project's `.gitlab-ci.yml` (or `include:` it) and adjust
the `stage`, image, and config path as needed.

---

## Required refs / environment variables

The job relies on GitLab's built-in merge request pipeline variables. These
are only populated when the pipeline is triggered by a merge request event
(`rules: if: '$CI_PIPELINE_SOURCE == "merge_request_event"'`), so the example
restricts the job to that pipeline source.

| Variable | Purpose |
|---|---|
| `CI_PIPELINE_SOURCE` | Used in the job's `rules` to only run on merge request pipelines. |
| `CI_MERGE_REQUEST_DIFF_BASE_SHA` | The merge request's base commit. Passed to DiffWall as `--base`. |
| `CI_COMMIT_SHA` | The commit currently being built (the merge request head). Passed to DiffWall as `--head`. |
| `CI_PROJECT_DIR` | The checkout of the project under test, used to locate `rules/default.yml` and to write the report. |

No token is required for the base scan itself; the example does not post a
merge request comment. If you want comment support, add a step that calls
the GitLab API with a `CI_JOB_TOKEN` or a project access token that has
`api` scope.

`GIT_DEPTH: 0` (a full clone) is set so that the base commit referenced by
`CI_MERGE_REQUEST_DIFF_BASE_SHA` is available locally; a shallow clone may
not contain it.

---

## Failing only on `HALT`

DiffWall's CLI already separates operational failures from policy
enforcement:

- Exit code `1` — an operational error (bad arguments, missing diff, config
  parse failure). This is not a policy verdict.
- Exit code `2` — the scan completed and DiffWall routed the change to
  `HALT`, but **only** when `--fail-on-halt` is passed. Without that flag,
  DiffWall always exits `0` regardless of route.
- Exit code `0` — the scan completed and the route was `ALLOW` or `REVIEW`
  (or `HALT` without `--fail-on-halt`).

Passing `--fail-on-halt` (as in `examples/gitlab-ci.yml`) is therefore
sufficient to make the GitLab job fail only when the route is `HALT`;
`ALLOW` and `REVIEW` routes both exit `0` and let the pipeline continue.

If you also want operational errors (exit `1`) to be reported without
blocking the pipeline, GitLab supports scoping `allow_failure` to specific
exit codes:

```yaml
diffwall:
  script:
    - node /tmp/diffwall/dist/cli.js scan --base "$CI_MERGE_REQUEST_DIFF_BASE_SHA" --head "$CI_COMMIT_SHA" --format markdown --fail-on-halt
  allow_failure:
    exit_codes: 1
```

With this configuration the job still fails (blocking merge, if required) on
exit code `2` (`HALT`), but exit code `1` (a DiffWall operational error) is
reported as a warning instead of a hard pipeline failure.

---

## Local equivalent

```bash
npm install
npm run build
node dist/cli.js scan --base origin/main --head HEAD --format markdown --fail-on-halt
```
