# Pilot Consent and Operating Boundaries

**Pilot ID:** `PILOT-001`  
**Participant:**  
**Boundary version:**  
**Effective date:**

## Commercial terms

- The validation pilot is provided at no cost.
- The participant has no purchase obligation.
- Any paid implementation, policy customization, training, or production-enforcement work requires a separate written scope and approval.
- The pilot does not include certification, compliance attestation, penetration testing, or guaranteed risk reduction.

## Authorized environment

- Repository or test repository:
- Approved non-production branch:
- Repository owner:
- Human reviewer:
- Approved DiffWall version or immutable commit:
- Approved policy file or content hash:

## Access and data boundary

The pilot must not require or retain:

- customer data;
- production credentials;
- signing keys;
- live secrets or tokens;
- unrestricted access to confidential source;
- hidden monitoring;
- production deployment rights.

Record any participant-approved repository metadata or redacted evidence:

- Approved metadata:
- Approved report fields:
- Approved evidence location:
- Explicit exclusions:

## Execution boundary

- [ ] Advisory-only enforcement.
- [ ] One controlled `ALLOW` scenario.
- [ ] One non-destructive `REVIEW` scenario.
- [ ] One inert unsafe `HALT` scenario.
- [ ] No production merge gate.
- [ ] No destructive command is executed.
- [ ] Rollback and cleanup steps are documented before execution.

## Evidence retention

- Default evidence retention period:
- Evidence owner:
- Approved storage location:
- Redaction requirements:
- Deletion date or review date:

## Citation permission

The program permits anonymized findings only with participant approval.

- [ ] Participant permits anonymized findings to be cited.
- [ ] Participant requires all evidence to remain private.
- [ ] Participant will decide after reviewing the outcome report.

Anonymized citation must remove organization names, individual names, repository names, URLs, code, screenshots, unique identifiers, and confidential operational details unless separately approved.

## Consent

The participant confirms that:

- the named owner has authority to approve the test boundary;
- the selected branch or repository is non-production;
- the fixtures are synthetic and inert;
- DiffWall remains an early-stage developer-control system;
- the pilot may produce `VALIDATED_SIGNAL`, `PARTIAL_SIGNAL`, `NEGATIVE_SIGNAL`, or `INCONCLUSIVE`;
- no production recommendation or public claim is automatic.

Participant approver:  
Date:  
DiffWall pilot owner:  
Date: