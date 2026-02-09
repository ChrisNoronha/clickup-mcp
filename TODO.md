# ClickUp MCP Server - TODO List

## Current Functionality Overview

### ✅ Navigation Tools (Implemented)
- **get_workspaces**: Get all workspaces/teams accessible to the user
- **get_spaces**: Get all spaces within a workspace
- **get_folders**: Get all folders within a space
- **get_lists**: Get lists from a space or folder

### ✅ Task Management Tools (Implemented)
- **create_task**: Create a new task with name, description, assignees, tags, status, priority, dates, etc.
- **get_task**: Get detailed information about a specific task by ID
- **get_tasks**: Get tasks from a list with filtering (pagination, status, assignees, tags, due dates)
- **update_task**: Update task properties (name, description, status, priority, assignees, dates, archive)
- **delete_task**: Delete a task permanently

### ✅ Member Tools (Implemented)
- **get_task_members**: Get all members who have access to a task
- **get_list_members**: Get all members who have access to a list

---

## 🚀 Missing Features / Enhancements

### 🔴 HIGH PRIORITY

#### 1. Get Task by Custom ID
- [ ] **Implement**: `get_task_by_custom_id` tool
  - Description: Get a task using its custom ID instead of ClickUp task ID
  - Parameters: `custom_task_id` (string), `workspace_id` (string)
  - API Endpoint: `GET /team/{team_id}/task/{custom_task_id}`
  - **Testing Required**: Create task with custom ID, retrieve it, verify response

#### 2. Task Comments
- [ ] **Implement**: `create_comment` tool
  - Description: Add a comment to a task
  - Parameters: `task_id`, `comment_text`, `assignee` (optional), `notify_all` (optional)
  - API Endpoint: `POST /task/{task_id}/comment`
  - **Testing Required**: Create comment, verify it appears in ClickUp

- [ ] **Implement**: `get_comments` tool
  - Description: Get all comments from a task
  - Parameters: `task_id`
  - API Endpoint: `GET /task/{task_id}/comment`
  - **Testing Required**: Retrieve comments, verify order and content

- [ ] **Implement**: `update_comment` tool
  - Description: Update an existing comment
  - Parameters: `comment_id`, `comment_text`
  - API Endpoint: `PUT /comment/{comment_id}`
  - **Testing Required**: Update comment, verify changes

- [ ] **Implement**: `delete_comment` tool
  - Description: Delete a comment
  - Parameters: `comment_id`
  - API Endpoint: `DELETE /comment/{comment_id}`
  - **Testing Required**: Delete comment, verify removal

#### 3. Time Tracking
- [ ] **Implement**: `start_time_tracking` tool
  - Description: Start a timer for a task
  - Parameters: `task_id`, `assignee` (optional)
  - API Endpoint: `POST /team/{team_id}/time_entries/start`
  - **Testing Required**: Start timer, verify it's running

- [ ] **Implement**: `stop_time_tracking` tool
  - Description: Stop the currently running timer
  - Parameters: `team_id`
  - API Endpoint: `POST /team/{team_id}/time_entries/stop`
  - **Testing Required**: Stop timer, verify time entry created

- [ ] **Implement**: `get_time_entries` tool
  - Description: Get time entries for a task
  - Parameters: `task_id`, `start_date` (optional), `end_date` (optional)
  - API Endpoint: `GET /task/{task_id}/time`
  - **Testing Required**: Retrieve time entries, verify accuracy

- [ ] **Implement**: `create_time_entry` tool
  - Description: Manually create a time entry
  - Parameters: `task_id`, `duration` (ms), `description` (optional), `start` (timestamp), `assignee`
  - API Endpoint: `POST /team/{team_id}/time_entries`
  - **Testing Required**: Create manual entry, verify data

- [ ] **Implement**: `update_time_entry` tool
  - Description: Update an existing time entry
  - Parameters: `time_entry_id`, `duration`, `description`, `start`
  - API Endpoint: `PUT /team/{team_id}/time_entries/{time_entry_id}`
  - **Testing Required**: Update entry, verify changes

- [ ] **Implement**: `delete_time_entry` tool
  - Description: Delete a time entry
  - Parameters: `time_entry_id`
  - API Endpoint: `DELETE /team/{team_id}/time_entries/{time_entry_id}`
  - **Testing Required**: Delete entry, verify removal

