# Design: Natural Language Date Parsing & Recent Time Entries

**Date:** 2026-03-05
**Status:** Approved

## Overview

Two enhancements to the ClickUp MCP server:

1. **Natural language date parsing** in `track_time` — replace manual date handling with `chrono-node` so users can pass dates like "today", "March 5", "02-11", or "last Monday" without specifying a year.
2. **`get_recent_time_entries` tool** — new MCP tool that fetches all time entries from the past 14 days across all workspaces, giving Claude task context before follow-up `track_time` calls.

## Feature 1: Date Parsing Enhancement (`track_time`)

### Dependency

Add `chrono-node` to `package.json` dependencies.

### Approach

Replace the manual `date` string handling in `track_time` with a `parseDate(input?)` helper:

- No `date` provided → returns today
- `date` provided → calls `chrono.parseDate(input, referenceDate)` where `referenceDate` is Jan 1 of the current year, ensuring ambiguous inputs ("02-11", "March 5") always resolve to the current year
- `chrono` returns null → return error to caller with a helpful message
- Supported formats: "today", "yesterday", "Monday", "last Tuesday", "March 5", "02-11", "2026-02-11", full ISO strings

### Week Support

Week-filling (same hours across Mon–Fri) is handled at the tool description level (Approach C). The tool logs one entry per call; the calling model is instructed to call `track_time` once per day when a week range is specified.

### Tool Description Update

Add to the `track_time` description:
> "Dates can be natural language ('today', 'last Monday', 'March 5'). If the calling model can resolve the date to YYYY-MM-DD, prefer sending that. Otherwise pass the natural language string and the server will resolve it. Always assumes current year when year is omitted."

## Feature 2: `get_recent_time_entries` Tool

### Purpose

Fetch all time entries logged by the authenticated user in the past 14 days across all workspaces. Returns task context (ID, custom ID, name, URL) so Claude can reference tasks in subsequent `track_time` calls without the user looking up IDs.

### API

ClickUp: `GET /team/{team_id}/time_entries`
Filtered by `start_date` (now minus 14 days) and `end_date` (now).

### Flow

1. Call `getWorkspaces()` to retrieve all team IDs
2. For each workspace, call new `getTimeEntries(teamId, { start_date, end_date })` method
3. Merge results across workspaces, sorted by most recent first

### Response Shape (per entry)

```
task_id, custom_id, task_name, task_url,
date, start_time, end_time, duration (human-readable),
description (if any), billable
```

### New Client Method

`getTimeEntries(teamId, { start_date, end_date })` added to `clickup-client.ts`, calling `GET /team/{teamId}/time_entries`.

### Tool Description

> "Get all time entries logged in the past 14 days across all workspaces. Use this before tracking time so you have task IDs and context available."

### Scope

14-day window is fixed — no configuration parameter needed.

## Files Changed

| File | Change |
|------|--------|
| `package.json` | Add `chrono-node` dependency |
| `src/utils/clickup-client.ts` | Add `getTimeEntries()` method |
| `src/tools/tasks.ts` | Add `parseDate()` helper, update `track_time`, add `get_recent_time_entries` tool |
| `src/server.ts` | Update logged tool list |
