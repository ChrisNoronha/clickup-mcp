/**
 * ClickUp API Type Definitions
 * Based on ClickUp API v2 documentation
 */

export interface Workspace {
  id: string;
  name: string;
  color?: string;
  avatar?: string;
  members?: Member[];
}

export interface Space {
  id: string;
  name: string;
  private?: boolean;
  statuses?: Status[];
  multiple_assignees?: boolean;
  features?: {
    due_dates?: { enabled: boolean };
    time_tracking?: { enabled: boolean };
    tags?: { enabled: boolean };
    time_estimates?: { enabled: boolean };
    checklists?: { enabled: boolean };
    custom_fields?: { enabled: boolean };
    remap_dependencies?: { enabled: boolean };
    dependency_warning?: { enabled: boolean };
    portfolios?: { enabled: boolean };
  };
  archived?: boolean;
}

export interface Folder {
  id: string;
  name: string;
  orderindex?: number;
  override_statuses?: boolean;
  hidden?: boolean;
  space?: {
    id: string;
    name: string;
  };
  task_count?: string;
  archived?: boolean;
  statuses?: Status[];
  lists?: List[];
}

export interface List {
  id: string;
  name: string;
  orderindex?: number;
  content?: string;
  status?: Status;
  priority?: Priority;
  assignee?: User;
  task_count?: number;
  due_date?: string;
  start_date?: string;
  folder?: {
    id: string;
    name: string;
    hidden?: boolean;
    access?: boolean;
  };
  space?: {
    id: string;
    name: string;
    access?: boolean;
  };
  archived?: boolean;
  override_statuses?: boolean;
  statuses?: Status[];
  permission_level?: string;
}

export interface Task {
  id: string;
  custom_id?: string;
  name: string;
  text_content?: string;
  description?: string;
  status?: Status;
  orderindex?: string;
  date_created?: string;
  date_updated?: string;
  date_closed?: string;
  archived?: boolean;
  creator?: User;
  assignees?: User[];
  watchers?: User[];
  checklists?: Checklist[];
  tags?: string[];
  parent?: string | null;
  priority?: Priority;
  due_date?: string | null;
  start_date?: string | null;
  points?: number | null;
  time_estimate?: number | null;
  time_spent?: number;
  custom_fields?: CustomField[];
  dependencies?: string[];
  linked_tasks?: string[];
  team_id?: string;
  url?: string;
  permission_level?: string;
  list?: {
    id: string;
    name: string;
    access?: boolean;
  };
  project?: {
    id: string;
    name: string;
    hidden?: boolean;
    access?: boolean;
  };
  folder?: {
    id: string;
    name: string;
    hidden?: boolean;
    access?: boolean;
  };
  space?: {
    id: string;
  };
}

export interface Status {
  id?: string;
  status?: string;
  color?: string;
  orderindex?: number;
  type?: string;
}

export interface Priority {
  id?: string;
  priority?: string;
  color?: string;
  orderindex?: number;
}

export interface User {
  id: number;
  username?: string;
  email?: string;
  color?: string;
  profilePicture?: string;
  initials?: string;
  role?: number;
}

export interface Member {
  user: User;
  invited_by?: User;
}

export interface Checklist {
  id: string;
  task_id: string;
  name: string;
  orderindex: number;
  resolved?: number;
  unresolved?: number;
  items?: ChecklistItem[];
}

export interface ChecklistItem {
  id: string;
  name: string;
  orderindex: number;
  assignee?: User;
  resolved?: boolean;
  parent?: string | null;
  date_created?: string;
}

export interface CustomField {
  id: string;
  name: string;
  type: string;
  type_config?: Record<string, any>;
  date_created?: string;
  hide_from_guests?: boolean;
  value?: any;
  required?: boolean;
}

// API Request/Response Types

export interface CreateTaskParams {
  name: string;
  description?: string;
  markdown_description?: string;
  assignees?: number[];
  tags?: string[];
  status?: string;
  priority?: number;
  due_date?: number;
  due_date_time?: boolean;
  time_estimate?: number;
  start_date?: number;
  start_date_time?: boolean;
  notify_all?: boolean;
  parent?: string;
  links_to?: string;
  check_required_custom_fields?: boolean;
  custom_fields?: Array<{
    id: string;
    value: any;
  }>;
}

export interface UpdateTaskParams {
  name?: string;
  description?: string;
  markdown_description?: string;
  status?: string;
  priority?: number;
  due_date?: number | null;
  due_date_time?: boolean;
  parent?: string | null;
  time_estimate?: number | null;
  start_date?: number | null;
  start_date_time?: boolean;
  assignees?: {
    add?: number[];
    rem?: number[];
  };
  archived?: boolean;
}

export interface TaskFilters {
  archived?: boolean;
  page?: number;
  order_by?: 'created' | 'updated' | 'due_date';
  reverse?: boolean;
  subtasks?: boolean;
  statuses?: string[];
  include_closed?: boolean;
  assignees?: number[];
  tags?: string[];
  due_date_gt?: number;
  due_date_lt?: number;
  date_created_gt?: number;
  date_created_lt?: number;
  date_updated_gt?: number;
  date_updated_lt?: number;
}

export interface GetTaskOptions {
  custom_task_ids?: boolean;
  team_id?: string;
  include_subtasks?: boolean;
}

export interface TasksResponse {
  tasks: Task[];
  last_page?: boolean;
}

export interface WorkspacesResponse {
  teams: Workspace[];
}

export interface SpacesResponse {
  spaces: Space[];
}

export interface FoldersResponse {
  folders: Folder[];
}

export interface ListsResponse {
  lists: List[];
}

export interface MembersResponse {
  members: Member[];
}

export interface ClickUpError {
  err: string;
  ECODE: string;
}
