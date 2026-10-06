# HERMES — Product context

## Product purpose

HERMES is an operational console for companies that receive customer conversations through connected channels and use Hermes Agent with human takeover when needed.

## Primary users

- Company administrators configuring the pilot.
- Human attendants who need to notice conversations that require intervention.
- Operators reviewing quality, failures, and approved knowledge.

## Primary job

The interface is an **operate** product: help a person understand the current service state, find the conversation that needs attention, take over safely, and return control to Hermes when appropriate.

## Main tasks

1. See whether the API and tenant are available.
2. Find recent or filtered conversations.
3. Open the persisted history.
4. Identify whether Hermes or a human controls the conversation.
5. Take over or return control.
6. Review approved knowledge, integrations, and pilot quality targets.

## Product constraints

- Do not present study assumptions as real production metrics.
- Do not show an action as functional before the backend can actually perform it.
- Tenant isolation is enforced by the backend; the UI must not imply otherwise.
- Human handoff is a high-priority operational state.
- The interface must remain usable on narrow screens and with keyboard navigation.
- Status, error, empty, loading, and unavailable states must be explicit.

## Content principles

- Prefer direct operational language.
- Use sentence case for controls and headings.
- Avoid repeated explanatory copy.
- Describe unavailable features plainly instead of presenting dead controls as complete features.
