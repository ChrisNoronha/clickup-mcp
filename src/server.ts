/**
 * MCP Server setup and tool registration
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerNavigationTools } from './tools/navigation.js';
import { registerTaskTools } from './tools/tasks.js';

export function createServer(): McpServer {
  const server = new McpServer({
    name: 'clickup-mcp-server',
    version: '1.0.0',
  });

  // Register all navigation tools
  registerNavigationTools(server);

  // Register all task management tools
  registerTaskTools(server);

  // Log registered tools to stderr
  console.error('ClickUp MCP Server initialized with tools:');
  console.error('- Navigation: get_workspaces, get_spaces, get_folders, get_lists');
  console.error('- Tasks: create_task, get_task, smart_get_task, get_task_by_custom_id, get_tasks, update_task, update_task_by_custom_id, delete_task');
  console.error('- Members: get_task_members, get_list_members');

  return server;
}
