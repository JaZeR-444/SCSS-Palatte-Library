# Protected Decisions

Decisions Claude must NOT reverse without explicit instruction.
Each entry: the decision, the reason, and the date.

- **[PROTECTED_DECISION]**
  - Reason: [why this was chosen]
  - Date: [YYYY-MM-DD]

- **[PROTECTED_DECISION]**
  - Reason: [why]
  - Date: [YYYY-MM-DD]

If a task would reverse one of these, stop and flag it before proceeding.
