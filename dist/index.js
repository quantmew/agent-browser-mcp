#!/usr/bin/env node
/**
 * agent-browser MCP Server
 *
 * MCP server that provides browser automation capabilities using agent-browser.
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, } from '@modelcontextprotocol/sdk/types.js';
import { BrowserManager } from './browser.js';
import { executeCommand } from './actions.js';
// Global browser manager instance
let browser = null;
/**
 * Get or create the browser manager instance
 */
function getBrowser() {
    if (!browser) {
        browser = new BrowserManager();
    }
    return browser;
}
/**
 * Ensure browser is launched
 */
async function ensureBrowserLaunched(headless = true) {
    const b = getBrowser();
    if (!b.isLaunched()) {
        await b.launch({
            id: 'mcp-launch',
            action: 'launch',
            headless,
            executablePath: process.env.AGENT_BROWSER_EXECUTABLE_PATH,
        });
    }
}
/**
 * Helper to execute a command and return the result
 */
async function execute(command) {
    const b = getBrowser();
    try {
        // Auto-launch browser if needed
        if (!b.isLaunched() &&
            command.action !== 'launch' &&
            command.action !== 'close' &&
            command.action !== 'video_start' &&
            command.action !== 'video_stop') {
            await ensureBrowserLaunched();
        }
        const response = await executeCommand(command, b);
        if (response.success) {
            // Handle special response types
            const data = response.data;
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
        }
        else {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Error: ${response.error}`,
                    },
                ],
            };
        }
    }
    catch (error) {
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
function parseJsonArgument(arg, defaultValue = {}) {
    if (!arg)
        return defaultValue;
    try {
        return JSON.parse(arg);
    }
    catch {
        return defaultValue;
    }
}
// Tool definitions
const TOOLS = [
    // === Navigation ===
    {
        name: 'browser_navigate',
        description: 'Navigate to a URL',
        inputSchema: {
            type: 'object',
            properties: {
                url: {
                    type: 'string',
                    description: 'The URL to navigate to',
                },
                waitUntil: {
                    type: 'string',
                    enum: ['load', 'domcontentloaded', 'networkidle'],
                    description: 'When to consider navigation succeeded',
                },
                headers: {
                    type: 'object',
                    description: 'HTTP headers to set for this origin',
                },
                headless: {
                    type: 'boolean',
                    description: 'Whether to run headless (auto-launches browser if needed)',
                },
            },
            required: ['url'],
        },
    },
    {
        name: 'browser_snapshot',
        description: 'Get the accessibility tree of the current page. Returns an interactive tree with element refs (@e1, @e2, etc.) for deterministic interaction.',
        inputSchema: {
            type: 'object',
            properties: {
                interactiveOnly: {
                    type: 'boolean',
                    description: 'Only show interactive elements (buttons, inputs, links)',
                },
                compact: {
                    type: 'boolean',
                    description: 'Remove empty structural elements',
                },
                depth: {
                    type: 'number',
                    description: 'Limit tree depth',
                },
                selector: {
                    type: 'string',
                    description: 'Scope to CSS selector',
                },
            },
        },
    },
    {
        name: 'browser_screenshot',
        description: 'Take a screenshot of the current page or element',
        inputSchema: {
            type: 'object',
            properties: {
                path: {
                    type: 'string',
                    description: 'File path to save screenshot (optional, returns base64 if not provided)',
                },
                fullPage: {
                    type: 'boolean',
                    description: 'Capture full page scrollable screenshot',
                },
                selector: {
                    type: 'string',
                    description: 'CSS selector for element screenshot',
                },
            },
        },
    },
    {
        name: 'browser_back',
        description: 'Go back in browser history',
        inputSchema: {
            type: 'object',
            properties: {},
        },
    },
    {
        name: 'browser_forward',
        description: 'Go forward in browser history',
        inputSchema: {
            type: 'object',
            properties: {},
        },
    },
    {
        name: 'browser_reload',
        description: 'Reload the current page',
        inputSchema: {
            type: 'object',
            properties: {},
        },
    },
    {
        name: 'browser_url',
        description: 'Get the current URL',
        inputSchema: {
            type: 'object',
            properties: {},
        },
    },
    {
        name: 'browser_title',
        description: 'Get the current page title',
        inputSchema: {
            type: 'object',
            properties: {},
        },
    },
    // === Element Interaction ===
    {
        name: 'browser_click',
        description: 'Click an element using CSS selector or ref (@e1, @e2, etc.)',
        inputSchema: {
            type: 'object',
            properties: {
                selector: {
                    type: 'string',
                    description: 'CSS selector or element ref (@e1, @e2, etc.)',
                },
                button: {
                    type: 'string',
                    enum: ['left', 'right', 'middle'],
                    description: 'Mouse button',
                },
                clickCount: {
                    type: 'number',
                    description: 'Number of clicks',
                },
            },
            required: ['selector'],
        },
    },
    {
        name: 'browser_dblclick',
        description: 'Double-click an element',
        inputSchema: {
            type: 'object',
            properties: {
                selector: {
                    type: 'string',
                    description: 'CSS selector or element ref',
                },
            },
            required: ['selector'],
        },
    },
    {
        name: 'browser_fill',
        description: 'Clear and fill an input field',
        inputSchema: {
            type: 'object',
            properties: {
                selector: {
                    type: 'string',
                    description: 'CSS selector or element ref',
                },
                value: {
                    type: 'string',
                    description: 'Value to fill',
                },
            },
            required: ['selector', 'value'],
        },
    },
    {
        name: 'browser_type',
        description: 'Type text into an element (does not clear first)',
        inputSchema: {
            type: 'object',
            properties: {
                selector: {
                    type: 'string',
                    description: 'CSS selector or element ref',
                },
                text: {
                    type: 'string',
                    description: 'Text to type',
                },
                delay: {
                    type: 'number',
                    description: 'Delay between keystrokes (ms)',
                },
            },
            required: ['selector', 'text'],
        },
    },
    {
        name: 'browser_press',
        description: 'Press a keyboard key (Enter, Tab, Escape, etc.)',
        inputSchema: {
            type: 'object',
            properties: {
                key: {
                    type: 'string',
                    description: 'Key to press (Enter, Tab, Escape, Backspace, ArrowDown, etc.)',
                },
                selector: {
                    type: 'string',
                    description: 'Optional element selector to focus first',
                },
            },
            required: ['key'],
        },
    },
    {
        name: 'browser_hover',
        description: 'Hover over an element',
        inputSchema: {
            type: 'object',
            properties: {
                selector: {
                    type: 'string',
                    description: 'CSS selector or element ref',
                },
            },
            required: ['selector'],
        },
    },
    {
        name: 'browser_focus',
        description: 'Focus an element',
        inputSchema: {
            type: 'object',
            properties: {
                selector: {
                    type: 'string',
                    description: 'CSS selector or element ref',
                },
            },
            required: ['selector'],
        },
    },
    {
        name: 'browser_select',
        description: 'Select option(s) from a dropdown',
        inputSchema: {
            type: 'object',
            properties: {
                selector: {
                    type: 'string',
                    description: 'CSS selector or element ref',
                },
                values: {
                    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
                    description: 'Value(s) to select',
                },
            },
            required: ['selector', 'values'],
        },
    },
    {
        name: 'browser_check',
        description: 'Check a checkbox',
        inputSchema: {
            type: 'object',
            properties: {
                selector: {
                    type: 'string',
                    description: 'CSS selector or element ref',
                },
            },
            required: ['selector'],
        },
    },
    {
        name: 'browser_uncheck',
        description: 'Uncheck a checkbox',
        inputSchema: {
            type: 'object',
            properties: {
                selector: {
                    type: 'string',
                    description: 'CSS selector or element ref',
                },
            },
            required: ['selector'],
        },
    },
    {
        name: 'browser_tap',
        description: 'Tap an element (touch)',
        inputSchema: {
            type: 'object',
            properties: {
                selector: {
                    type: 'string',
                    description: 'CSS selector or element ref',
                },
            },
            required: ['selector'],
        },
    },
    {
        name: 'browser_clear',
        description: 'Clear an input field',
        inputSchema: {
            type: 'object',
            properties: {
                selector: {
                    type: 'string',
                    description: 'CSS selector or element ref',
                },
            },
            required: ['selector'],
        },
    },
    {
        name: 'browser_scroll',
        description: 'Scroll the page or an element',
        inputSchema: {
            type: 'object',
            properties: {
                direction: {
                    type: 'string',
                    enum: ['up', 'down', 'left', 'right'],
                    description: 'Scroll direction',
                },
                amount: {
                    type: 'number',
                    description: 'Pixels to scroll',
                },
                selector: {
                    type: 'string',
                    description: 'Element selector to scroll (scrolls page if not provided)',
                },
                x: {
                    type: 'number',
                    description: 'X position to scroll to',
                },
                y: {
                    type: 'number',
                    description: 'Y position to scroll to',
                },
            },
        },
    },
    {
        name: 'browser_scroll_into_view',
        description: 'Scroll element into view',
        inputSchema: {
            type: 'object',
            properties: {
                selector: {
                    type: 'string',
                    description: 'CSS selector or element ref',
                },
            },
            required: ['selector'],
        },
    },
    {
        name: 'browser_drag',
        description: 'Drag and drop',
        inputSchema: {
            type: 'object',
            properties: {
                source: {
                    type: 'string',
                    description: 'Source element selector',
                },
                target: {
                    type: 'string',
                    description: 'Target element selector',
                },
            },
            required: ['source', 'target'],
        },
    },
    {
        name: 'browser_upload',
        description: 'Upload file(s)',
        inputSchema: {
            type: 'object',
            properties: {
                selector: {
                    type: 'string',
                    description: 'CSS selector or element ref',
                },
                files: {
                    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
                    description: 'File path(s)',
                },
            },
            required: ['selector', 'files'],
        },
    },
    // === Get Element Info ===
    {
        name: 'browser_get_text',
        description: 'Get text content of an element',
        inputSchema: {
            type: 'object',
            properties: {
                selector: {
                    type: 'string',
                    description: 'CSS selector or element ref',
                },
            },
            required: ['selector'],
        },
    },
    {
        name: 'browser_get_inner_text',
        description: 'Get inner text of an element (rendered text)',
        inputSchema: {
            type: 'object',
            properties: {
                selector: {
                    type: 'string',
                    description: 'CSS selector or element ref',
                },
            },
            required: ['selector'],
        },
    },
    {
        name: 'browser_get_inner_html',
        description: 'Get inner HTML of an element',
        inputSchema: {
            type: 'object',
            properties: {
                selector: {
                    type: 'string',
                    description: 'CSS selector or element ref',
                },
            },
            required: ['selector'],
        },
    },
    {
        name: 'browser_get_attribute',
        description: 'Get attribute value of an element',
        inputSchema: {
            type: 'object',
            properties: {
                selector: {
                    type: 'string',
                    description: 'CSS selector or element ref',
                },
                attribute: {
                    type: 'string',
                    description: 'Attribute name',
                },
            },
            required: ['selector', 'attribute'],
        },
    },
    {
        name: 'browser_get_value',
        description: 'Get input value',
        inputSchema: {
            type: 'object',
            properties: {
                selector: {
                    type: 'string',
                    description: 'CSS selector or element ref',
                },
            },
            required: ['selector'],
        },
    },
    {
        name: 'browser_is_visible',
        description: 'Check if element is visible',
        inputSchema: {
            type: 'object',
            properties: {
                selector: {
                    type: 'string',
                    description: 'CSS selector or element ref',
                },
            },
            required: ['selector'],
        },
    },
    {
        name: 'browser_is_enabled',
        description: 'Check if element is enabled',
        inputSchema: {
            type: 'object',
            properties: {
                selector: {
                    type: 'string',
                    description: 'CSS selector or element ref',
                },
            },
            required: ['selector'],
        },
    },
    {
        name: 'browser_is_checked',
        description: 'Check if checkbox is checked',
        inputSchema: {
            type: 'object',
            properties: {
                selector: {
                    type: 'string',
                    description: 'CSS selector or element ref',
                },
            },
            required: ['selector'],
        },
    },
    {
        name: 'browser_count',
        description: 'Count matching elements',
        inputSchema: {
            type: 'object',
            properties: {
                selector: {
                    type: 'string',
                    description: 'CSS selector',
                },
            },
            required: ['selector'],
        },
    },
    {
        name: 'browser_bounding_box',
        description: 'Get element bounding box',
        inputSchema: {
            type: 'object',
            properties: {
                selector: {
                    type: 'string',
                    description: 'CSS selector or element ref',
                },
            },
            required: ['selector'],
        },
    },
    {
        name: 'browser_highlight',
        description: 'Highlight an element (for debugging)',
        inputSchema: {
            type: 'object',
            properties: {
                selector: {
                    type: 'string',
                    description: 'CSS selector or element ref',
                },
            },
            required: ['selector'],
        },
    },
    {
        name: 'browser_styles',
        description: 'Get computed styles of element(s)',
        inputSchema: {
            type: 'object',
            properties: {
                selector: {
                    type: 'string',
                    description: 'CSS selector or element ref',
                },
            },
            required: ['selector'],
        },
    },
    // === Semantic Locators ===
    {
        name: 'browser_find_by_role',
        description: 'Find and interact with element by ARIA role',
        inputSchema: {
            type: 'object',
            properties: {
                role: {
                    type: 'string',
                    description: 'ARIA role (button, link, textbox, etc.)',
                },
                name: {
                    type: 'string',
                    description: 'Accessible name filter',
                },
                action: {
                    type: 'string',
                    enum: ['click', 'fill', 'check', 'hover'],
                    description: 'Action to perform',
                },
                value: {
                    type: 'string',
                    description: 'Value for fill action',
                },
            },
            required: ['role', 'action'],
        },
    },
    {
        name: 'browser_find_by_text',
        description: 'Find and interact with element by text content',
        inputSchema: {
            type: 'object',
            properties: {
                text: {
                    type: 'string',
                    description: 'Text to search for',
                },
                exact: {
                    type: 'boolean',
                    description: 'Exact text match',
                },
                action: {
                    type: 'string',
                    enum: ['click', 'hover'],
                    description: 'Action to perform',
                },
            },
            required: ['text', 'action'],
        },
    },
    {
        name: 'browser_find_by_label',
        description: 'Find and interact with element by label',
        inputSchema: {
            type: 'object',
            properties: {
                label: {
                    type: 'string',
                    description: 'Label text',
                },
                action: {
                    type: 'string',
                    enum: ['click', 'fill', 'check'],
                    description: 'Action to perform',
                },
                value: {
                    type: 'string',
                    description: 'Value for fill action',
                },
            },
            required: ['label', 'action'],
        },
    },
    {
        name: 'browser_find_by_placeholder',
        description: 'Find and interact with element by placeholder',
        inputSchema: {
            type: 'object',
            properties: {
                placeholder: {
                    type: 'string',
                    description: 'Placeholder text',
                },
                action: {
                    type: 'string',
                    enum: ['click', 'fill'],
                    description: 'Action to perform',
                },
                value: {
                    type: 'string',
                    description: 'Value for fill action',
                },
            },
            required: ['placeholder', 'action'],
        },
    },
    {
        name: 'browser_find_by_alt_text',
        description: 'Find and interact with element by alt text',
        inputSchema: {
            type: 'object',
            properties: {
                text: {
                    type: 'string',
                    description: 'Alt text',
                },
                exact: {
                    type: 'boolean',
                    description: 'Exact match',
                },
                action: {
                    type: 'string',
                    enum: ['click', 'hover'],
                    description: 'Action to perform',
                },
            },
            required: ['text', 'action'],
        },
    },
    {
        name: 'browser_find_by_title',
        description: 'Find and interact with element by title attribute',
        inputSchema: {
            type: 'object',
            properties: {
                text: {
                    type: 'string',
                    description: 'Title text',
                },
                exact: {
                    type: 'boolean',
                    description: 'Exact match',
                },
                action: {
                    type: 'string',
                    enum: ['click', 'hover'],
                    description: 'Action to perform',
                },
            },
            required: ['text', 'action'],
        },
    },
    {
        name: 'browser_find_by_test_id',
        description: 'Find and interact with element by data-testid',
        inputSchema: {
            type: 'object',
            properties: {
                testId: {
                    type: 'string',
                    description: 'Test ID value',
                },
                action: {
                    type: 'string',
                    enum: ['click', 'fill', 'check', 'hover'],
                    description: 'Action to perform',
                },
                value: {
                    type: 'string',
                    description: 'Value for fill action',
                },
            },
            required: ['testId', 'action'],
        },
    },
    {
        name: 'browser_find_nth',
        description: 'Find and interact with Nth matching element',
        inputSchema: {
            type: 'object',
            properties: {
                selector: {
                    type: 'string',
                    description: 'CSS selector',
                },
                index: {
                    type: 'number',
                    description: 'Element index (0-based, -1 for last)',
                },
                action: {
                    type: 'string',
                    enum: ['click', 'fill', 'check', 'hover', 'text'],
                    description: 'Action to perform',
                },
                value: {
                    type: 'string',
                    description: 'Value for fill action',
                },
            },
            required: ['selector', 'index', 'action'],
        },
    },
    // === Wait ===
    {
        name: 'browser_wait',
        description: 'Wait for element or time',
        inputSchema: {
            type: 'object',
            properties: {
                selector: {
                    type: 'string',
                    description: 'CSS selector to wait for (or wait for time if not provided)',
                },
                timeout: {
                    type: 'number',
                    description: 'Timeout in ms',
                },
                state: {
                    type: 'string',
                    enum: ['attached', 'detached', 'visible', 'hidden'],
                    description: 'Element state to wait for',
                },
            },
        },
    },
    {
        name: 'browser_wait_for_url',
        description: 'Wait for URL',
        inputSchema: {
            type: 'object',
            properties: {
                url: {
                    type: 'string',
                    description: 'URL pattern to wait for',
                },
                timeout: {
                    type: 'number',
                    description: 'Timeout in ms',
                },
            },
            required: ['url'],
        },
    },
    {
        name: 'browser_wait_for_load_state',
        description: 'Wait for load state',
        inputSchema: {
            type: 'object',
            properties: {
                state: {
                    type: 'string',
                    enum: ['load', 'domcontentloaded', 'networkidle'],
                    description: 'Load state to wait for',
                },
                timeout: {
                    type: 'number',
                    description: 'Timeout in ms',
                },
            },
            required: ['state'],
        },
    },
    {
        name: 'browser_wait_for_function',
        description: 'Wait for JavaScript function to return truthy',
        inputSchema: {
            type: 'object',
            properties: {
                expression: {
                    type: 'string',
                    description: 'JavaScript expression',
                },
                timeout: {
                    type: 'number',
                    description: 'Timeout in ms',
                },
            },
            required: ['expression'],
        },
    },
    // === JavaScript Execution ===
    {
        name: 'browser_evaluate',
        description: 'Execute JavaScript in the page',
        inputSchema: {
            type: 'object',
            properties: {
                script: {
                    type: 'string',
                    description: 'JavaScript code to execute',
                },
                args: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Arguments for the script',
                },
            },
            required: ['script'],
        },
    },
    // === Content ===
    {
        name: 'browser_get_content',
        description: 'Get page HTML content',
        inputSchema: {
            type: 'object',
            properties: {
                selector: {
                    type: 'string',
                    description: 'Optional selector to get content of specific element',
                },
            },
        },
    },
    {
        name: 'browser_set_content',
        description: 'Set page HTML content',
        inputSchema: {
            type: 'object',
            properties: {
                html: {
                    type: 'string',
                    description: 'HTML content to set',
                },
            },
            required: ['html'],
        },
    },
    // === PDF ===
    {
        name: 'browser_pdf',
        description: 'Save page as PDF',
        inputSchema: {
            type: 'object',
            properties: {
                path: {
                    type: 'string',
                    description: 'File path to save PDF',
                },
                format: {
                    type: 'string',
                    enum: ['Letter', 'Legal', 'Tabloid', 'Ledger', 'A0', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6'],
                    description: 'Paper format',
                },
            },
            required: ['path'],
        },
    },
    // === Tabs & Windows ===
    {
        name: 'browser_tab_list',
        description: 'List all tabs',
        inputSchema: {
            type: 'object',
            properties: {},
        },
    },
    {
        name: 'browser_tab_new',
        description: 'Open new tab',
        inputSchema: {
            type: 'object',
            properties: {
                url: {
                    type: 'string',
                    description: 'Optional URL to navigate to',
                },
            },
        },
    },
    {
        name: 'browser_tab_switch',
        description: 'Switch to tab by index',
        inputSchema: {
            type: 'object',
            properties: {
                index: {
                    type: 'number',
                    description: 'Tab index (0-based)',
                },
            },
            required: ['index'],
        },
    },
    {
        name: 'browser_tab_close',
        description: 'Close tab',
        inputSchema: {
            type: 'object',
            properties: {
                index: {
                    type: 'number',
                    description: 'Tab index (0-based, defaults to current)',
                },
            },
        },
    },
    {
        name: 'browser_window_new',
        description: 'Open new window',
        inputSchema: {
            type: 'object',
            properties: {
                viewport: {
                    type: 'object',
                    properties: {
                        width: { type: 'number' },
                        height: { type: 'number' },
                    },
                    description: 'Viewport size',
                },
            },
        },
    },
    // === Frames ===
    {
        name: 'browser_frame',
        description: 'Switch to iframe',
        inputSchema: {
            type: 'object',
            properties: {
                selector: {
                    type: 'string',
                    description: 'CSS selector for iframe',
                },
                name: {
                    type: 'string',
                    description: 'Frame name',
                },
                url: {
                    type: 'string',
                    description: 'Frame URL',
                },
            },
        },
    },
    {
        name: 'browser_main_frame',
        description: 'Switch back to main frame',
        inputSchema: {
            type: 'object',
            properties: {},
        },
    },
    // === Cookies & Storage ===
    {
        name: 'browser_cookies_get',
        description: 'Get all cookies',
        inputSchema: {
            type: 'object',
            properties: {
                urls: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Optional URLs to filter cookies',
                },
            },
        },
    },
    {
        name: 'browser_cookies_set',
        description: 'Set cookies',
        inputSchema: {
            type: 'object',
            properties: {
                cookies: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            name: { type: 'string' },
                            value: { type: 'string' },
                            url: { type: 'string' },
                            domain: { type: 'string' },
                            path: { type: 'string' },
                            expires: { type: 'number' },
                            httpOnly: { type: 'boolean' },
                            secure: { type: 'boolean' },
                            sameSite: { type: 'string', enum: ['Strict', 'Lax', 'None'] },
                        },
                        required: ['name', 'value'],
                    },
                    description: 'Cookies to set',
                },
            },
            required: ['cookies'],
        },
    },
    {
        name: 'browser_storage_get',
        description: 'Get localStorage or sessionStorage',
        inputSchema: {
            type: 'object',
            properties: {
                type: {
                    type: 'string',
                    enum: ['local', 'session'],
                    description: 'Storage type',
                },
                key: {
                    type: 'string',
                    description: 'Optional key to get specific value',
                },
            },
            required: ['type'],
        },
    },
    {
        name: 'browser_storage_set',
        description: 'Set localStorage or sessionStorage value',
        inputSchema: {
            type: 'object',
            properties: {
                type: {
                    type: 'string',
                    enum: ['local', 'session'],
                    description: 'Storage type',
                },
                key: {
                    type: 'string',
                    description: 'Storage key',
                },
                value: {
                    type: 'string',
                    description: 'Storage value',
                },
            },
            required: ['type', 'key', 'value'],
        },
    },
    {
        name: 'browser_storage_clear',
        description: 'Clear localStorage or sessionStorage',
        inputSchema: {
            type: 'object',
            properties: {
                type: {
                    type: 'string',
                    enum: ['local', 'session'],
                    description: 'Storage type',
                },
            },
            required: ['type'],
        },
    },
    // === Browser Settings ===
    {
        name: 'browser_set_viewport',
        description: 'Set viewport size',
        inputSchema: {
            type: 'object',
            properties: {
                width: {
                    type: 'number',
                    description: 'Viewport width',
                },
                height: {
                    type: 'number',
                    description: 'Viewport height',
                },
            },
            required: ['width', 'height'],
        },
    },
    {
        name: 'browser_set_device',
        description: 'Emulate a device',
        inputSchema: {
            type: 'object',
            properties: {
                device: {
                    type: 'string',
                    description: 'Device name (e.g., "iPhone 14", "Pixel 5")',
                },
            },
            required: ['device'],
        },
    },
    {
        name: 'browser_set_geolocation',
        description: 'Set geolocation',
        inputSchema: {
            type: 'object',
            properties: {
                latitude: {
                    type: 'number',
                    description: 'Latitude',
                },
                longitude: {
                    type: 'number',
                    description: 'Longitude',
                },
                accuracy: {
                    type: 'number',
                    description: 'Accuracy in meters',
                },
            },
            required: ['latitude', 'longitude'],
        },
    },
    {
        name: 'browser_set_offline',
        description: 'Set offline mode',
        inputSchema: {
            type: 'object',
            properties: {
                offline: {
                    type: 'boolean',
                    description: 'Offline mode',
                },
            },
            required: ['offline'],
        },
    },
    {
        name: 'browser_emulate_media',
        description: 'Emulate media features',
        inputSchema: {
            type: 'object',
            properties: {
                media: {
                    type: 'string',
                    enum: ['screen', 'print', 'null'],
                    description: 'Media type',
                },
                colorScheme: {
                    type: 'string',
                    enum: ['light', 'dark', 'no-preference', 'null'],
                    description: 'Color scheme',
                },
                reducedMotion: {
                    type: 'string',
                    enum: ['reduce', 'no-preference', 'null'],
                    description: 'Reduced motion',
                },
            },
        },
    },
    {
        name: 'browser_set_timezone',
        description: 'Set timezone',
        inputSchema: {
            type: 'object',
            properties: {
                timezone: {
                    type: 'string',
                    description: 'Timezone ID (e.g., "America/New_York")',
                },
            },
            required: ['timezone'],
        },
    },
    {
        name: 'browser_set_locale',
        description: 'Set locale',
        inputSchema: {
            type: 'object',
            properties: {
                locale: {
                    type: 'string',
                    description: 'Locale (e.g., "en-US", "ja-JP")',
                },
            },
            required: ['locale'],
        },
    },
    {
        name: 'browser_set_headers',
        description: 'Set extra HTTP headers',
        inputSchema: {
            type: 'object',
            properties: {
                headers: {
                    type: 'object',
                    description: 'Headers object',
                },
            },
            required: ['headers'],
        },
    },
    {
        name: 'browser_set_credentials',
        description: 'Set HTTP basic auth credentials',
        inputSchema: {
            type: 'object',
            properties: {
                username: {
                    type: 'string',
                    description: 'Username',
                },
                password: {
                    type: 'string',
                    description: 'Password',
                },
            },
            required: ['username', 'password'],
        },
    },
    // === Network ===
    {
        name: 'browser_network_route',
        description: 'Intercept and mock network requests',
        inputSchema: {
            type: 'object',
            properties: {
                url: {
                    type: 'string',
                    description: 'URL pattern to match',
                },
                response: {
                    type: 'object',
                    properties: {
                        status: { type: 'number' },
                        body: { type: 'string' },
                        contentType: { type: 'string' },
                        headers: { type: 'object' },
                    },
                    description: 'Mock response',
                },
                abort: {
                    type: 'boolean',
                    description: 'Abort the request',
                },
            },
            required: ['url'],
        },
    },
    {
        name: 'browser_network_unroute',
        description: 'Remove network routes',
        inputSchema: {
            type: 'object',
            properties: {
                url: {
                    type: 'string',
                    description: 'URL pattern (removes all if not provided)',
                },
            },
        },
    },
    {
        name: 'browser_network_requests',
        description: 'Get tracked network requests',
        inputSchema: {
            type: 'object',
            properties: {
                filter: {
                    type: 'string',
                    description: 'URL filter pattern',
                },
                clear: {
                    type: 'boolean',
                    description: 'Clear tracked requests',
                },
            },
        },
    },
    {
        name: 'browser_wait_for_download',
        description: 'Wait for download to complete',
        inputSchema: {
            type: 'object',
            properties: {
                path: {
                    type: 'string',
                    description: 'Save path for download',
                },
                timeout: {
                    type: 'number',
                    description: 'Timeout in ms',
                },
            },
        },
    },
    {
        name: 'browser_download',
        description: 'Trigger and wait for download',
        inputSchema: {
            type: 'object',
            properties: {
                selector: {
                    type: 'string',
                    description: 'Element selector that triggers download',
                },
                path: {
                    type: 'string',
                    description: 'Save path',
                },
            },
            required: ['selector', 'path'],
        },
    },
    {
        name: 'browser_response_body',
        description: 'Get response body for intercepted request',
        inputSchema: {
            type: 'object',
            properties: {
                url: {
                    type: 'string',
                    description: 'Request URL',
                },
                timeout: {
                    type: 'number',
                    description: 'Timeout in ms',
                },
            },
            required: ['url'],
        },
    },
    // === Dialogs ===
    {
        name: 'browser_dialog_accept',
        description: 'Accept dialog (alert, confirm, prompt)',
        inputSchema: {
            type: 'object',
            properties: {
                promptText: {
                    type: 'string',
                    description: 'Text to enter for prompt dialog',
                },
            },
        },
    },
    {
        name: 'browser_dialog_dismiss',
        description: 'Dismiss dialog',
        inputSchema: {
            type: 'object',
            properties: {},
        },
    },
    // === Debug ===
    {
        name: 'browser_console',
        description: 'Get console messages',
        inputSchema: {
            type: 'object',
            properties: {
                clear: {
                    type: 'boolean',
                    description: 'Clear console messages',
                },
            },
        },
    },
    {
        name: 'browser_errors',
        description: 'Get page errors',
        inputSchema: {
            type: 'object',
            properties: {
                clear: {
                    type: 'boolean',
                    description: 'Clear errors',
                },
            },
        },
    },
    {
        name: 'browser_trace_start',
        description: 'Start Playwright trace',
        inputSchema: {
            type: 'object',
            properties: {
                screenshots: {
                    type: 'boolean',
                    description: 'Capture screenshots',
                },
                snapshots: {
                    type: 'boolean',
                    description: 'Capture snapshots',
                },
            },
        },
    },
    {
        name: 'browser_trace_stop',
        description: 'Stop and save Playwright trace',
        inputSchema: {
            type: 'object',
            properties: {
                path: {
                    type: 'string',
                    description: 'Trace file path',
                },
            },
            required: ['path'],
        },
    },
    // === Advanced Input ===
    {
        name: 'browser_keyboard',
        description: 'Press keyboard shortcut (e.g., "Control+a", "Shift+Tab")',
        inputSchema: {
            type: 'object',
            properties: {
                keys: {
                    type: 'string',
                    description: 'Keyboard shortcut',
                },
            },
            required: ['keys'],
        },
    },
    {
        name: 'browser_key_down',
        description: 'Hold key down',
        inputSchema: {
            type: 'object',
            properties: {
                key: {
                    type: 'string',
                    description: 'Key to hold',
                },
            },
            required: ['key'],
        },
    },
    {
        name: 'browser_key_up',
        description: 'Release key',
        inputSchema: {
            type: 'object',
            properties: {
                key: {
                    type: 'string',
                    description: 'Key to release',
                },
            },
            required: ['key'],
        },
    },
    {
        name: 'browser_mouse_move',
        description: 'Move mouse',
        inputSchema: {
            type: 'object',
            properties: {
                x: {
                    type: 'number',
                    description: 'X coordinate',
                },
                y: {
                    type: 'number',
                    description: 'Y coordinate',
                },
            },
            required: ['x', 'y'],
        },
    },
    {
        name: 'browser_mouse_down',
        description: 'Press mouse button',
        inputSchema: {
            type: 'object',
            properties: {
                button: {
                    type: 'string',
                    enum: ['left', 'right', 'middle'],
                    description: 'Mouse button',
                },
            },
        },
    },
    {
        name: 'browser_mouse_up',
        description: 'Release mouse button',
        inputSchema: {
            type: 'object',
            properties: {
                button: {
                    type: 'string',
                    enum: ['left', 'right', 'middle'],
                    description: 'Mouse button',
                },
            },
        },
    },
    {
        name: 'browser_wheel',
        description: 'Mouse wheel scroll',
        inputSchema: {
            type: 'object',
            properties: {
                deltaX: {
                    type: 'number',
                    description: 'Horizontal delta',
                },
                deltaY: {
                    type: 'number',
                    description: 'Vertical delta',
                },
                selector: {
                    type: 'string',
                    description: 'Optional element selector',
                },
            },
        },
    },
    // === Misc ===
    {
        name: 'browser_select_all',
        description: 'Select all text in input',
        inputSchema: {
            type: 'object',
            properties: {
                selector: {
                    type: 'string',
                    description: 'CSS selector or element ref',
                },
            },
            required: ['selector'],
        },
    },
    {
        name: 'browser_set_value',
        description: 'Set input value directly (without events)',
        inputSchema: {
            type: 'object',
            properties: {
                selector: {
                    type: 'string',
                    description: 'CSS selector or element ref',
                },
                value: {
                    type: 'string',
                    description: 'Value to set',
                },
            },
            required: ['selector', 'value'],
        },
    },
    {
        name: 'browser_multiselect',
        description: 'Select multiple options from dropdown',
        inputSchema: {
            type: 'object',
            properties: {
                selector: {
                    type: 'string',
                    description: 'CSS selector or element ref',
                },
                values: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Values to select',
                },
            },
            required: ['selector', 'values'],
        },
    },
    {
        name: 'browser_dispatch_event',
        description: 'Dispatch DOM event',
        inputSchema: {
            type: 'object',
            properties: {
                selector: {
                    type: 'string',
                    description: 'CSS selector or element ref',
                },
                event: {
                    type: 'string',
                    description: 'Event name',
                },
                eventInit: {
                    type: 'object',
                    description: 'Event init properties',
                },
            },
            required: ['selector', 'event'],
        },
    },
    {
        name: 'browser_add_script',
        description: 'Add script tag to page',
        inputSchema: {
            type: 'object',
            properties: {
                content: {
                    type: 'string',
                    description: 'Script content',
                },
                url: {
                    type: 'string',
                    description: 'Script URL',
                },
            },
        },
    },
    {
        name: 'browser_add_style',
        description: 'Add style tag to page',
        inputSchema: {
            type: 'object',
            properties: {
                content: {
                    type: 'string',
                    description: 'CSS content',
                },
                url: {
                    type: 'string',
                    description: 'CSS URL',
                },
            },
        },
    },
    {
        name: 'browser_add_init_script',
        description: 'Add init script (runs on every navigation)',
        inputSchema: {
            type: 'object',
            properties: {
                script: {
                    type: 'string',
                    description: 'Script content',
                },
            },
            required: ['script'],
        },
    },
    {
        name: 'browser_bring_to_front',
        description: 'Bring page to front',
        inputSchema: {
            type: 'object',
            properties: {},
        },
    },
    // === Streaming & Recording ===
    {
        name: 'browser_screencast_start',
        description: 'Start screencast for streaming',
        inputSchema: {
            type: 'object',
            properties: {
                format: {
                    type: 'string',
                    enum: ['jpeg', 'png'],
                    description: 'Image format',
                },
                quality: {
                    type: 'number',
                    description: 'JPEG quality (0-100)',
                },
                maxWidth: {
                    type: 'number',
                    description: 'Max width',
                },
                maxHeight: {
                    type: 'number',
                    description: 'Max height',
                },
            },
        },
    },
    {
        name: 'browser_screencast_stop',
        description: 'Stop screencast',
        inputSchema: {
            type: 'object',
            properties: {},
        },
    },
    {
        name: 'browser_recording_start',
        description: 'Start screen recording to video',
        inputSchema: {
            type: 'object',
            properties: {
                path: {
                    type: 'string',
                    description: 'Video file path',
                },
                url: {
                    type: 'string',
                    description: 'Optional URL to navigate to',
                },
            },
            required: ['path'],
        },
    },
    {
        name: 'browser_recording_stop',
        description: 'Stop screen recording',
        inputSchema: {
            type: 'object',
            properties: {},
        },
    },
    {
        name: 'browser_recording_restart',
        description: 'Restart screen recording',
        inputSchema: {
            type: 'object',
            properties: {
                path: {
                    type: 'string',
                    description: 'Video file path',
                },
                url: {
                    type: 'string',
                    description: 'Optional URL to navigate to',
                },
            },
            required: ['path'],
        },
    },
    // === State & HAR ===
    {
        name: 'browser_state_save',
        description: 'Save storage state (for auth persistence)',
        inputSchema: {
            type: 'object',
            properties: {
                path: {
                    type: 'string',
                    description: 'State file path',
                },
            },
            required: ['path'],
        },
    },
    {
        name: 'browser_state_load',
        description: 'Load storage state',
        inputSchema: {
            type: 'object',
            properties: {
                path: {
                    type: 'string',
                    description: 'State file path',
                },
            },
            required: ['path'],
        },
    },
    {
        name: 'browser_har_start',
        description: 'Start HAR recording',
        inputSchema: {
            type: 'object',
            properties: {},
        },
    },
    {
        name: 'browser_har_stop',
        description: 'Stop HAR recording',
        inputSchema: {
            type: 'object',
            properties: {
                path: {
                    type: 'string',
                    description: 'HAR file path',
                },
            },
            required: ['path'],
        },
    },
    // === Clipboard ===
    {
        name: 'browser_clipboard',
        description: 'Clipboard operations',
        inputSchema: {
            type: 'object',
            properties: {
                operation: {
                    type: 'string',
                    enum: ['copy', 'paste', 'read'],
                    description: 'Operation to perform',
                },
                text: {
                    type: 'string',
                    description: 'Text for copy/paste operations',
                },
            },
            required: ['operation'],
        },
    },
    // === Close ===
    {
        name: 'browser_close',
        description: 'Close the browser',
        inputSchema: {
            type: 'object',
            properties: {},
        },
    },
];
/**
 * Handle tool calls
 */
async function handleToolCall(name, args) {
    const generateId = () => Math.random().toString(36).substring(7);
    switch (name) {
        // === Navigation ===
        case 'browser_navigate': {
            await ensureBrowserLaunched(args.headless !== false);
            return execute({
                id: generateId(),
                action: 'navigate',
                url: args.url,
                waitUntil: args.waitUntil,
                headers: args.headers,
            });
        }
        case 'browser_snapshot': {
            return execute({
                id: generateId(),
                action: 'snapshot',
                options: {
                    interactiveOnly: args.interactiveOnly,
                    compact: args.compact,
                    depth: args.depth,
                    selector: args.selector,
                },
            });
        }
        case 'browser_screenshot': {
            return execute({
                id: generateId(),
                action: 'screenshot',
                path: args.path,
                fullPage: args.fullPage,
                selector: args.selector,
            });
        }
        case 'browser_back':
            return execute({ id: generateId(), action: 'back' });
        case 'browser_forward':
            return execute({ id: generateId(), action: 'forward' });
        case 'browser_reload':
            return execute({ id: generateId(), action: 'reload' });
        case 'browser_url':
            return execute({ id: generateId(), action: 'url' });
        case 'browser_title':
            return execute({ id: generateId(), action: 'title' });
        // === Element Interaction ===
        case 'browser_click':
            return execute({
                id: generateId(),
                action: 'click',
                selector: args.selector,
                button: args.button,
                clickCount: args.clickCount,
            });
        case 'browser_dblclick':
            return execute({
                id: generateId(),
                action: 'dblclick',
                selector: args.selector,
            });
        case 'browser_fill':
            return execute({
                id: generateId(),
                action: 'fill',
                selector: args.selector,
                value: args.value,
            });
        case 'browser_type':
            return execute({
                id: generateId(),
                action: 'type',
                selector: args.selector,
                text: args.text,
                delay: args.delay,
            });
        case 'browser_press':
            return execute({
                id: generateId(),
                action: 'press',
                key: args.key,
                selector: args.selector,
            });
        case 'browser_hover':
            return execute({
                id: generateId(),
                action: 'hover',
                selector: args.selector,
            });
        case 'browser_focus':
            return execute({
                id: generateId(),
                action: 'focus',
                selector: args.selector,
            });
        case 'browser_select':
            return execute({
                id: generateId(),
                action: 'select',
                selector: args.selector,
                values: args.values,
            });
        case 'browser_check':
            return execute({
                id: generateId(),
                action: 'check',
                selector: args.selector,
            });
        case 'browser_uncheck':
            return execute({
                id: generateId(),
                action: 'uncheck',
                selector: args.selector,
            });
        case 'browser_tap':
            return execute({
                id: generateId(),
                action: 'tap',
                selector: args.selector,
            });
        case 'browser_clear':
            return execute({
                id: generateId(),
                action: 'clear',
                selector: args.selector,
            });
        case 'browser_scroll':
            return execute({
                id: generateId(),
                action: 'scroll',
                selector: args.selector,
                direction: args.direction,
                amount: args.amount,
                x: args.x,
                y: args.y,
            });
        case 'browser_scroll_into_view':
            return execute({
                id: generateId(),
                action: 'scrollintoview',
                selector: args.selector,
            });
        case 'browser_drag':
            return execute({
                id: generateId(),
                action: 'drag',
                source: args.source,
                target: args.target,
            });
        case 'browser_upload':
            return execute({
                id: generateId(),
                action: 'upload',
                selector: args.selector,
                files: args.files,
            });
        // === Get Element Info ===
        case 'browser_get_text':
            return execute({
                id: generateId(),
                action: 'gettext',
                selector: args.selector,
            });
        case 'browser_get_inner_text':
            return execute({
                id: generateId(),
                action: 'innertext',
                selector: args.selector,
            });
        case 'browser_get_inner_html':
            return execute({
                id: generateId(),
                action: 'innerhtml',
                selector: args.selector,
            });
        case 'browser_get_attribute':
            return execute({
                id: generateId(),
                action: 'getattribute',
                selector: args.selector,
                attribute: args.attribute,
            });
        case 'browser_get_value':
            return execute({
                id: generateId(),
                action: 'inputvalue',
                selector: args.selector,
            });
        case 'browser_is_visible':
            return execute({
                id: generateId(),
                action: 'isvisible',
                selector: args.selector,
            });
        case 'browser_is_enabled':
            return execute({
                id: generateId(),
                action: 'isenabled',
                selector: args.selector,
            });
        case 'browser_is_checked':
            return execute({
                id: generateId(),
                action: 'ischecked',
                selector: args.selector,
            });
        case 'browser_count':
            return execute({
                id: generateId(),
                action: 'count',
                selector: args.selector,
            });
        case 'browser_bounding_box':
            return execute({
                id: generateId(),
                action: 'boundingbox',
                selector: args.selector,
            });
        case 'browser_highlight':
            return execute({
                id: generateId(),
                action: 'highlight',
                selector: args.selector,
            });
        case 'browser_styles':
            return execute({
                id: generateId(),
                action: 'styles',
                selector: args.selector,
            });
        // === Semantic Locators ===
        case 'browser_find_by_role':
            return execute({
                id: generateId(),
                action: 'getbyrole',
                role: args.role,
                name: args.name,
                subaction: args.action,
                value: args.value,
            });
        case 'browser_find_by_text':
            return execute({
                id: generateId(),
                action: 'getbytext',
                text: args.text,
                exact: args.exact,
                subaction: args.action,
            });
        case 'browser_find_by_label':
            return execute({
                id: generateId(),
                action: 'getbylabel',
                label: args.label,
                subaction: args.action,
                value: args.value,
            });
        case 'browser_find_by_placeholder':
            return execute({
                id: generateId(),
                action: 'getbyplaceholder',
                placeholder: args.placeholder,
                subaction: args.action,
                value: args.value,
            });
        case 'browser_find_by_alt_text':
            return execute({
                id: generateId(),
                action: 'getbyalttext',
                text: args.text,
                exact: args.exact,
                subaction: args.action,
            });
        case 'browser_find_by_title':
            return execute({
                id: generateId(),
                action: 'getbytitle',
                text: args.text,
                exact: args.exact,
                subaction: args.action,
            });
        case 'browser_find_by_test_id':
            return execute({
                id: generateId(),
                action: 'getbytestid',
                testId: args.testId,
                subaction: args.action,
                value: args.value,
            });
        case 'browser_find_nth':
            return execute({
                id: generateId(),
                action: 'nth',
                selector: args.selector,
                index: args.index,
                subaction: args.action,
                value: args.value,
            });
        // === Wait ===
        case 'browser_wait':
            return execute({
                id: generateId(),
                action: 'wait',
                selector: args.selector,
                timeout: args.timeout,
                state: args.state,
            });
        case 'browser_wait_for_url':
            return execute({
                id: generateId(),
                action: 'waitforurl',
                url: args.url,
                timeout: args.timeout,
            });
        case 'browser_wait_for_load_state':
            return execute({
                id: generateId(),
                action: 'waitforloadstate',
                state: args.state,
                timeout: args.timeout,
            });
        case 'browser_wait_for_function':
            return execute({
                id: generateId(),
                action: 'waitforfunction',
                expression: args.expression,
                timeout: args.timeout,
            });
        // === JavaScript Execution ===
        case 'browser_evaluate':
            return execute({
                id: generateId(),
                action: 'evaluate',
                script: args.script,
                args: args.args,
            });
        // === Content ===
        case 'browser_get_content':
            return execute({
                id: generateId(),
                action: 'content',
                selector: args.selector,
            });
        case 'browser_set_content':
            return execute({
                id: generateId(),
                action: 'setcontent',
                html: args.html,
            });
        // === PDF ===
        case 'browser_pdf':
            return execute({
                id: generateId(),
                action: 'pdf',
                path: args.path,
                format: args.format,
            });
        // === Tabs & Windows ===
        case 'browser_tab_list':
            return execute({ id: generateId(), action: 'tab_list' });
        case 'browser_tab_new':
            return execute({
                id: generateId(),
                action: 'tab_new',
                url: args.url,
            });
        case 'browser_tab_switch':
            return execute({
                id: generateId(),
                action: 'tab_switch',
                index: args.index,
            });
        case 'browser_tab_close':
            return execute({
                id: generateId(),
                action: 'tab_close',
                index: args.index,
            });
        case 'browser_window_new':
            return execute({
                id: generateId(),
                action: 'window_new',
                viewport: args.viewport,
            });
        // === Frames ===
        case 'browser_frame':
            return execute({
                id: generateId(),
                action: 'frame',
                selector: args.selector,
                name: args.name,
                url: args.url,
            });
        case 'browser_main_frame':
            return execute({ id: generateId(), action: 'mainframe' });
        // === Cookies & Storage ===
        case 'browser_cookies_get':
            return execute({
                id: generateId(),
                action: 'cookies_get',
                urls: args.urls,
            });
        case 'browser_cookies_set':
            return execute({
                id: generateId(),
                action: 'cookies_set',
                cookies: args.cookies,
            });
        case 'browser_storage_get':
            return execute({
                id: generateId(),
                action: 'storage_get',
                type: args.type,
                key: args.key,
            });
        case 'browser_storage_set':
            return execute({
                id: generateId(),
                action: 'storage_set',
                type: args.type,
                key: args.key,
                value: args.value,
            });
        case 'browser_storage_clear':
            return execute({
                id: generateId(),
                action: 'storage_clear',
                type: args.type,
            });
        // === Browser Settings ===
        case 'browser_set_viewport':
            return execute({
                id: generateId(),
                action: 'viewport',
                width: args.width,
                height: args.height,
            });
        case 'browser_set_device':
            return execute({
                id: generateId(),
                action: 'device',
                device: args.device,
            });
        case 'browser_set_geolocation':
            return execute({
                id: generateId(),
                action: 'geolocation',
                latitude: args.latitude,
                longitude: args.longitude,
                accuracy: args.accuracy,
            });
        case 'browser_set_offline':
            return execute({
                id: generateId(),
                action: 'offline',
                offline: args.offline,
            });
        case 'browser_emulate_media':
            return execute({
                id: generateId(),
                action: 'emulatemedia',
                media: args.media === 'null' ? null : args.media,
                colorScheme: args.colorScheme === 'null' ? null : args.colorScheme,
                reducedMotion: args.reducedMotion === 'null' ? null : args.reducedMotion,
            });
        case 'browser_set_timezone':
            return execute({
                id: generateId(),
                action: 'timezone',
                timezone: args.timezone,
            });
        case 'browser_set_locale':
            return execute({
                id: generateId(),
                action: 'locale',
                locale: args.locale,
            });
        case 'browser_set_headers':
            return execute({
                id: generateId(),
                action: 'headers',
                headers: args.headers,
            });
        case 'browser_set_credentials':
            return execute({
                id: generateId(),
                action: 'credentials',
                username: args.username,
                password: args.password,
            });
        // === Network ===
        case 'browser_network_route':
            return execute({
                id: generateId(),
                action: 'route',
                url: args.url,
                response: args.response,
                abort: args.abort,
            });
        case 'browser_network_unroute':
            return execute({
                id: generateId(),
                action: 'unroute',
                url: args.url,
            });
        case 'browser_network_requests':
            return execute({
                id: generateId(),
                action: 'requests',
                filter: args.filter,
                clear: args.clear,
            });
        case 'browser_wait_for_download':
            return execute({
                id: generateId(),
                action: 'waitfordownload',
                path: args.path,
                timeout: args.timeout,
            });
        case 'browser_download':
            return execute({
                id: generateId(),
                action: 'download',
                selector: args.selector,
                path: args.path,
            });
        case 'browser_response_body':
            return execute({
                id: generateId(),
                action: 'responsebody',
                url: args.url,
                timeout: args.timeout,
            });
        // === Dialogs ===
        case 'browser_dialog_accept':
            return execute({
                id: generateId(),
                action: 'dialog',
                response: 'accept',
                promptText: args.promptText,
            });
        case 'browser_dialog_dismiss':
            return execute({
                id: generateId(),
                action: 'dialog',
                response: 'dismiss',
            });
        // === Debug ===
        case 'browser_console':
            return execute({
                id: generateId(),
                action: 'console',
                clear: args.clear,
            });
        case 'browser_errors':
            return execute({
                id: generateId(),
                action: 'errors',
                clear: args.clear,
            });
        case 'browser_trace_start':
            return execute({
                id: generateId(),
                action: 'trace_start',
                screenshots: args.screenshots,
                snapshots: args.snapshots,
            });
        case 'browser_trace_stop':
            return execute({
                id: generateId(),
                action: 'trace_stop',
                path: args.path,
            });
        // === Advanced Input ===
        case 'browser_keyboard':
            return execute({
                id: generateId(),
                action: 'keyboard',
                keys: args.keys,
            });
        case 'browser_key_down':
            return execute({
                id: generateId(),
                action: 'keydown',
                key: args.key,
            });
        case 'browser_key_up':
            return execute({
                id: generateId(),
                action: 'keyup',
                key: args.key,
            });
        case 'browser_mouse_move':
            return execute({
                id: generateId(),
                action: 'mousemove',
                x: args.x,
                y: args.y,
            });
        case 'browser_mouse_down':
            return execute({
                id: generateId(),
                action: 'mousedown',
                button: args.button,
            });
        case 'browser_mouse_up':
            return execute({
                id: generateId(),
                action: 'mouseup',
                button: args.button,
            });
        case 'browser_wheel':
            return execute({
                id: generateId(),
                action: 'wheel',
                deltaX: args.deltaX,
                deltaY: args.deltaY,
                selector: args.selector,
            });
        // === Misc ===
        case 'browser_select_all':
            return execute({
                id: generateId(),
                action: 'selectall',
                selector: args.selector,
            });
        case 'browser_set_value':
            return execute({
                id: generateId(),
                action: 'setvalue',
                selector: args.selector,
                value: args.value,
            });
        case 'browser_multiselect':
            return execute({
                id: generateId(),
                action: 'multiselect',
                selector: args.selector,
                values: args.values,
            });
        case 'browser_dispatch_event':
            return execute({
                id: generateId(),
                action: 'dispatch',
                selector: args.selector,
                event: args.event,
                eventInit: args.eventInit,
            });
        case 'browser_add_script':
            return execute({
                id: generateId(),
                action: 'addscript',
                content: args.content,
                url: args.url,
            });
        case 'browser_add_style':
            return execute({
                id: generateId(),
                action: 'addstyle',
                content: args.content,
                url: args.url,
            });
        case 'browser_add_init_script':
            return execute({
                id: generateId(),
                action: 'addinitscript',
                script: args.script,
            });
        case 'browser_bring_to_front':
            return execute({
                id: generateId(),
                action: 'bringtofront',
            });
        // === Streaming & Recording ===
        case 'browser_screencast_start':
            return execute({
                id: generateId(),
                action: 'screencast_start',
                format: args.format,
                quality: args.quality,
                maxWidth: args.maxWidth,
                maxHeight: args.maxHeight,
            });
        case 'browser_screencast_stop':
            return execute({
                id: generateId(),
                action: 'screencast_stop',
            });
        case 'browser_recording_start':
            return execute({
                id: generateId(),
                action: 'recording_start',
                path: args.path,
                url: args.url,
            });
        case 'browser_recording_stop':
            return execute({
                id: generateId(),
                action: 'recording_stop',
            });
        case 'browser_recording_restart':
            return execute({
                id: generateId(),
                action: 'recording_restart',
                path: args.path,
                url: args.url,
            });
        // === State & HAR ===
        case 'browser_state_save':
            return execute({
                id: generateId(),
                action: 'state_save',
                path: args.path,
            });
        case 'browser_state_load':
            return execute({
                id: generateId(),
                action: 'state_load',
                path: args.path,
            });
        case 'browser_har_start':
            return execute({
                id: generateId(),
                action: 'har_start',
            });
        case 'browser_har_stop':
            return execute({
                id: generateId(),
                action: 'har_stop',
                path: args.path,
            });
        // === Clipboard ===
        case 'browser_clipboard':
            return execute({
                id: generateId(),
                action: 'clipboard',
                operation: args.operation,
                text: args.text,
            });
        // === Close ===
        case 'browser_close':
            const result = await execute({
                id: generateId(),
                action: 'close',
            });
            browser = null;
            return result;
        default:
            return {
                content: [
                    {
                        type: 'text',
                        text: `Unknown tool: ${name}`,
                    },
                ],
            };
    }
}
/**
 * Main entry point
 */
async function main() {
    // Create MCP server
    const server = new Server({
        name: 'agent-browser-mcp',
        version: '0.1.0',
    }, {
        capabilities: {
            tools: {},
        },
    });
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
        }
        catch (error) {
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
        if (browser) {
            await browser.close();
        }
        process.exit(0);
    });
    process.on('SIGTERM', async () => {
        if (browser) {
            await browser.close();
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
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}
export { main };
//# sourceMappingURL=index.js.map