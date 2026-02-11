/**
 * ClickUp API Client
 * Wrapper for ClickUp API v2
 */

import { handleApiError } from './error-handler.js';
import type {
  Workspace,
  Space,
  Folder,
  List,
  Task,
  Member,
  CreateTaskParams,
  UpdateTaskParams,
  TaskFilters,
  GetTaskOptions,
  TasksResponse,
  WorkspacesResponse,
  SpacesResponse,
  FoldersResponse,
  ListsResponse,
  MembersResponse,
  CreateTimeEntryParams,
  TimeEntryResponse
} from '../types/clickup.js';

export class ClickUpClient {
  private apiToken: string;
  private baseUrl: string = 'https://api.clickup.com/api/v2';

  constructor(apiToken?: string) {
    this.apiToken = apiToken || process.env.CLICKUP_API_TOKEN || '';

    if (!this.apiToken) {
      throw new Error(
        'ClickUp API token is required. Please set CLICKUP_API_TOKEN environment variable.'
      );
    }

    if (!this.apiToken.startsWith('pk_')) {
      console.error('Warning: ClickUp API token should start with "pk_". Please verify your token.');
    }
  }

  /**
   * Generic HTTP request method
   */
  private async request<T>(
    method: string,
    endpoint: string,
    data?: any,
    params?: Record<string, any>
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);

