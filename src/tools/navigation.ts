/**
 * Navigation tools for exploring ClickUp workspace hierarchy
 */

import { z } from 'zod';
import { getClickUpClient } from '../utils/clickup-client.js';
import { formatErrorForMCP } from '../utils/error-handler.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export function registerNavigationTools(server: McpServer) {
  const client = getClickUpClient();

  /**
   * Get all workspaces (teams) accessible to the user
   */
  server.registerTool(
    'get_workspaces',
    {
      description: 'Get all ClickUp workspaces (teams) accessible to the authenticated user. This is the starting point for navigating the ClickUp hierarchy.',
      inputSchema: z.object({})
    },
    async () => {
      try {
        const workspaces = await client.getWorkspaces();

        const workspaceList = workspaces.map(w => ({
          id: w.id,
          name: w.name,
          color: w.color,
          memberCount: w.members?.length || 0
        }));

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(workspaceList, null, 2)
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `Error: ${formatErrorForMCP(error)}`
            }
          ],
          isError: true
        };
      }
    }
  );

  /**
   * Get spaces within a workspace
   */
  server.registerTool(
    'get_spaces',
    {
      description: 'Get all spaces within a ClickUp workspace. Spaces are the top-level organizational unit within a workspace.',
      inputSchema: z.object({
        workspace_id: z.string().describe('The ClickUp workspace (team) ID')
      })
    },
    async ({ workspace_id }) => {
      try {
        const spaces = await client.getSpaces(workspace_id);

        const spaceList = spaces.map(s => ({
          id: s.id,
          name: s.name,
          private: s.private,
          archived: s.archived
        }));

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(spaceList, null, 2)
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `Error: ${formatErrorForMCP(error)}`
            }
          ],
          isError: true
        };
      }
    }
  );

  /**
   * Get folders within a space
   */
  server.registerTool(
    'get_folders',
    {
      description: 'Get all folders within a ClickUp space. Folders help organize lists within a space.',
      inputSchema: z.object({
        space_id: z.string().describe('The ClickUp space ID')
      })
    },
    async ({ space_id }) => {
      try {
        const folders = await client.getFolders(space_id);

        const folderList = folders.map(f => ({
          id: f.id,
          name: f.name,
          hidden: f.hidden,
          taskCount: f.task_count,
          archived: f.archived
        }));

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(folderList, null, 2)
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `Error: ${formatErrorForMCP(error)}`
            }
          ],
          isError: true
        };
      }
    }
  );

  /**
   * Get lists from a space or folder
   */
  server.registerTool(
    'get_lists',
    {
      description: 'Get lists from a ClickUp space or folder. Lists contain tasks and are the main work containers. Provide either space_id or folder_id, not both.',
      inputSchema: z.object({
        space_id: z.string().optional().describe('The ClickUp space ID (if getting lists directly from a space)'),
        folder_id: z.string().optional().describe('The ClickUp folder ID (if getting lists from within a folder)')
      }).refine(
        data => data.space_id || data.folder_id,
        { message: 'Either space_id or folder_id must be provided' }
      )
    },
    async ({ space_id, folder_id }) => {
      try {
        const lists = await client.getLists({ spaceId: space_id, folderId: folder_id });

        const listData = lists.map(l => ({
          id: l.id,
          name: l.name,
          taskCount: l.task_count,
          folder: l.folder ? { id: l.folder.id, name: l.folder.name } : null,
          space: l.space ? { id: l.space.id, name: l.space.name } : null,
          archived: l.archived
        }));

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(listData, null, 2)
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `Error: ${formatErrorForMCP(error)}`
            }
          ],
          isError: true
        };
      }
    }
  );
}
