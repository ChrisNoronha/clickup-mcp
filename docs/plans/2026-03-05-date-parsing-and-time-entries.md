# Natural Language Date Parsing & Recent Time Entries Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add `chrono-node` natural language date parsing to `track_time`, and add a `get_recent_time_entries` tool that returns all time entries from the past 14 days.

**Architecture:** `chrono-node` is added as a runtime dependency and used inside a `parseDate()` helper in `tasks.ts`. The tool description is also updated to guide calling models to pre-resolve dates. `get_recent_time_entries` calls a new `getTimeEntries()` method on `ClickUpClient` that hits `GET /team/{teamId}/time_entries`, iterating over all workspaces and merging results.

**Tech Stack:** TypeScript, Node.js ≥18, `@modelcontextprotocol/sdk`, `chrono-node`, ClickUp API v2.

---

### Task 1: Install `chrono-node`

**Files:**
- Modify: `package.json`

**Step 1: Install the dependency**

```bash
cd clickup-agent
npm install chrono-node
```

Expected output: `added N packages` with no errors.

**Step 2: Verify it's in package.json**

Check that `"chrono-node"` appears in `"dependencies"` in `package.json`.

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add chrono-node for natural language date parsing"
```

---

### Task 2: Add `TimeEntry` types

**Files:**
- Modify: `src/types/clickup.ts`

The ClickUp `GET /team/{teamId}/time_entries` API returns `{ data: TimeEntry[] }`. The `TimeEntry` type shares the same task shape as `TimeEntryResponse.data` but is used in a list context.

**Step 1: Add types at the bottom of `src/types/clickup.ts` (after the existing `TimeEntryResponse`)**

```typescript
export interface TimeEntry {
  id: string;
  task: {
    id: string;
    name: string;
    custom_id?: string;
    url?: string;
    status?: Status;
  };
  wid: string;
  user: User;
  billable: boolean;
  start: string;        // Unix ms timestamp as string
  end: string;          // Unix ms timestamp as string
  duration: string;     // Duration in ms as string (negative if timer still running)
  description: string;
  tags: Array<{ name: string; tag_bg?: string; tag_fg?: string }>;
  at: string;
}

export interface TimeEntriesResponse {
  data: TimeEntry[];
}
```

**Step 2: Build to verify no type errors**

```bash
npm run build
```

Expected: Compiles with no errors.

**Step 3: Commit**

```bash
git add src/types/clickup.ts
git commit -m "feat: add TimeEntry and TimeEntriesResponse types"
```

---

### Task 3: Add `getTimeEntries()` to `ClickUpClient`

**Files:**
- Modify: `src/utils/clickup-client.ts`

**Step 1: Add the import for the new types at the top of `clickup-client.ts`**

The import block currently ends with `TimeEntryResponse`. Add `TimeEntry` and `TimeEntriesResponse`:

```typescript
import type {
  // ... existing imports ...
  CreateTimeEntryParams,
  TimeEntryResponse,
  TimeEntry,
  TimeEntriesResponse
} from '../types/clickup.js';
```

**Step 2: Add the method inside the `ClickUpClient` class, after `updateTimeEntry`**

```typescript
/**
 * Get time entries for a workspace within a date range
 */
async getTimeEntries(
  teamId: string,
  params: { start_date: number; end_date: number }
): Promise<TimeEntry[]> {
  const response = await this.request<TimeEntriesResponse>(
    'GET',
    `/team/${teamId}/time_entries`,
    undefined,
    params
  );
  return response.data ?? [];
}
```

**Step 3: Build to verify**

```bash
npm run build
```

Expected: No errors.

**Step 4: Commit**

```bash
git add src/utils/clickup-client.ts
git commit -m "feat: add getTimeEntries method to ClickUpClient"
```

---

### Task 4: Add `parseDate()` helper and update `track_time`

**Files:**
- Modify: `src/tools/tasks.ts`

**Step 1: Add the `chrono-node` import at the top of `src/tools/tasks.ts`**

After the existing imports, add:

```typescript
import * as chrono from 'chrono-node';
```

**Step 2: Add the `parseDate()` helper function before `registerTaskTools`**

Place this directly after the existing `parseTimeString` function:

```typescript
/**
 * Parse a date string (natural language or structured) to a Date object.
 * Always resolves to current year when year is not specified.
 * Returns today if no input given.
 */
function parseDate(dateInput?: string): Date {
  if (!dateInput) return new Date();

  // Reference date: Jan 1 of the current year — ensures "March 5" → current year
  const referenceDate = new Date(new Date().getFullYear(), 0, 1);
  const parsed = chrono.parseDate(dateInput, referenceDate);

  if (!parsed) {
    throw new Error(
      `Could not parse date "${dateInput}". ` +
      `Accepted formats: "today", "yesterday", "Monday", "last Tuesday", ` +
      `"March 5", "02-11", "2026-02-11".`
    );
  }

  return parsed;
}
```

**Step 3: Replace the manual date parsing block inside `track_time`**

Find this existing block in the `track_time` handler (around line 666):

```typescript
// 1. Parse the date (default to today)
const entryDate = date ? new Date(date + 'T00:00:00') : new Date();
const year = entryDate.getFullYear();
const month = entryDate.getMonth();
const day = entryDate.getDate();

if (isNaN(entryDate.getTime())) {
  return {
    content: [{
      type: 'text' as const,
      text: `Error: Invalid date format "${date}". Please use YYYY-MM-DD format (e.g., 2026-02-11).`
    }],
    isError: true
  };
}
```

Replace it with:

```typescript
// 1. Parse the date (supports natural language, defaults to today)
let entryDate: Date;
try {
  entryDate = parseDate(date);
} catch (err: any) {
  return {
    content: [{
      type: 'text' as const,
      text: `Error: ${err.message}`
    }],
    isError: true
  };
}
const year = entryDate.getFullYear();
const month = entryDate.getMonth();
const day = entryDate.getDate();
```

**Step 4: Update the `track_time` tool description**

Find the `description` field in the `track_time` tool registration:

```typescript
description: 'Log a time entry on a ClickUp task. Accepts start and end times in AM/PM (e.g., "8:00 AM", "2pm") or 24h format (e.g., "14:00"). Automatically detects custom IDs (e.g., ST-353).',
```

Replace with:

```typescript
description: 'Log a time entry on a ClickUp task. Accepts start and end times in AM/PM (e.g., "8:00 AM", "2pm") or 24h format (e.g., "14:00"). Automatically detects custom IDs (e.g., ST-353). The date field accepts natural language ("today", "last Monday", "March 5", "02-11") and always assumes the current year when year is omitted. If you can resolve the date to YYYY-MM-DD before calling this tool, prefer that; otherwise pass the natural language string. For filling the same hours across a full week, call this tool once per day.',
```

**Step 5: Update the `date` field description in the input schema**

Find:

```typescript
date: z.string().optional().describe('Date in YYYY-MM-DD format (defaults to today)'),
```

Replace with:

```typescript
date: z.string().optional().describe('Date of the time entry. Accepts YYYY-MM-DD, natural language ("today", "yesterday", "Monday", "March 5", "02-11"), or any unambiguous date string. Defaults to today. Year defaults to current year when omitted.'),
```

**Step 6: Build to verify**

```bash
npm run build
```

Expected: No errors.

**Step 7: Commit**

```bash
git add src/tools/tasks.ts
git commit -m "feat: add natural language date parsing to track_time via chrono-node"
```

---

### Task 5: Add `get_recent_time_entries` tool

**Files:**
- Modify: `src/tools/tasks.ts`

**Step 1: Add the new tool inside `registerTaskTools`, after the `track_time` tool**

```typescript
/**
 * Get recent time entries (past 14 days, all workspaces)
 */
server.registerTool(
  'get_recent_time_entries',
  {
    description: 'Get all time entries logged in the past 14 days across all workspaces. Use this before tracking time to have task IDs and context available without asking the user to look them up.',
    inputSchema: z.object({})
  },
  async () => {
    try {
      const now = Date.now();
      const fourteenDaysAgo = now - 14 * 24 * 60 * 60 * 1000;

      const workspaces = await client.getWorkspaces();
      const allEntries: any[] = [];

      for (const workspace of workspaces) {
        try {
          const entries = await client.getTimeEntries(workspace.id, {
            start_date: fourteenDaysAgo,
            end_date: now
          });
          allEntries.push(...entries);
        } catch (err) {
          console.error(
            `Warning: Could not fetch time entries for workspace "${workspace.name}": ${formatErrorForMCP(err)}`
          );
        }
      }

      // Sort most recent first
      allEntries.sort((a, b) => parseInt(b.start) - parseInt(a.start));

      const formatted = allEntries.map(entry => {
        const startMs = parseInt(entry.start);
        const durationMs = Math.abs(parseInt(entry.duration));
        const startDate = new Date(startMs);

        const hours = Math.floor(durationMs / (1000 * 60 * 60));
        const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
        const durationDisplay = hours > 0
          ? `${hours}h${minutes > 0 ? ` ${minutes}m` : ''}`
          : `${minutes}m`;

        return {
          task_id: entry.task?.id ?? null,
          custom_id: entry.task?.custom_id ?? null,
          task_name: entry.task?.name ?? null,
          task_url: entry.task?.url ?? null,
          date: startDate.toISOString().split('T')[0],
          start_time: startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          duration: durationDisplay,
          description: entry.description || null,
          billable: entry.billable
        };
      });

      return {
        content: [{
          type: 'text' as const,
          text: `Found ${formatted.length} time entry/entries in the past 14 days:\n\n${JSON.stringify(formatted, null, 2)}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text' as const,
          text: `Error fetching recent time entries: ${formatErrorForMCP(error)}`
        }],
        isError: true
      };
    }
  }
);
```

**Step 2: Build to verify**

```bash
npm run build
```

Expected: No errors.

**Step 3: Commit**

```bash
git add src/tools/tasks.ts
git commit -m "feat: add get_recent_time_entries tool (past 14 days, all workspaces)"
```

---

### Task 6: Update server tool log

**Files:**
- Modify: `src/server.ts`

**Step 1: Update the `console.error` log lines in `createServer()`**

Find:

```typescript
console.error('- Time Tracking: track_time');
```

Replace with:

```typescript
console.error('- Time Tracking: track_time, get_recent_time_entries');
```

**Step 2: Build one final time**

```bash
npm run build
```

Expected: No errors. `dist/` updated.

**Step 3: Commit**

```bash
git add src/server.ts
git commit -m "chore: update server tool log to include get_recent_time_entries"
```

---

## Smoke Test Checklist

After all tasks complete, verify the following manually via Claude Desktop or any MCP client:

1. `track_time` with `date: "today"` → logs entry for today
2. `track_time` with `date: "03-01"` → logs entry for 2026-03-01 (current year, not 2025)
3. `track_time` with `date: "last Monday"` → logs entry for the correct past Monday
4. `track_time` with no `date` field → logs entry for today
5. `track_time` with `date: "notadate"` → returns a helpful error message
6. `get_recent_time_entries` → returns a list of time entries with task IDs, names, and URLs
