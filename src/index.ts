#!/usr/bin/env node
/**
 * agent-browser MCP Server
 *
 * MCP server that provides browser automation capabilities using agent-browser.
 */

import { fileURLToPath } from 'node:url';
import { realpathSync } from 'node:fs';

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { BrowserManager } from './browser.js';
import { IOSManager } from './ios-manager.js';
import type {
  Command,
  LaunchCommand,
  NavigateCommand,
  ClickCommand,
  FillCommand,
  SnapshotCommand,
  ScreenshotCommand,
  TypeCommand,
  PressCommand,
  WaitCommand,
  GetTextCommand,
  SelectCommand,
  CheckCommand,
  UncheckCommand,
  HoverCommand,
  EvaluateCommand,
  CloseCommand,
  TabNewCommand,
  TabListCommand,
  TabSwitchCommand,
  TabCloseCommand,
  CookiesGetCommand,
  CookiesSetCommand,
  StorageGetCommand,
  StorageSetCommand,
  StorageClearCommand,
  PdfCommand,
  BackCommand,
  ForwardCommand,
  ReloadCommand,
  UrlCommand,
  TitleCommand,
  GetAttributeCommand,
  IsVisibleCommand,
  IsEnabledCommand,
  IsCheckedCommand,
  CountCommand,
  BoundingBoxCommand,
  ClearCommand,
  InputValueCommand,
  SetValueCommand,
  InnerTextCommand,
  InnerHtmlCommand,
  DoubleClickCommand,
  FocusCommand,
  UploadCommand,
  DragCommand,
  ScrollCommand,
  SelectAllCommand,
  TapCommand,
  WaitForUrlCommand,
  WaitForLoadStateCommand,
  WaitForFunctionCommand,
  ScrollIntoViewCommand,
  KeyDownCommand,
  KeyUpCommand,
  KeyboardCommand,
  MouseMoveCommand,
  MouseDownCommand,
  MouseUpCommand,
  WheelCommand,
  DeviceCommand,
  ViewportCommand,
  GeolocationCommand,
  OfflineCommand,
  EmulateMediaCommand,
  TimezoneCommand,
  LocaleCommand,
  HeadersCommand,
  HttpCredentialsCommand,
  GetByRoleCommand,
  GetByTextCommand,
  GetByLabelCommand,
  GetByPlaceholderCommand,
  GetByAltTextCommand,
  GetByTitleCommand,
  GetByTestIdCommand,
  NthCommand,
  DialogCommand,
  RouteCommand,
  UnrouteCommand,
  RequestsCommand,
  DownloadCommand,
  ConsoleCommand,
  ErrorsCommand,
  HighlightCommand,
  StylesCommand,
  TraceStartCommand,
  TraceStopCommand,
  AddScriptCommand,
  AddStyleCommand,
  AddInitScriptCommand,
  ExposeFunctionCommand,
  ScreencastStartCommand,
  ScreencastStopCommand,
  InputMouseCommand,
  InputKeyboardCommand,
  InputTouchCommand,
  SetContentCommand,
  ContentCommand,
  DispatchEventCommand,
  MultiSelectCommand,
  WaitForDownloadCommand,
  ResponseBodyCommand,
  RecordingStartCommand,
  RecordingStopCommand,
  RecordingRestartCommand,
  StorageStateSaveCommand,
  StorageStateLoadCommand,
  HarStartCommand,
  HarStopCommand,
  ClipboardCommand,
  MainFrameCommand,
  FrameCommand,
  WindowNewCommand,
  BringToFrontCommand,
  PauseCommand,
  EvaluateHandleCommand,
  SwipeCommand,
  DeviceListCommand,
} from './types.js';
import { executeCommand } from './actions.js';
import { executeIOSCommand } from './ios-actions.js';
import { MERGED_TOOLS } from './tools-merged.js';
import { mapMergedToolToCommand } from './tool-merger.js';

type Manager = BrowserManager | IOSManager;

// Global manager instance (desktop BrowserManager or iOS IOSManager)
let manager: Manager | null = null;

function isIOSProvider(provider?: string): boolean {
  return (provider ?? process.env.AGENT_BROWSER_PROVIDER) === 'ios';
}

/**
 * Get or create the manager instance
 */