#### 4. Checklists
- [ ] **Implement**: `create_checklist` tool
  - Description: Create a checklist on a task
  - Parameters: `task_id`, `name`
  - API Endpoint: `POST /task/{task_id}/checklist`
  - **Testing Required**: Create checklist, verify creation

- [ ] **Implement**: `edit_checklist` tool
  - Description: Rename a checklist
  - Parameters: `checklist_id`, `name`
  - API Endpoint: `PUT /checklist/{checklist_id}`
  - **Testing Required**: Update name, verify change

- [ ] **Implement**: `delete_checklist` tool
  - Description: Delete a checklist
  - Parameters: `checklist_id`
  - API Endpoint: `DELETE /checklist/{checklist_id}`
  - **Testing Required**: Delete checklist, verify removal

- [ ] **Implement**: `create_checklist_item` tool
  - Description: Add an item to a checklist
  - Parameters: `checklist_id`, `name`, `assignee` (optional)
  - API Endpoint: `POST /checklist/{checklist_id}/checklist_item`
  - **Testing Required**: Add item, verify it appears

- [ ] **Implement**: `edit_checklist_item` tool
  - Description: Update a checklist item
  - Parameters: `checklist_item_id`, `name`, `resolved` (boolean), `assignee`
  - API Endpoint: `PUT /checklist/{checklist_id}/checklist_item/{checklist_item_id}`
  - **Testing Required**: Update item, mark as resolved/unresolved

- [ ] **Implement**: `delete_checklist_item` tool
  - Description: Delete a checklist item
  - Parameters: `checklist_item_id`
  - API Endpoint: `DELETE /checklist/{checklist_id}/checklist_item/{checklist_item_id}`
  - **Testing Required**: Delete item, verify removal

### 🟡 MEDIUM PRIORITY

#### 5. Task Attachments
- [ ] **Implement**: `upload_attachment` tool
  - Description: Upload a file attachment to a task
  - Parameters: `task_id`, `file_path`
  - API Endpoint: `POST /task/{task_id}/attachment`
  - **Testing Required**: Upload file, verify attachment

- [ ] **Implement**: `get_attachments` tool
  - Description: Get all attachments from a task
  - Parameters: `task_id`
  - (Included in get_task response, may need separate endpoint)
  - **Testing Required**: List attachments, verify metadata

#### 6. Task Dependencies
- [ ] **Implement**: `add_dependency` tool
  - Description: Add a dependency between tasks
  - Parameters: `task_id`, `depends_on` (task_id), `dependency_type` (waiting_on, blocking)
  - API Endpoint: `POST /task/{task_id}/dependency`
  - **Testing Required**: Create dependency, verify link

- [ ] **Implement**: `delete_dependency` tool
  - Description: Remove a task dependency
  - Parameters: `task_id`, `depends_on` (task_id)
  - API Endpoint: `DELETE /task/{task_id}/dependency`
  - **Testing Required**: Remove dependency, verify removal

#### 7. Custom Fields
- [ ] **Implement**: `get_accessible_custom_fields` tool
  - Description: Get all custom fields available in a list
  - Parameters: `list_id`
  - API Endpoint: `GET /list/{list_id}/field`
  - **Testing Required**: Retrieve custom fields, verify types

- [ ] **Implement**: `set_custom_field_value` tool
  - Description: Set the value of a custom field on a task
  - Parameters: `task_id`, `field_id`, `value`
  - API Endpoint: `POST /task/{task_id}/field/{field_id}`
  - **Testing Required**: Set various field types (text, number, dropdown, date)

- [ ] **Implement**: `remove_custom_field_value` tool
  - Description: Clear a custom field value
  - Parameters: `task_id`, `field_id`
  - API Endpoint: `DELETE /task/{task_id}/field/{field_id}`
  - **Testing Required**: Clear value, verify removal

#### 8. Tags Management
- [ ] **Implement**: `get_space_tags` tool
  - Description: Get all tags from a space
  - Parameters: `space_id`
  - API Endpoint: `GET /space/{space_id}/tag`
  - **Testing Required**: Retrieve tags, verify list

- [ ] **Implement**: `add_tag_to_task` tool
  - Description: Add a tag to a task
  - Parameters: `task_id`, `tag_name`
  - API Endpoint: `POST /task/{task_id}/tag/{tag_name}`
  - **Testing Required**: Add tag, verify it appears

