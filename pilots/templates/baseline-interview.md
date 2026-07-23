# Pilot Baseline Interview

**Pilot ID:** `PILOT-001`  
**Participant:**  
**Interview date:**  
**Interviewer:**  
**Technical owner:**  
**Human reviewer:**

## Current workflow

1. Which AI coding assistants or agents are currently used?
2. Where do AI-generated changes enter the development workflow?
3. Which pull-request checks are currently required?
4. Who can approve protected or high-risk changes?
5. Which tools currently produce review, security, or audit evidence?

## Risk and authority

1. What AI-assisted development risk is the team trying to control?
2. Which paths or change types require experienced human judgment?
3. Which changes should never merge without an explicit stop?
4. Which changes are safe enough to pass without added friction?
5. Where is ownership unclear or overly dependent on one person?

## Evidence expectations

1. What evidence would make a route defensible to engineering leadership or security?
2. Which report format is most useful: Markdown, JSON, SARIF, or another format?
3. How long should route evidence be retained?
4. What information must be redacted?
5. What false-positive rate or review burden would be unacceptable?

## Adoption conditions

1. Would the team initially run DiffWall as advisory evidence, a required check, or neither?
2. What setup time is acceptable?
3. What maintenance burden is acceptable?
4. What would block adoption?
5. What result would justify a paid implementation follow-on?

## Participant problem statement

Capture the participant's current pain in their own words:

> 

## Baseline hypothesis

- Expected useful route:
- Expected noisy route:
- Expected missing coverage:
- Expected protected surfaces:
- Adoption decision the pilot should support:

## Interview evidence classification

Separate the record into:

- **Verified fact:** directly observed current process, configuration, or artifact.
- **Participant statement:** the participant's opinion, preference, or reported pain.
- **Pilot hypothesis:** a claim to test during controlled execution.
- **Unknown:** evidence not yet available.

## Readiness decision

- Decision: `PROCEED | PROCEED_WITH_CONDITIONS | STOP`
- Conditions:
- Missing evidence:
- Owner:
- Date: