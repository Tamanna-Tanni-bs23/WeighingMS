## Failure scenarios (Step 30)

| Scenario | Expected | Actual | Pass |
|---|---|---|---|
| Scale unavailable | Safe failure | "SCALE OFFLINE — WEIGHING PAUSED", OK disabled, no record, strip shows OFFLINE; API 503 | ✓ |
| OrgaTEX unavailable (queue) | Defined behaviour | "OrgaTEX unavailable" + Retry; loads after reconnect | ✓ |
| OrgaTEX unavailable (completion) | Defined behaviour | Records kept, write-back PENDING, Retry → CONFIRMED | ✓ |
| Printer unavailable | Defined behaviour | "Printer unavailable — …" notice, ticket kept in preview, write-back unaffected | ✓ |
| Invalid weight / over tolerance | Cannot confirm | OK disabled; API 409 OUT_OF_TOLERANCE | ✓ |
| Under tolerance | Cannot confirm | OK disabled at 93.4 g | ✓ |
| Re-tare | Weight reset | 500.0 g → 0.0 g | ✓ |
| Quit | Safe exit | Component back to pending, no record | ✓ |
| Incomplete batch | Cannot complete | API 409 BATCH_INCOMPLETE | ✓ |