- [ ] **Implement**: `remove_tag_from_task` tool
  - Description: Remove a tag from a task
  - Parameters: `task_id`, `tag_name`
  - API Endpoint: `DELETE /task/{task_id}/tag/{tag_name}`
  - **Testing Required**: Remove tag, verify removal

#### 9. Task Search
- [ ] **Implement**: `search_tasks` tool
  - Description: Search for tasks across a workspace/space/folder/list
  - Parameters: `team_id`, `query`, `space_ids` (optional), `list_ids` (optional), `folder_ids` (optional)
  - API Endpoint: `GET /team/{team_id}/task` (with search query)
  - **Testing Required**: Search by name, description, custom fields

#### 10. Workspace/Space/Folder/List CRUD
- [ ] **Implement**: `create_space` tool
  - Description: Create a new space in a workspace
  - Parameters: `workspace_id`, `name`, `features` (optional)
  - API Endpoint: `POST /team/{team_id}/space`
  - **Testing Required**: Create space, verify settings

- [ ] **Implement**: `update_space` tool
  - Description: Update space settings
  - Parameters: `space_id`, `name`, `features`
  - API Endpoint: `PUT /space/{space_id}`
  - **Testing Required**: Update settings, verify changes

- [ ] **Implement**: `delete_space` tool
  - Description: Delete a space
  - Parameters: `space_id`
  - API Endpoint: `DELETE /space/{space_id}`
  - **Testing Required**: Delete space, verify removal

- [ ] **Implement**: `create_folder` tool
  - Description: Create a folder in a space
  - Parameters: `space_id`, `name`
  - API Endpoint: `POST /space/{space_id}/folder`
  - **Testing Required**: Create folder, verify creation

- [ ] **Implement**: `update_folder` tool
  - Description: Update folder name
  - Parameters: `folder_id`, `name`
  - API Endpoint: `PUT /folder/{folder_id}`
  - **Testing Required**: Update folder, verify changes

- [ ] **Implement**: `delete_folder` tool
  - Description: Delete a folder
  - Parameters: `folder_id`
  - API Endpoint: `DELETE /folder/{folder_id}`
  - **Testing Required**: Delete folder, verify removal

- [ ] **Implement**: `create_list` tool
  - Description: Create a list in a folder or space
  - Parameters: `space_id` OR `folder_id`, `name`, `content`, `due_date`, `priority`, `assignee`, `status`
  - API Endpoint: `POST /folder/{folder_id}/list` or `POST /space/{space_id}/list`
  - **Testing Required**: Create list in both folder and space

- [ ] **Implement**: `update_list` tool
  - Description: Update list properties
  - Parameters: `list_id`, `name`, `content`, `due_date`, `priority`, `assignee`
  - API Endpoint: `PUT /list/{list_id}`
  - **Testing Required**: Update properties, verify changes

- [ ] **Implement**: `delete_list` tool
  - Description: Delete a list
  - Parameters: `list_id`
  - API Endpoint: `DELETE /list/{list_id}`
  - **Testing Required**: Delete list, verify removal

### 🟢 LOW PRIORITY / NICE TO HAVE

#### 11. Views
- [ ] **Implement**: `get_views` tool
  - Description: Get all views from a space, folder, or list
  - Parameters: `space_id`, `folder_id`, `list_id`
  - API Endpoint: `GET /space/{space_id}/view`, `GET /folder/{folder_id}/view`, `GET /list/{list_id}/view`
  - **Testing Required**: Retrieve views, verify structure

- [ ] **Implement**: `get_view_tasks` tool
  - Description: Get tasks from a specific view
  - Parameters: `view_id`, `page` (optional)
  - API Endpoint: `GET /view/{view_id}/task`
  - **Testing Required**: Get tasks from view with filters

#### 12. Goals
- [ ] **Implement**: `get_goals` tool
  - Description: Get goals from a workspace
  - Parameters: `team_id`, `include_completed` (optional)
  - API Endpoint: `GET /team/{team_id}/goal`
  - **Testing Required**: Retrieve goals, verify targets

