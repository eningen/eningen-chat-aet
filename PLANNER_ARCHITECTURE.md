# Chat AET Planner Architecture v1

## Purpose
Chat AET should be able to turn a complex user goal into a structured sequence of steps, execute each step through its existing model/router infrastructure, verify the result, and re-plan when a step fails.

## Safety boundaries
- Planning is allowed automatically.
- Verification is automatic.
- Re-planning is automatic.
- Privileged database changes, secret changes, destructive operations, account/security changes, and production-impacting changes must require an explicit approval boundary in the executor layer.
- The planner must never treat model output as executable instructions without passing through the executor's allowlist/validation layer.

## State machine
`planned -> running -> completed`

Failure path:
`running -> needs_replan -> replanned -> running`

Individual steps:
`pending -> running -> passed`
`pending/running -> failed -> replanned`

## Plan fields
- goal
- constraints
- assumptions
- successCriteria
- riskLevel
- steps
- currentStepId
- status
- timestamps

## Step fields
- id
- title
- goal
- dependsOn
- successCriteria
- status
- attempts
- result
- verification
- risk
- requiresApproval

## Integration target
The browser UI contains the Planner module, but the authoritative orchestration should eventually live server-side beside `chat-aet-router`. The router remains the model integration layer. Planner decides *what* to do; Executor decides *how* to perform an allowed action; Verifier decides whether the result meets the criteria; Replanner changes the remaining plan after failure.

## Completion criteria
A plan is complete only when every required step is passed and the final plan-level success criteria are satisfied. A model saying "done" is not itself sufficient evidence.