    // Add query parameters
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => url.searchParams.append(`${key}[]`, String(v)));
          } else {
            url.searchParams.append(key, String(value));
          }
        }
      });
    }

    const headers: Record<string, string> = {
      'Authorization': this.apiToken,
      'Content-Type': 'application/json',
    };

    const options: RequestInit = {
      method,
      headers,
    };

    if (data && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url.toString(), options);

      // Handle empty responses (e.g., DELETE)
      if (response.status === 204 || response.headers.get('content-length') === '0') {
        return {} as T;
      }

      const responseData = await response.json();

      if (!response.ok) {
        handleApiError({
          response: {
            status: response.status,
            data: responseData
          }
        });
      }

      return responseData as T;
    } catch (error: any) {
      if (error.name === 'ClickUpError') {
        throw error;
      }
      handleApiError(error);
    }
  }

  // ========== Workspace Methods ==========

  /**
   * Get all workspaces (teams) accessible to the user
   */
  async getWorkspaces(): Promise<Workspace[]> {
    const response = await this.request<WorkspacesResponse>('GET', '/team');
    return response.teams;
  }

  // ========== Space Methods ==========

  /**
   * Get all spaces in a workspace
   */
  async getSpaces(teamId: string): Promise<Space[]> {
    const response = await this.request<SpacesResponse>('GET', `/team/${teamId}/space`, undefined, {
      archived: false
    });
    return response.spaces;
  }

  /**
   * Get a specific space
   */
  async getSpace(spaceId: string): Promise<Space> {
    return this.request<Space>('GET', `/space/${spaceId}`);
  }

  // ========== Folder Methods ==========

  /**
   * Get all folders in a space
   */
  async getFolders(spaceId: string): Promise<Folder[]> {
    const response = await this.request<FoldersResponse>('GET', `/space/${spaceId}/folder`, undefined, {
      archived: false
    });
    return response.folders;
  }

  /**
   * Get a specific folder
   */
  async getFolder(folderId: string): Promise<Folder> {
    return this.request<Folder>('GET', `/folder/${folderId}`);
  }

  // ========== List Methods ==========

  /**
   * Get lists in a space or folder
   */
  async getLists(options: { spaceId?: string; folderId?: string }): Promise<List[]> {
    const { spaceId, folderId } = options;

    if (folderId) {
      const response = await this.request<ListsResponse>('GET', `/folder/${folderId}/list`, undefined, {
        archived: false
      });
      return response.lists;
    } else if (spaceId) {
      const response = await this.request<ListsResponse>('GET', `/space/${spaceId}/list`, undefined, {
        archived: false
      });
      return response.lists;
    } else {
      throw new Error('Either spaceId or folderId must be provided');
    }
  }

  /**
   * Get a specific list
   */
  async getList(listId: string): Promise<List> {
    return this.request<List>('GET', `/list/${listId}`);
  }

  // ========== Task Methods ==========

  /**
   * Create a new task in a list
   */
  async createTask(listId: string, taskData: CreateTaskParams): Promise<Task> {
    return this.request<Task>('POST', `/list/${listId}/task`, taskData);
  }

  /**
   * Get a specific task
   */
  async getTask(taskId: string, options?: GetTaskOptions): Promise<Task> {
    return this.request<Task>('GET', `/task/${taskId}`, undefined, options);
  }

  /**
   * Get a task by custom ID
   */
  async getTaskByCustomId(teamId: string, customTaskId: string, options?: Omit<GetTaskOptions, 'custom_task_ids'>): Promise<Task> {
    return this.request<Task>('GET', `/team/${teamId}/task/${customTaskId}`, undefined, {
      ...options,
      custom_task_ids: true
    });
  }

  /**
   * Get tasks from a list with optional filters
   */
  async getTasks(listId: string, filters?: TaskFilters): Promise<TasksResponse> {
    return this.request<TasksResponse>('GET', `/list/${listId}/task`, undefined, filters);
  }

  /**
   * Search for tasks by custom ID across a workspace
   */
  async searchTasksByCustomId(teamId: string, customIds: string[]): Promise<Task[]> {
    const tasks: Task[] = [];

    for (const customId of customIds) {
      try {
        const task = await this.getTaskByCustomId(teamId, customId);
        tasks.push(task);
      } catch (error: any) {
        // Skip tasks that are not found
        if (error.message?.includes('404') || error.message?.includes('not found')) {
          continue;
        }
        throw error;
      }
    }

    return tasks;
  }

  /**
   * Search for a task by custom ID across all accessible workspaces
   * This method searches through actual task lists and collects custom IDs
   * @param customId The custom ID to search for (e.g., "ST-353")
   * @returns The matching task found, or throws if not found
   */
  async findTaskByCustomId(customId: string): Promise<Task> {
    const normalizedSearchId = customId.toUpperCase();
    console.error(`\nSearching for custom ID: ${normalizedSearchId}`);

    // Get all workspaces
    const workspaces = await this.getWorkspaces();
    console.error(`Found ${workspaces.length} workspace(s) to search`);

    // First, try the direct API approach (faster if it works)
    for (const workspace of workspaces) {
      try {
        console.error(`Trying direct API lookup in workspace: ${workspace.name} (${workspace.id})`);
        const task = await this.getTaskByCustomId(workspace.id, customId);
        console.error(`✓ Found task via direct API: ${task.name}`);
        return task;
      } catch (error: any) {
        // Skip if not found, continue searching
        if (error.message?.includes('404') || error.message?.includes('not found')) {
          continue;
        }
        // For other errors, we'll fall back to list search
      }
    }

    // If direct API didn't work, search through task lists
    console.error(`Direct API search failed. Searching through task lists...`);

    for (const workspace of workspaces) {
      try {
        console.error(`\nSearching workspace: ${workspace.name} (${workspace.id})`);

        // Get all spaces in this workspace
        const spaces = await this.getSpaces(workspace.id);
        console.error(`  Found ${spaces.length} space(s)`);

        for (const space of spaces) {
          try {
            // Get folders in this space
            const folders = await this.getFolders(space.id);

            // Get lists directly in the space (folderless lists)
            const spaceLists = await this.getLists({ spaceId: space.id });

            // Combine lists from folders and space
            const allLists: List[] = [...spaceLists];
            for (const folder of folders) {
              if (folder.lists) {
                allLists.push(...folder.lists);
              } else {
                const folderLists = await this.getLists({ folderId: folder.id });
                allLists.push(...folderLists);
              }
            }

            console.error(`  Space "${space.name}": searching ${allLists.length} list(s)`);

            // Search through each list
            for (const list of allLists) {
              try {
                // Get tasks from this list (including their custom IDs)
                const response = await this.getTasks(list.id, {
                  include_closed: true,
                  subtasks: false
                });

                // Search through tasks for matching custom ID
                for (const task of response.tasks) {
                  if (task.custom_id) {
                    const normalizedTaskId = task.custom_id.toUpperCase();
                    if (normalizedTaskId === normalizedSearchId) {
                      console.error(`\n✓ Found matching task: ${task.name}`);
                      console.error(`  Custom ID: ${task.custom_id}`);
                      console.error(`  List: ${list.name}`);
                      console.error(`  Space: ${space.name}`);

                      // Get full task details
                      return await this.getTask(task.id);
                    }
                  }
                }
              } catch (listError: any) {
                // Skip lists that fail
                console.error(`    Warning: Could not search list "${list.name}": ${listError.message}`);
                continue;
              }
            }
          } catch (spaceError: any) {
            // Skip spaces that fail
            console.error(`  Warning: Could not search space "${space.name}": ${spaceError.message}`);
            continue;
          }
        }
      } catch (workspaceError: any) {
        // Skip workspaces that fail
        console.error(`Warning: Could not search workspace "${workspace.name}": ${workspaceError.message}`);
        continue;
      }
    }

    // If we get here, the task was not found anywhere
    throw new Error(`Task with custom ID "${customId}" not found in any accessible workspace, space, or list`);
  }

  /**
   * Detect if a string looks like a custom ID (e.g., "ST-353", "PROJ-123")
   * Custom IDs typically follow the pattern: LETTERS-NUMBERS
   */
  static isCustomId(id: string): boolean {
    // Pattern: one or more letters, followed by a dash/hyphen, followed by one or more digits
    const customIdPattern = /^[A-Z]+-\d+$/i;
    return customIdPattern.test(id);
  }

  /**
   * Update an existing task
   */
  async updateTask(taskId: string, updates: UpdateTaskParams): Promise<Task> {
    return this.request<Task>('PUT', `/task/${taskId}`, updates);
  }

  /**
   * Update a task by custom ID
   */
  async updateTaskByCustomId(teamId: string, customTaskId: string, updates: UpdateTaskParams): Promise<Task> {
    return this.request<Task>('PUT', `/team/${teamId}/task/${customTaskId}`, updates, {
      custom_task_ids: true
    });
  }

  /**
   * Delete a task
   */
  async deleteTask(taskId: string): Promise<void> {
    await this.request<void>('DELETE', `/task/${taskId}`);
  }

  // ========== Member Methods ==========

  /**
   * Get members who have access to a task
   */
  async getTaskMembers(taskId: string): Promise<Member[]> {
    const response = await this.request<MembersResponse>('GET', `/task/${taskId}/member`);
    return response.members;
  }

  /**
   * Get members who have access to a list
   */
  async getListMembers(listId: string): Promise<Member[]> {
    const response = await this.request<MembersResponse>('GET', `/list/${listId}/member`);
    return response.members;
  }

  // ========== Time Tracking Methods ==========

  /**
   * Create a time entry for a task
   */
  async createTimeEntry(teamId: string, params: CreateTimeEntryParams): Promise<TimeEntryResponse> {
    return this.request<TimeEntryResponse>('POST', `/team/${teamId}/time_entries`, params);
  }

  /**
   * Resolve a task identifier (custom ID or regular ID) to a full task object
   */
  async resolveTask(taskIdentifier: string): Promise<Task> {
    if (ClickUpClient.isCustomId(taskIdentifier)) {
      console.error(`Detected custom ID format: ${taskIdentifier}. Searching across workspaces...`);
      return this.findTaskByCustomId(taskIdentifier);
    } else {
      console.error(`Using regular task ID: ${taskIdentifier}`);
      return this.getTask(taskIdentifier);
    }
  }

  /**
   * Get the team/workspace ID for a given task.
   * Falls back to the first workspace if task doesn't include team_id.
   */
  async getTeamIdForTask(task: Task): Promise<string> {
    if (task.team_id) {
      return task.team_id;
    }
    console.error('Task does not have team_id. Falling back to first workspace.');
    const workspaces = await this.getWorkspaces();
    if (workspaces.length === 0) {
      throw new Error('No accessible workspaces found. Cannot determine team ID for time entry.');
    }
    return workspaces[0].id;
  }
}

// Export singleton instance
let clickUpClientInstance: ClickUpClient | null = null;

export function getClickUpClient(apiToken?: string): ClickUpClient {
  if (!clickUpClientInstance) {
    clickUpClientInstance = new ClickUpClient(apiToken);
  }
  return clickUpClientInstance;
}