- [ ] **Implement**: `create_goal` tool
  - Description: Create a new goal
  - Parameters: `team_id`, `name`, `due_date`, `description`, `multiple_owners`, `owners`, `color`
  - API Endpoint: `POST /team/{team_id}/goal`
  - **Testing Required**: Create goal, verify creation

- [ ] **Implement**: `update_goal` tool
  - Description: Update a goal
  - Parameters: `goal_id`, updates
  - API Endpoint: `PUT /goal/{goal_id}`
  - **Testing Required**: Update goal, verify changes

- [ ] **Implement**: `delete_goal` tool
  - Description: Delete a goal
  - Parameters: `goal_id`
  - API Endpoint: `DELETE /goal/{goal_id}`
  - **Testing Required**: Delete goal, verify removal

#### 13. Webhooks
- [ ] **Implement**: `create_webhook` tool
  - Description: Create a webhook for events
  - Parameters: `team_id`, `endpoint`, `events`
  - API Endpoint: `POST /team/{team_id}/webhook`
  - **Testing Required**: Create webhook, trigger events, verify calls

- [ ] **Implement**: `get_webhooks` tool
  - Description: Get all webhooks for a workspace
  - Parameters: `team_id`
  - API Endpoint: `GET /team/{team_id}/webhook`
  - **Testing Required**: List webhooks

- [ ] **Implement**: `update_webhook` tool
  - Description: Update a webhook
  - Parameters: `webhook_id`, `endpoint`, `events`, `status`
  - API Endpoint: `PUT /webhook/{webhook_id}`
  - **Testing Required**: Update webhook, verify changes

- [ ] **Implement**: `delete_webhook` tool
  - Description: Delete a webhook
  - Parameters: `webhook_id`
  - API Endpoint: `DELETE /webhook/{webhook_id}`
  - **Testing Required**: Delete webhook, verify removal

#### 14. Guests & Sharing
- [ ] **Implement**: `invite_guest_to_task` tool
  - Description: Invite a guest to a task
  - Parameters: `task_id`, `email`, `permission_level`
  - API Endpoint: `POST /task/{task_id}/guest/{guest_id}`
  - **Testing Required**: Invite guest, verify access

- [ ] **Implement**: `remove_guest_from_task` tool
  - Description: Remove a guest from a task
  - Parameters: `task_id`, `guest_id`
  - API Endpoint: `DELETE /task/{task_id}/guest/{guest_id}`
  - **Testing Required**: Remove guest, verify removal

#### 15. Bulk Operations
- [ ] **Implement**: `bulk_update_tasks` tool
  - Description: Update multiple tasks at once
  - Parameters: `task_ids[]`, `updates` (status, priority, assignees, etc.)
  - Requires multiple API calls or custom implementation
  - **Testing Required**: Update 10+ tasks, verify all changes

- [ ] **Implement**: `bulk_delete_tasks` tool
  - Description: Delete multiple tasks at once
  - Parameters: `task_ids[]`
  - Requires multiple API calls
  - **Testing Required**: Delete multiple tasks, verify removal

#### 16. Templates
- [ ] **Implement**: `get_task_templates` tool
  - Description: Get all task templates from a workspace
  - Parameters: `team_id`, `page`
  - API Endpoint: `GET /team/{team_id}/taskTemplate`
  - **Testing Required**: Retrieve templates

- [ ] **Implement**: `create_task_from_template` tool
  - Description: Create a task using a template
  - Parameters: `list_id`, `template_id`
  - Requires GET template then POST task with template data
  - **Testing Required**: Create from template, verify fields

---

## 🧪 Testing Plan

### Testing Requirements for Each Feature

For **EVERY** request/feature implemented, the following tests must be performed:

#### 1. **Unit Tests**
- [ ] Test with valid parameters
- [ ] Test with invalid parameters (missing required fields)
- [ ] Test with edge cases (empty strings, null values, extremely long strings)
- [ ] Test error handling (network errors, API errors, invalid IDs)

#### 2. **Integration Tests**
- [ ] Test against actual ClickUp API with a test workspace
- [ ] Verify response matches expected schema
- [ ] Verify data persists in ClickUp UI
- [ ] Test with different permission levels (admin, member, guest)

#### 3. **End-to-End Tests**
- [ ] Create a test scenario that uses multiple tools in sequence
- [ ] Example: Create task → Add comment → Add checklist → Start timer → Stop timer → Archive task

