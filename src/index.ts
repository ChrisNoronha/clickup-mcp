#!/usr/bin/env node

/**
 * ClickUp MCP Server Entry Point
 *
 * This server provides MCP tools for interacting with ClickUp tasks and workspaces.
 * It uses STDIO transport for communication with Claude Desktop.
 */

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createServer } from './server.js';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

/**
 * Main function to start the MCP server
 */
async function main() {
  // Validate API token
  if (!process.env.CLICKUP_API_TOKEN) {
    console.error('Error: CLICKUP_API_TOKEN environment variable is not set.');
    console.error('Please create a .env file with your ClickUp API token:');
    console.error('CLICKUP_API_TOKEN=pk_your_token_here');
    console.error('');
    console.error('To get your API token:');
    console.error('1. Log into ClickUp');
    console.error('2. Go to Settings → Apps');
    console.error('3. Click "Generate" under API Token');
    console.error('4. Copy the token (starts with pk_)');
    process.exit(1);
  }

  // Create the MCP server instance
  const server = createServer();

  // Create STDIO transport
  const transport = new StdioServerTransport();

  // Connect the server to the transport
  await server.connect(transport);

  // Log to stderr that server is running (CRITICAL: never log to stdout in STDIO mode)
  console.error('ClickUp MCP Server is running on STDIO transport');
  console.error('Ready to receive requests from Claude Desktop');
}

// Start the server and handle errors
main().catch((error) => {
  console.error('Fatal error starting ClickUp MCP Server:', error);
  process.exit(1);
});
