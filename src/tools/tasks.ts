/**
 * Task management tools for creating, reading, updating, and deleting tasks
 */

import { z } from 'zod';
import { getClickUpClient } from '../utils/clickup-client.js';
import { formatErrorForMCP } from '../utils/error-handler.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

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
}