#### 4. **Performance Tests**
- [ ] Test pagination with large datasets (100+ tasks)
- [ ] Test bulk operations performance
- [ ] Test rate limiting behavior

#### 5. **Documentation Tests**
- [ ] Verify all tool descriptions are clear
- [ ] Verify all parameter descriptions are accurate
- [ ] Test that examples in documentation work

### Test Workspace Setup
- [ ] Create a dedicated ClickUp test workspace
- [ ] Set up test space with folders and lists
- [ ] Create test users/members
- [ ] Configure custom fields for testing
- [ ] Set up test tags
- [ ] Create test task templates

### Automated Testing Setup
- [ ] Set up Jest or Vitest for testing
- [ ] Create mock ClickUp API responses
- [ ] Set up CI/CD pipeline for automated tests
- [ ] Add test coverage reporting
- [ ] Create integration test suite

---

## 📋 User Request Examples

Based on the implemented tools, users can make requests like:

### Navigation Requests
- "Show me all my ClickUp workspaces"
- "List all spaces in workspace [ID]"
- "Get all folders in [Space Name]"
- "Show me all lists in [Folder Name]"

### Task Creation Requests
- "Create a task called 'Fix login bug' in list [ID]"
- "Create a high priority task with description X in list Y"
- "Create a task and assign it to user [ID] with due date tomorrow"
- "Create a subtask under task [ID]"

### Task Retrieval Requests
- "Get task [ID] details"
- "Show me all tasks in list [ID]"
- "Get all tasks assigned to user [ID]"
- "Show me all urgent tasks"
- "Get tasks with tag 'bug'"
- "Show me tasks due before [date]"

### Task Update Requests
- "Update task [ID] status to 'In Progress'"
- "Change task [ID] priority to urgent"
- "Assign task [ID] to user [ID]"
- "Set due date for task [ID] to [date]"
- "Archive task [ID]"
- "Remove assignee [ID] from task [ID]"

### Task Deletion Requests
- "Delete task [ID]"

### Member Requests
- "Show me who has access to task [ID]"
- "List all members of list [ID]"

### Future Requests (After Implementation)
- "Get task with custom ID [CUSTOM-123]" ⬅️ **User specifically requested**
- "Add comment 'This is done' to task [ID]"
- "Start timer for task [ID]"
- "Stop my timer"
- "Create checklist 'Setup Tasks' on task [ID]"
- "Add checklist item 'Install dependencies'"
- "Mark checklist item as complete"
- "Add dependency: task [ID1] blocks task [ID2]"
- "Set custom field 'Sprint' to 'Sprint 5' on task [ID]"
- "Search for tasks containing 'authentication'"

---

## 🔧 Implementation Priority Order

1. **Phase 1 - Critical Features**
   - Get task by custom ID
   - Task comments (create, get, update, delete)
   - Basic testing infrastructure

2. **Phase 2 - High Value Features**
   - Time tracking (all operations)
   - Checklists (all operations)
   - Custom fields (get, set, remove)

3. **Phase 3 - Enhanced Functionality**
   - Task dependencies
   - Tags management
   - Task attachments
   - Search functionality

4. **Phase 4 - Workspace Management**
   - Create/update/delete spaces, folders, lists
   - Views
   - Goals

5. **Phase 5 - Advanced Features**
   - Webhooks
   - Bulk operations
   - Templates
   - Guests & sharing

---

## 📝 Notes

- All timestamps in ClickUp API are in Unix milliseconds
- Priority levels: 1=urgent, 2=high, 3=normal, 4=low
- Custom IDs must be enabled in workspace settings
- Some features require specific workspace plan levels
- Rate limiting: ClickUp API has rate limits (100 requests per minute for most plans)
- Authentication: All requests use API token (pk_xxxxxx)

---

## ✅ Completion Checklist

### For Each New Feature:
- [ ] Read ClickUp API documentation
- [ ] Define TypeScript types
- [ ] Implement in clickup-client.ts
- [ ] Create tool registration in appropriate tools file
- [ ] Add input schema validation with Zod
- [ ] Implement error handling
- [ ] Add to type definitions
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Test manually in ClickUp UI
- [ ] Update this TODO list
- [ ] Update README documentation
- [ ] Add usage examples

---

**Last Updated**: 2026-02-09
**Version**: 1.0.0
