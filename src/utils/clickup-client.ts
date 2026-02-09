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
  MembersResponse
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
   * Get tasks from a list with optional filters
   */
  async getTasks(listId: string, filters?: TaskFilters): Promise<TasksResponse> {
    return this.request<TasksResponse>('GET', `/list/${listId}/task`, undefined, filters);
  }

  /**
   * Update an existing task
   */
  async updateTask(taskId: string, updates: UpdateTaskParams): Promise<Task> {
    return this.request<Task>('PUT', `/task/${taskId}`, updates);
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
}

// Export singleton instance
let clickUpClientInstance: ClickUpClient | null = null;

export function getClickUpClient(apiToken?: string): ClickUpClient {
  if (!clickUpClientInstance) {
    clickUpClientInstance = new ClickUpClient(apiToken);
  }
  return clickUpClientInstance;
}
