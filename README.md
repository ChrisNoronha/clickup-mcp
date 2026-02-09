# ClickUp MCP Server

A Model Context Protocol (MCP) server that enables Claude to interact with ClickUp for task management. Create, update, and manage ClickUp tasks through natural language prompts in Claude Desktop.

## Features

- **Navigate ClickUp Hierarchy**: Explore workspaces, spaces, folders, and lists
- **Task Management**: Create, read, update, and delete tasks
- **Advanced Filtering**: Filter tasks by status, assignee, tags, due dates, and more
- **Team Collaboration**: View task and list members
- **Rich Task Properties**: Support for descriptions, priorities, assignees, due dates, tags, and custom fields

## Available Tools

### Navigation Tools
- `get_workspaces` - List all accessible ClickUp workspaces
- `get_spaces` - Get spaces within a workspace
- `get_folders` - Get folders within a space
- `get_lists` - Get lists from a space or folder

### Task Management Tools
- `create_task` - Create a new task with various properties
- `get_task` - Get detailed information about a specific task
- `get_tasks` - List tasks with filtering and pagination
- `update_task` - Update task properties (name, status, assignees, etc.)
- `delete_task` - Delete a task permanently

### Member Tools
- `get_task_members` - Get members with access to a task
- `get_list_members` - Get members with access to a list

## Installation

### Prerequisites

- Node.js 18 or higher
- A ClickUp account with API access
- Claude Desktop app

### 1. Clone and Install

```bash
git clone <repository-url>
cd clickup-agent
npm install
```

### 2. Get Your ClickUp API Token

1. Log into your ClickUp account
2. Click your profile picture in the bottom-left corner
3. Select **Settings**
4. Click **Apps** in the left sidebar
5. Scroll down to the **API Token** section
6. Click **Generate** (or **Regenerate** if you already have a token)
7. Copy the token (it starts with `pk_`)

**Important**: Keep your API token secure. Never commit it to version control.

### 3. Configure Environment Variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit `.env` and add your ClickUp API token:

```env
CLICKUP_API_TOKEN=pk_your_actual_token_here
```

### 4. Build the Server

```bash
npm run build
```

This compiles the TypeScript code to JavaScript in the `dist/` directory.

## Configuration with Claude Desktop

### Windows

1. Open the Claude Desktop configuration file:
   ```
   %AppData%\Claude\claude_desktop_config.json
   ```

2. Add the ClickUp MCP server configuration:

```json
{
  "mcpServers": {
    "clickup": {
      "command": "node",
      "args": ["C:\\Users\\username\\Documents\\clickup-updater\\clickup-agent\\dist\\index.js"],
      "env": {
        "CLICKUP_API_TOKEN": "pk_your_actual_token_here"
      }
    }
  }
}
```

**Note**: Replace the path with your actual installation path. Use double backslashes (`\\`) in Windows paths.

### macOS/Linux

1. Open the Claude Desktop configuration file:
   ```
   ~/Library/Application Support/Claude/claude_desktop_config.json
   ```

2. Add the ClickUp MCP server configuration:

```json
{
  "mcpServers": {
    "clickup": {
      "command": "node",
      "args": ["/absolute/path/to/clickup-agent/dist/index.js"],
      "env": {
        "CLICKUP_API_TOKEN": "pk_your_actual_token_here"
      }
    }
  }
}
```

### 5. Restart Claude Desktop

After updating the configuration, restart Claude Desktop to load the MCP server.

## Usage Examples

Once configured, you can interact with ClickUp through natural language prompts in Claude:

### Navigation

```
"Show me all my ClickUp workspaces"

"List the spaces in workspace 12345"

"What lists are in the Marketing space?"
```

### Task Creation

```
"Create a task called 'Review Q1 metrics' in the Marketing Reports list"

"Create a high-priority task for the website redesign project with John and Sarah assigned"

"Add a task 'Update documentation' with a due date of next Friday"
```

### Task Management

```
"Show me all tasks in the Development list"

"Get details for task abc123"

"Update task xyz789 to mark it as complete"

"Change the priority of task abc123 to urgent"

"Find all tasks assigned to me that are overdue"
```

### Team Collaboration

```
"Who has access to task abc123?"

"Show me all members of the Development list"
```

## Development

### Project Structure

```
clickup-agent/
├── src/
│   ├── index.ts              # Entry point with STDIO transport
│   ├── server.ts             # MCP server setup and tool registration
│   ├── types/
│   │   └── clickup.ts        # ClickUp API type definitions
│   ├── utils/
│   │   ├── clickup-client.ts # ClickUp API wrapper
│   │   └── error-handler.ts  # Error handling utilities
│   └── tools/
│       ├── navigation.ts     # Navigation tools
│       └── tasks.ts          # Task management tools
├── dist/                     # Compiled JavaScript (generated)
├── .env                      # Environment variables (not committed)
├── .env.example              # Environment template
├── package.json              # Dependencies and scripts
├── tsconfig.json             # TypeScript configuration
└── README.md                 # This file
```

### Available Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm run watch` - Watch mode for development
- `npm run dev` - Build and run the server locally

### Adding New Tools

1. Add the tool implementation to the appropriate file in `src/tools/`
2. Register the tool in the tool file using `server.registerTool()`
3. Update type definitions in `src/types/clickup.ts` if needed
4. Add new API client methods to `src/utils/clickup-client.ts`
5. Rebuild with `npm run build`

## Troubleshooting

### Authentication Errors

If you see authentication errors:
- Verify your API token is correct and starts with `pk_`
- Check that the token is properly set in your `.env` file or Claude Desktop config
- Ensure the token hasn't been revoked in ClickUp Settings

### Connection Issues

If Claude Desktop can't connect to the server:
- Verify the path in `claude_desktop_config.json` is correct
- Ensure the server built successfully (`npm run build`)
- Check Claude Desktop logs for errors
- Restart Claude Desktop after configuration changes

### Rate Limiting

ClickUp API has rate limits. If you hit them:
- Wait a few moments before making more requests
- The server will provide clear error messages about rate limiting

## API Reference

For detailed information about ClickUp's API, see:
- [ClickUp API Documentation](https://clickup.com/api)
- [ClickUp API Authentication](https://clickup.com/api/developer-portal/authentication/)

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.
