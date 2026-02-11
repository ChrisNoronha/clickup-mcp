/**
 * Task management tools for creating, reading, updating, and deleting tasks
 */

import { z } from 'zod';
import { getClickUpClient, ClickUpClient } from '../utils/clickup-client.js';
import { formatErrorForMCP } from '../utils/error-handler.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

/**
 * Parse a time string into total minutes since midnight.
 * Supports: "8:00 AM", "14:30", "8am", "2:30 PM", "08:00"
 * Returns null if parsing fails.
 */
function parseTimeString(timeStr: string): number | null {
  const trimmed = timeStr.trim();

  // Pattern 1: 12-hour with minutes - "8:00 AM", "12:30 pm", "2:30PM"
  const match12 = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM|am|pm|Am|Pm)$/);
  if (match12) {
    let hours = parseInt(match12[1], 10);
    const mins = parseInt(match12[2], 10);
    const period = match12[3].toUpperCase();
    if (hours < 1 || hours > 12 || mins < 0 || mins > 59) return null;
    if (period === 'AM' && hours === 12) hours = 0;
    if (period === 'PM' && hours !== 12) hours += 12;
    return hours * 60 + mins;
  }

  // Pattern 2: Hour-only with AM/PM - "8am", "2PM", "12pm"
  const matchHourOnly = trimmed.match(/^(\d{1,2})\s*(AM|PM|am|pm|Am|Pm)$/);
  if (matchHourOnly) {
    let hours = parseInt(matchHourOnly[1], 10);
    const period = matchHourOnly[2].toUpperCase();
    if (hours < 1 || hours > 12) return null;
    if (period === 'AM' && hours === 12) hours = 0;
    if (period === 'PM' && hours !== 12) hours += 12;
    return hours * 60;
  }

  // Pattern 3: 24-hour format - "08:00", "14:30", "23:59"
  const match24 = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) {
    const hours = parseInt(match24[1], 10);
    const mins = parseInt(match24[2], 10);
    if (hours < 0 || hours > 23 || mins < 0 || mins > 59) return null;
    return hours * 60 + mins;
  }

  return null;
}