async function getManager(provider?: string): Promise<Manager> {
  const shouldUseIOS = isIOSProvider(provider);
  if (!manager) {
    manager = shouldUseIOS ? new IOSManager() : new BrowserManager();
    return manager;
  }

  const isCurrentIOS = manager instanceof IOSManager;
  if (shouldUseIOS !== isCurrentIOS) {
    await manager.close().catch(() => {});
    manager = shouldUseIOS ? new IOSManager() : new BrowserManager();
  }
  return manager;
}

/**
 * Ensure browser is launched
 */
async function ensureBrowserLaunched(headless: boolean = true): Promise<void> {
  const m = await getManager();
  if (!m.isLaunched()) {
    if (m instanceof IOSManager) {
      await m.launch({});
    } else {
      await m.launch({
        id: 'mcp-launch',
        action: 'launch',
        headless,
        executablePath: process.env.AGENT_BROWSER_EXECUTABLE_PATH,
        provider: process.env.AGENT_BROWSER_PROVIDER,
      });
    }
  }
}

/**
 * Helper to execute a command and return the result
 */
async function execute(command: Command): Promise<{ content: Array<{ type: string; text: string }> }> {
  const launchProvider = command.action === 'launch' ? (command as LaunchCommand).provider : undefined;
  const m = await getManager(launchProvider);

  try {
    // Auto-launch browser if needed
    if (
      !m.isLaunched() &&
      command.action !== 'launch' &&
      command.action !== 'close' &&
      command.action !== 'device_list' &&
      command.action !== 'video_start' &&
      command.action !== 'video_stop'
    ) {
      await ensureBrowserLaunched();
    }

    const response =
      m instanceof IOSManager ? await executeIOSCommand(command, m) : await executeCommand(command, m);

    if (response.success) {
      // Handle special response types
      const data = response.data as any;

      // For snapshot, return the formatted snapshot
      if (command.action === 'snapshot') {
        return {
          content: [
            {
              type: 'text',
              text: typeof data === 'string' ? data : JSON.stringify(data, null, 2),
            },
          ],
        };
      }

      // For content/screenshot with base64
      if (command.action === 'screenshot' && data.base64) {
        return {
          content: [
            {
              type: 'text',
              text: `Screenshot captured (base64: ${data.base64.substring(0, 50)}...)${data.path ? ` saved to ${data.path}` : ''}`,
            },
            {
              type: 'text',
              text: `Full base64 data: ${data.base64}`,
            },
          ],
        };
      }

      // For content command
      if (command.action === 'content') {
        return {
          content: [
            {
              type: 'text',
              text: data.html || String(data),
            },
          ],
        };
      }

      // Default JSON response
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    } else {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${response.error}`,
          },
        ],
      };
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
    };
  }
}

/**
 * Helper to parse JSON argument
 */
function parseJsonArgument(arg: string | undefined, defaultValue: any = {}): any {
  if (!arg) return defaultValue;
  try {
    return JSON.parse(arg);
  } catch {
    return defaultValue;
  }
}

// Use merged tool definitions (114 -> ~40 tools)
const TOOLS: Tool[] = MERGED_TOOLS;
async function handleToolCall(name: string, args: any): Promise<any> {
  const generateId = () => Math.random().toString(36).substring(7);

  // Map merged tool call to original command
  const mappedCmd = mapMergedToolToCommand({ name, args });
  const command = { ...mappedCmd, id: generateId() } as Command;

  // Handle special cases for auto-launch
  if (
    name !== 'browser_launch' &&
    name !== 'browser_close' &&
    name !== 'browser_ios_device_list'
  ) {
    await ensureBrowserLaunched();
  }

  // Execute the mapped command
  return execute(command);
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  // Create MCP server
  const server = new Server(
    {
      name: 'agent-browser-mcp',
      version: '0.1.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Handle list tools request
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: TOOLS,
    };
  });

  // Handle tool call request
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      return await handleToolCall(name, args);
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  });

  // Cleanup on exit
  process.on('SIGINT', async () => {
    if (manager) {
      await manager.close();
    }
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    if (manager) {
      await manager.close();
    }
    process.exit(0);
  });

  // Start server
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Keep process alive
  process.stdin.resume();
}

// Run if this is the main module
// Use realpathSync to handle symlinks (e.g., when run via npx or bin entries)
const entryPath = realpathSync(fileURLToPath(import.meta.url));
const argvPath = realpathSync(process.argv[1]);

if (entryPath === argvPath) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { main };
