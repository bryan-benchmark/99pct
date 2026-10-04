# Experiment proposal registry demo

**Status:** Experimental product prototype. The registry records designs, not live experiments.

This is step 7 of [Mission Network v0](./MISSION_NETWORK_V0.md). A fictional Toolshare example asks whether a clearer issue-report prompt would improve triage quality. Each proposal records a hypothesis, intervention, comparison, exposure class, primary outcome, human guardrail, consent plan, stop rule, evidence plan, review end date, and adoption decision rule. These fields make review possible before exposure; completing them is not approval.

## Exposure classes

- **Interface only:** a change to information or interaction, with no removal of safety information or individual rights.
- **Operational practice:** a change to how a Mission service is run. It requires the Mission's responsible steward to assess safety, resources, and participant choice.
- **Protocol change candidate:** a proposed change to shared rules. It requires separate governance review and cannot be promoted by this registry.

No class authorizes automated experimentation. The form does not assign people, collect data, evaluate results, or alter `spec/canonical.json`. A real test needs a reviewed plan, verified steward, suitable recruitment and consent, an incident path, and an evidence record. A later adoption decision must document the evidence and its limits. Constitutional rights and ownership guarantees are outside the scope of automatic experimentation.

## Local storage

Proposals are JSON records under `.data/experiments/`, excluded from Git. Anyone holding a local proposal URL can read it. Do not enter private participant data. Public operation would need durable storage, access controls, moderation, versioned reviews, and an auditable change history.