export function registerTaskTools(server: McpServer) {
  const client = getClickUpClient();

  /**
   * Create a new task
   */
  server.registerTool(
    'create_task',
    {
      description: 'Create a new task in a ClickUp list. Supports various parameters like assignees, priority, due dates, tags, and more.',
      inputSchema: z.object({
        list_id: z.string().describe('The ClickUp list ID where the task will be created'),
        name: z.string().describe('The name/title of the task'),
        description: z.string().optional().describe('Plain text description of the task'),
        markdown_description: z.string().optional().describe('Markdown formatted description of the task'),
        assignees: z.array(z.number()).optional().describe('Array of user IDs to assign to the task'),
        tags: z.array(z.string()).optional().describe('Array of tag names to add to the task'),
        status: z.string().optional().describe('The status name for the task'),
        priority: z.number().min(1).max(4).optional().describe('Priority level: 1=urgent, 2=high, 3=normal, 4=low'),
        due_date: z.number().optional().describe('Due date as Unix timestamp in milliseconds'),
        start_date: z.number().optional().describe('Start date as Unix timestamp in milliseconds'),
        time_estimate: z.number().optional().describe('Time estimate in milliseconds'),
        notify_all: z.boolean().optional().describe('Notify all assignees when task is created'),
        parent: z.string().optional().describe('Parent task ID to create this as a subtask')
      })
    },
    async (params) => {
      try {
        const { list_id, ...taskData } = params;
        const task = await client.createTask(list_id, taskData);

        return {
          content: [
            {
              type: 'text' as const,
              text: `Task created successfully!\n\n${JSON.stringify({
                id: task.id,
                ...(task.custom_id && { custom_id: task.custom_id }),
                name: task.name,
                url: task.url,
                status: task.status,
                priority: task.priority,
                assignees: task.assignees?.map(a => a.username),
                due_date: task.due_date,
                tags: task.tags
              }, null, 2)}`
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `Error creating task: ${formatErrorForMCP(error)}`
            }
          ],
          isError: true
        };
      }
    }
  );

  /**
   * Get a specific task
   */
  server.registerTool(
    'get_task',
    {
      description: 'Get detailed information about a specific ClickUp task by its ID.',
      inputSchema: z.object({
        task_id: z.string().describe('The ClickUp task ID'),
        include_subtasks: z.boolean().optional().describe('Whether to include subtasks in the response')
      })
    },
    async ({ task_id, include_subtasks }) => {
      try {
        const task = await client.getTask(task_id, { include_subtasks });

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                id: task.id,
                ...(task.custom_id && { custom_id: task.custom_id }),
                name: task.name,
                description: task.description,
                text_content: task.text_content,
                status: task.status,
                priority: task.priority,
                assignees: task.assignees?.map(a => ({
                  id: a.id,
                  username: a.username,
                  email: a.email
                })),
                due_date: task.due_date,
                start_date: task.start_date,
                tags: task.tags,
                url: task.url,
                list: task.list,
                folder: task.folder,
                space: task.space,
                date_created: task.date_created,
                date_updated: task.date_updated,
                archived: task.archived,
                custom_fields: task.custom_fields
              }, null, 2)
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `Error getting task: ${formatErrorForMCP(error)}`
            }
          ],
          isError: true
        };
      }
    }
  );

  /**
   * Smart get task - auto-detects if ID is custom or regular
   */
  server.registerTool(
    'smart_get_task',
    {
      description: 'Get a ClickUp task by ID. Automatically detects if the ID is a custom ID (e.g., ST-353, PROJ-123) or a regular task ID and handles it accordingly. This is the recommended tool for getting tasks when you\'re not sure of the ID type.',
      inputSchema: z.object({
        task_id: z.string().describe('The task ID - can be either a regular ClickUp task ID or a custom ID (e.g., ST-353)'),
        include_subtasks: z.boolean().optional().describe('Whether to include subtasks in the response')
      })
    },
    async ({ task_id, include_subtasks }) => {
      try {
        let task;

        // Check if the ID looks like a custom ID (e.g., "ST-353", "PROJ-123")
        if (ClickUpClient.isCustomId(task_id)) {
          // It's a custom ID - search across all workspaces
          console.error(`Detected custom ID format: ${task_id}. Searching across workspaces...`);
          task = await client.findTaskByCustomId(task_id);
        } else {
          // It's a regular task ID
          console.error(`Using regular task ID: ${task_id}`);
          task = await client.getTask(task_id, { include_subtasks });
        }

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                id: task.id,
                ...(task.custom_id && { custom_id: task.custom_id }),
                name: task.name,
                description: task.description,
                text_content: task.text_content,
                status: task.status,
                priority: task.priority,
                assignees: task.assignees?.map(a => ({
                  id: a.id,
                  username: a.username,
                  email: a.email
                })),
                due_date: task.due_date,
                start_date: task.start_date,
                tags: task.tags,
                url: task.url,
                list: task.list,
                folder: task.folder,
                space: task.space,
                date_created: task.date_created,
                date_updated: task.date_updated,
                archived: task.archived,
                custom_fields: task.custom_fields
              }, null, 2)
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `Error getting task: ${formatErrorForMCP(error)}`
            }
          ],
          isError: true
        };
      }
    }
  );

  /**
   * Get a task by custom ID
   */
  server.registerTool(
    'get_task_by_custom_id',
    {
      description: 'Get detailed information about a ClickUp task using its custom ID (e.g., CUSTOM-123). Custom IDs are workspace-specific identifiers. Requires knowing the team_id. For automatic detection, use smart_get_task instead.',
      inputSchema: z.object({
        team_id: z.string().describe('The ClickUp workspace/team ID'),
        custom_task_id: z.string().describe('The custom task ID (e.g., CUSTOM-123, PROJ-456)'),
        include_subtasks: z.boolean().optional().describe('Whether to include subtasks in the response')
      })
    },
    async ({ team_id, custom_task_id, include_subtasks }) => {
      try {
        const task = await client.getTaskByCustomId(team_id, custom_task_id, { include_subtasks });

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                id: task.id,
                ...(task.custom_id && { custom_id: task.custom_id }),
                name: task.name,
                description: task.description,
                text_content: task.text_content,
                status: task.status,
                priority: task.priority,
                assignees: task.assignees?.map(a => ({
                  id: a.id,
                  username: a.username,
                  email: a.email
                })),
                due_date: task.due_date,
                start_date: task.start_date,
                tags: task.tags,
                url: task.url,
                list: task.list,
                folder: task.folder,
                space: task.space,
                date_created: task.date_created,
                date_updated: task.date_updated,
                archived: task.archived,
                custom_fields: task.custom_fields
              }, null, 2)
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `Error getting task by custom ID: ${formatErrorForMCP(error)}`
            }
          ],
          isError: true
        };
      }
    }
  );

  /**
   * Get tasks from a list
   */
  server.registerTool(
    'get_tasks',
    {
      description: 'Get tasks from a ClickUp list with optional filtering. Supports pagination, status filters, assignee filters, and more.',
      inputSchema: z.object({
        list_id: z.string().describe('The ClickUp list ID'),
        archived: z.boolean().optional().describe('Include archived tasks'),
        page: z.number().optional().describe('Page number for pagination (0-indexed)'),
        order_by: z.enum(['created', 'updated', 'due_date']).optional().describe('Field to order results by'),
        reverse: z.boolean().optional().describe('Reverse the order'),
        subtasks: z.boolean().optional().describe('Include subtasks'),
        statuses: z.array(z.string()).optional().describe('Filter by status names'),
        include_closed: z.boolean().optional().describe('Include tasks with closed statuses'),
        assignees: z.array(z.number()).optional().describe('Filter by assignee user IDs'),
        tags: z.array(z.string()).optional().describe('Filter by tag names'),
        due_date_gt: z.number().optional().describe('Filter tasks with due date greater than this timestamp (ms)'),
        due_date_lt: z.number().optional().describe('Filter tasks with due date less than this timestamp (ms)')
      })
    },
    async (params) => {
      try {
        const { list_id, ...filters } = params;
        const response = await client.getTasks(list_id, filters);

        const taskList = response.tasks.map(t => ({
          id: t.id,
          custom_id: t.custom_id,
          name: t.name,
          status: t.status,
          priority: t.priority,
          assignees: t.assignees?.map(a => a.username),
          due_date: t.due_date,
          tags: t.tags,
          url: t.url,
          date_created: t.date_created,
          date_updated: t.date_updated
        }));

        return {
          content: [
            {
              type: 'text' as const,
              text: `Found ${taskList.length} task(s)${response.last_page === false ? ' (more pages available)' : ''}:\n\n${JSON.stringify(taskList, null, 2)}`
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `Error getting tasks: ${formatErrorForMCP(error)}`
            }
          ],
          isError: true
        };
      }
    }
  );

  /**
   * Update a task
   */
  server.registerTool(
    'update_task',
    {
      description: 'Update an existing ClickUp task. You can update name, description, status, priority, assignees, dates, and more.',
      inputSchema: z.object({
        task_id: z.string().describe('The ClickUp task ID to update'),
        name: z.string().optional().describe('New task name'),
        description: z.string().optional().describe('New plain text description'),
        markdown_description: z.string().optional().describe('New markdown description'),
        status: z.string().optional().describe('New status name'),
        priority: z.number().min(1).max(4).optional().describe('New priority: 1=urgent, 2=high, 3=normal, 4=low'),
        due_date: z.number().nullable().optional().describe('New due date as Unix timestamp in milliseconds (null to remove)'),
        start_date: z.number().nullable().optional().describe('New start date as Unix timestamp in milliseconds (null to remove)'),
        time_estimate: z.number().nullable().optional().describe('New time estimate in milliseconds (null to remove)'),
        assignees_add: z.array(z.number()).optional().describe('User IDs to add as assignees'),
        assignees_remove: z.array(z.number()).optional().describe('User IDs to remove from assignees'),
        archived: z.boolean().optional().describe('Archive or unarchive the task')
      })
    },
    async (params) => {
      try {
        const { task_id, assignees_add, assignees_remove, ...updates } = params;

        // Build assignees object if needed
        const assigneesUpdate = (assignees_add || assignees_remove) ? {
          assignees: {
            ...(assignees_add && { add: assignees_add }),
            ...(assignees_remove && { rem: assignees_remove })
          }
        } : {};

        const updatedTask = await client.updateTask(task_id, {
          ...updates,
          ...assigneesUpdate
        });

        return {
          content: [
            {
              type: 'text' as const,
              text: `Task updated successfully!\n\n${JSON.stringify({
                id: updatedTask.id,
                ...(updatedTask.custom_id && { custom_id: updatedTask.custom_id }),
                name: updatedTask.name,
                status: updatedTask.status,
                priority: updatedTask.priority,
                assignees: updatedTask.assignees?.map(a => a.username),
                due_date: updatedTask.due_date,
                url: updatedTask.url
              }, null, 2)}`
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `Error updating task: ${formatErrorForMCP(error)}`
            }
          ],
          isError: true
        };
      }
    }
  );

  /**
   * Update a task by custom ID
   */
  server.registerTool(
    'update_task_by_custom_id',
    {
      description: 'Update a ClickUp task using its custom ID (e.g., CUSTOM-123). You can update name, description, status, priority, assignees, dates, and more.',
      inputSchema: z.object({
        team_id: z.string().describe('The ClickUp workspace/team ID'),
        custom_task_id: z.string().describe('The custom task ID (e.g., CUSTOM-123, PROJ-456)'),
        name: z.string().optional().describe('New task name'),
        description: z.string().optional().describe('New plain text description'),
        markdown_description: z.string().optional().describe('New markdown description'),
        status: z.string().optional().describe('New status name'),
        priority: z.number().min(1).max(4).optional().describe('New priority: 1=urgent, 2=high, 3=normal, 4=low'),
        due_date: z.number().nullable().optional().describe('New due date as Unix timestamp in milliseconds (null to remove)'),
        start_date: z.number().nullable().optional().describe('New start date as Unix timestamp in milliseconds (null to remove)'),
        time_estimate: z.number().nullable().optional().describe('New time estimate in milliseconds (null to remove)'),
        assignees_add: z.array(z.number()).optional().describe('User IDs to add as assignees'),
        assignees_remove: z.array(z.number()).optional().describe('User IDs to remove from assignees'),
        archived: z.boolean().optional().describe('Archive or unarchive the task')
      })
    },
    async (params) => {
      try {
        const { team_id, custom_task_id, assignees_add, assignees_remove, ...updates } = params;

        // Build assignees object if needed
        const assigneesUpdate = (assignees_add || assignees_remove) ? {
          assignees: {
            ...(assignees_add && { add: assignees_add }),
            ...(assignees_remove && { rem: assignees_remove })
          }
        } : {};

        const updatedTask = await client.updateTaskByCustomId(team_id, custom_task_id, {
          ...updates,
          ...assigneesUpdate
        });

        return {
          content: [
            {
              type: 'text' as const,
              text: `Task updated successfully!\n\n${JSON.stringify({
                id: updatedTask.id,
                ...(updatedTask.custom_id && { custom_id: updatedTask.custom_id }),
                name: updatedTask.name,
                status: updatedTask.status,
                priority: updatedTask.priority,
                assignees: updatedTask.assignees?.map(a => a.username),
                due_date: updatedTask.due_date,
                url: updatedTask.url
              }, null, 2)}`
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `Error updating task by custom ID: ${formatErrorForMCP(error)}`
            }
          ],
          isError: true
        };
      }
    }
  );

  /**
   * Delete a task
   */
  server.registerTool(
    'delete_task',
    {
      description: 'Delete a ClickUp task permanently. This action cannot be undone.',
      inputSchema: z.object({
        task_id: z.string().describe('The ClickUp task ID to delete')
      })
    },
    async ({ task_id }) => {
      try {
        await client.deleteTask(task_id);

        return {
          content: [
            {
              type: 'text' as const,
              text: `Task ${task_id} deleted successfully.`
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `Error deleting task: ${formatErrorForMCP(error)}`
            }
          ],
          isError: true
        };
      }
    }
  );

  /**
   * Get task members
   */
  server.registerTool(
    'get_task_members',
    {
      description: 'Get all members who have access to a specific task.',
      inputSchema: z.object({
        task_id: z.string().describe('The ClickUp task ID')
      })
    },
    async ({ task_id }) => {
      try {
        const members = await client.getTaskMembers(task_id);

        const memberList = members.map(m => ({
          id: m.user.id,
          username: m.user.username,
          email: m.user.email,
          color: m.user.color,
          initials: m.user.initials
        }));

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(memberList, null, 2)
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `Error getting task members: ${formatErrorForMCP(error)}`
            }
          ],
          isError: true
        };
      }
    }
  );

  /**
   * Get list members
   */
  server.registerTool(
    'get_list_members',
    {
      description: 'Get all members who have access to a specific list.',
      inputSchema: z.object({
        list_id: z.string().describe('The ClickUp list ID')
      })
    },
    async ({ list_id }) => {
      try {
        const members = await client.getListMembers(list_id);

        const memberList = members.map(m => ({
          id: m.user.id,
          username: m.user.username,
          email: m.user.email,
          color: m.user.color,
          initials: m.user.initials
        }));

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(memberList, null, 2)
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `Error getting list members: ${formatErrorForMCP(error)}`
            }
          ],
          isError: true
        };
      }
    }
  );

  // ========== Time Tracking Tools ==========

  /**
   * Track time on a task
   */
  server.registerTool(
    'track_time',
    {
      description: 'Log a time entry on a ClickUp task. Accepts start and end times in AM/PM (e.g., "8:00 AM", "2pm") or 24h format (e.g., "14:00"). Automatically detects custom IDs (e.g., ST-353).',
      inputSchema: z.object({
        task_id: z.string().describe('The task ID - can be a regular ClickUp task ID or a custom ID (e.g., ST-353)'),
        start_time: z.string().describe('Start time, e.g., "8:00 AM", "08:00", "8am", "14:30"'),
        end_time: z.string().describe('End time, e.g., "12:00 PM", "17:00", "5pm"'),
        date: z.string().optional().describe('Date in YYYY-MM-DD format (defaults to today)'),
        description: z.string().optional().describe('Description of the work performed'),
        billable: z.boolean().optional().describe('Whether the time entry is billable')
      })
    },
    async ({ task_id, start_time, end_time, date, description, billable }) => {
      try {
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

        // 2. Parse start and end times
        const startMinutes = parseTimeString(start_time);
        const endMinutes = parseTimeString(end_time);

        if (startMinutes === null) {
          return {
            content: [{
              type: 'text' as const,
              text: `Error: Could not parse start time "${start_time}". Supported formats: "8:00 AM", "08:00", "14:30", "2:30 PM", "8am".`
            }],
            isError: true
          };
        }

        if (endMinutes === null) {
          return {
            content: [{
              type: 'text' as const,
              text: `Error: Could not parse end time "${end_time}". Supported formats: "12:00 PM", "17:00", "5:00 PM", "5pm".`
            }],
            isError: true
          };
        }

        if (endMinutes <= startMinutes) {
          return {
            content: [{
              type: 'text' as const,
              text: `Error: End time (${end_time}) must be after start time (${start_time}).`
            }],
            isError: true
          };
        }

        // 3. Build Unix timestamps in milliseconds
        const startTimestamp = new Date(year, month, day, Math.floor(startMinutes / 60), startMinutes % 60).getTime();
        const endTimestamp = new Date(year, month, day, Math.floor(endMinutes / 60), endMinutes % 60).getTime();
        const durationMs = endTimestamp - startTimestamp;

        // 4. Resolve the task (handles both custom IDs and regular IDs)
        const task = await client.resolveTask(task_id);

        // 5. Get the team ID
        const teamId = await client.getTeamIdForTask(task);

        // 6. Create the time entry
        const response = await client.createTimeEntry(teamId, {
          tid: task.id,
          start: startTimestamp,
          end: endTimestamp,
          duration: durationMs,
          ...(description && { description }),
          ...(billable !== undefined && { billable })
        });

        // 7. Format duration for display
        const hours = Math.floor(durationMs / (1000 * 60 * 60));
        const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
        const durationDisplay = hours > 0
          ? `${hours}h${minutes > 0 ? ` ${minutes}m` : ''}`
          : `${minutes}m`;

        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              message: 'Time entry created successfully!',
              time_entry_id: response.data?.id,
              task_id: task.id,
              ...(task.custom_id && { custom_id: task.custom_id }),
              task_name: task.name,
              date: dateStr,
              start_time,
              end_time,
              duration: durationDisplay,
              duration_ms: durationMs,
              ...(description && { description }),
              ...(billable !== undefined && { billable }),
              task_url: task.url
            }, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: 'text' as const,
            text: `Error tracking time: ${formatErrorForMCP(error)}`
          }],
          isError: true
        };
      }
    }
  );
}
