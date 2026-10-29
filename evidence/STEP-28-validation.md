## UI validation vs prototype (Step 28)

| Area | Match | Deviation (reason) |
|---|---|---|
| Screen 1 · Select batch | Scan prompt, table columns, tags | Status `QUEUED` for released; B-24187 starts fresh 0/5 (to demo full flow) |
| Screen 2 · Weigh | Rail, meta line, scale badge, 3 readouts, bar + band + target line, status line, surplus panel, OK/Re-tare/Quit/Override | Simulator bar moved inside the screen, labelled "Training simulator"; Override enabled only when over tolerance |
| Screen 3 · Confirm & print | Summary rows, write-back line, ticket layout, Print / Next | Shows PENDING + Retry when OrgaTEX down; "Reprint" + REPRINT marker |
| Chrome | Topbar, operator chip, status strip, clock | Strip is live from `/api/health`; operator selectable before a batch starts |
| Not reproduced | Facilitator notes, question pins, screen switcher | Prototype-only discussion aids; navigation is workflow-driven |

