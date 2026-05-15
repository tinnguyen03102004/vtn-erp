# Projects & Timesheets Module — E2E Test Spec

## Module Routes
- `/projects` — Project listing
- `/projects/new` — Create project
- `/projects/[id]` — Project detail (phases, tasks)
- `/timesheets` — Timesheet logging

## Business Flow
```
Contract Won → Auto-create Project → Add Phases → Add Tasks → Log Time → Track Progress
```

## Test Scenarios

### Project Management
1. **View Projects** — Login → Navigate to `/projects` → Assert project list
2. **Create Project** — Fill name, client, dates → Save → Assert in list
3. **Project Detail** — Click project → Assert phases and tasks visible
4. **Add Phase** — Add project phase (design, construction, supervision) → Save
5. **Add Task** — Add task to phase with assignee → Save
6. **Task Status** — Change task status (todo → in-progress → done) → Assert updated
7. **Project Progress** — Assert progress bar reflects completed tasks

### Timesheet Logging
8. **Log Time** — Select project → Select task → Enter hours → Save
9. **View Timesheet** — Assert logged entries visible in list
10. **Edit Timesheet** — Modify hours → Save → Assert updated
11. **Timesheet Summary** — Monthly view → Assert total hours per project

### Integration
12. **Contract → Project Link** — Confirm quotation → Assert project auto-created
13. **Task → Timesheet Link** — Log time on task → Assert reflected in project hours
14. **Project → Invoice Link** — Create invoice from project milestones → Assert amounts match
