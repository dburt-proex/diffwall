# Live GitHub Action Validation

This file exists to create a controlled documentation-only pull request for validating DiffWall's repository workflow end to end.

Expected DiffWall route: `ALLOW`.

The validation is successful when:

1. The DiffWall workflow runs through `uses: ./action`.
2. The generated report identifies this change as `ALLOW`.
3. The workflow completes without the report-delivery path changing the enforcement verdict.
4. The TypeScript and Python CI jobs complete successfully.
5. The scan compares against the pull request's immutable base commit SHA.
6. The workflow uploads its report before enforcing the verdict.
