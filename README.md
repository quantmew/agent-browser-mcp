# agent-browser-mcp

Browser automation MCP (Model Context Protocol) server powered by [agent-browser](https://github.com/vercel-labs/agent-browser).

This MCP server provides comprehensive browser automation capabilities through the MCP protocol, enabling AI agents to interact with web pages programmatically.

## Features

- **Navigation**: Navigate to URLs, go back/forward, reload pages
- **Element Interaction**: Click, fill, type, hover, drag & drop, upload files
- **Semantic Locators**: Find elements by role, text, label, placeholder, alt text, title, test ID
- **Snapshot**: Get accessibility tree with element refs for deterministic interaction
- **Screenshots**: Capture full page or element screenshots
- **Forms**: Check/uncheck checkboxes, select dropdowns, manage inputs
- **JavaScript Execution**: Run custom JavaScript in the page context
- **Cookies & Storage**: Manage cookies, localStorage, sessionStorage
- **Network Control**: Intercept requests, mock responses, track network activity
- **Tabs & Windows**: Manage multiple tabs and windows
- **Frames**: Switch between iframes
- **Browser Settings**: Set viewport, emulate devices, geolocation, media features
- **Debug**: Trace, console logs, page errors
- **Recording**: Screen recording and screencast streaming
- **PDF Export**: Save pages as PDF

## Installation

```bash
npm install agent-browser-mcp
```

Or build from source:

```bash
git clone https://github.com/xiahanhan/agent-browser-mcp.git
cd agent-browser-mcp
npm install
npm run build
```

## Setup

### 1. Install Chromium Browser

```bash
npx playwright install chromium
```

On Linux, you may also need system dependencies:

```bash
npx playwright install-deps chromium
```

### 2. Configure MCP Client

Add to your MCP client configuration (e.g., Claude Desktop config at `~/Library/Application Support/Claude/claude_desktop_config.json` on macOS or `%APPDATA%\Claude\claude_desktop_config.json` on Windows):

#### Option A: Direct npx installation (recommended)

```json
{
  "mcpServers": {
    "agent-browser": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "github:quantmew/agent-browser-mcp"]
    }
  }
}
```

This method automatically downloads and runs the latest version from GitHub without manual installation.

#### Option B: Local installation

```json
{
  "mcpServers": {
    "browser": {
      "command": "node",
      "args": ["/path/to/agent-browser-mcp/dist/index.js"]
    }
  }
}
```

### 3. Environment Variables (Optional)

```bash
# Use a custom browser executable (e.g., for serverless)
export AGENT_BROWSER_EXECUTABLE_PATH="/path/to/chromium"

# Run in headed mode (show browser window)
export AGENT_BROWSER_HEADED="1"
```

## Usage

### Basic Workflow

1. **Navigate to a page**
   ```javascript
   browser_navigate({ url: "https://example.com" })
   ```

2. **Get a snapshot** (accessibility tree with element refs)
   ```javascript
   browser_snapshot()
   // Returns:
   // - heading "Example Domain" [ref=e1] [level=1]
   // - link "More information..." [ref=e2]
   ```

3. **Interact with elements** using refs
   ```javascript
   browser_click({ selector: "@e2" })
   browser_fill({ selector: "@e3", value: "test@example.com" })
   ```

### Example: Login Flow

```javascript
// Navigate to login page
browser_navigate({ url: "https://example.com/login" })

// Get interactive elements
browser_snapshot({ interactiveOnly: true })

// Fill login form
browser_fill({ selector: "@e1", value: "user@example.com" })
browser_fill({ selector: "@e2", value: "password" })

// Click submit button
browser_click({ selector: "@e3" })

// Wait for navigation
browser_wait_for_url({ url: "**/dashboard" })

// Take screenshot
browser_screenshot({ path: "dashboard.png" })

// Close browser
browser_close()
```

### Example: Semantic Locators

```javascript
// Find by ARIA role
browser_find_by_role({
  role: "button",
  name: "Submit",
  action: "click"
})

// Find by text
browser_find_by_text({
  text: "Sign In",
  action: "click"
})

// Find by label
browser_find_by_label({
  label: "Email",
  action: "fill",
  value: "test@example.com"
})
```

### Example: Form Interaction

```javascript
// Fill inputs
browser_fill({ selector: "#name", value: "John Doe" })
browser_select({ selector: "#country", values: "USA" })

// Check checkbox
browser_check({ selector: "#agree" })

// Upload file
browser_upload({ selector: "#file", files: "/path/to/file.pdf" })

// Submit form
browser_click({ selector: "button[type='submit']" })
```

### Example: JavaScript Execution

```javascript
// Execute custom JavaScript
browser_evaluate({
  script: "document.title"
})

// With arguments
browser_evaluate({
  script: "(a, b) => a + b",
  args: [1, 2]
})

// Wait for condition
browser_wait_for_function({
  expression: "window.ready === true"
})
```

### Example: Network Control

```javascript
// Mock API response
browser_network_route({
  url: "**/api/**",
  response: {
    status: 200,
    body: '{"success": true}',
    contentType: "application/json"
  }
})

// Block requests
browser_network_route({
  url: "**/analytics/**",
  abort: true
})

// View network requests
browser_network_requests({ filter: "api" })

// Remove routes
browser_network_unroute({ url: "**/api/**" })
```

### Example: Cookies & Storage

```javascript
// Get all cookies
browser_cookies_get()

// Set cookies
browser_cookies_set({
  cookies: [{
    name: "session",
    value: "abc123",
    domain: "example.com"
  }]
})

// Get localStorage
browser_storage_get({ type: "local" })

// Set localStorage
browser_storage_set({
  type: "local",
  key: "user",
  value: '{"id": 123}'
})

// Clear storage
browser_storage_clear({ type: "local" })
```

### Example: Browser Settings

```javascript
// Set viewport size
browser_set_viewport({ width: 1920, height: 1080 })

// Emulate device
browser_set_device({ device: "iPhone 14" })

// Set geolocation
browser_set_geolocation({
  latitude: 37.7749,
  longitude: -122.4194
})

// Emulate dark mode
browser_emulate_media({ colorScheme: "dark" })

// Set timezone
browser_set_timezone({ timezone: "America/New_York" })
```

### Example: Tabs & Windows

```javascript
// Open new tab
browser_tab_new({ url: "https://example.com" })

// List tabs
browser_tab_list()

// Switch to tab
browser_tab_switch({ index: 1 })

// Close current tab
browser_tab_close()

// Open new window
browser_window_new({
  viewport: { width: 800, height: 600 }
})
```

## Tools Reference

### Navigation
- `browser_navigate` - Navigate to URL
- `browser_snapshot` - Get accessibility tree
- `browser_screenshot` - Take screenshot
- `browser_back` - Go back
- `browser_forward` - Go forward
- `browser_reload` - Reload page
- `browser_url` - Get current URL
- `browser_title` - Get page title

### Element Interaction
- `browser_click` - Click element
- `browser_dblclick` - Double-click element
- `browser_fill` - Clear and fill input
- `browser_type` - Type text
- `browser_press` - Press key
- `browser_hover` - Hover over element
- `browser_focus` - Focus element
- `browser_select` - Select dropdown option
- `browser_check` - Check checkbox
- `browser_uncheck` - Uncheck checkbox
- `browser_tap` - Tap element (touch)
- `browser_clear` - Clear input
- `browser_scroll` - Scroll page/element
- `browser_drag` - Drag and drop
- `browser_upload` - Upload file

### Get Element Info
- `browser_get_text` - Get text content
- `browser_get_inner_text` - Get inner text
- `browser_get_inner_html` - Get inner HTML
- `browser_get_attribute` - Get attribute value
- `browser_get_value` - Get input value
- `browser_is_visible` - Check if visible
- `browser_is_enabled` - Check if enabled
- `browser_is_checked` - Check if checked
- `browser_count` - Count matching elements
- `browser_bounding_box` - Get bounding box
- `browser_highlight` - Highlight element
- `browser_styles` - Get computed styles

### Semantic Locators
- `browser_find_by_role` - Find by ARIA role
- `browser_find_by_text` - Find by text
- `browser_find_by_label` - Find by label
- `browser_find_by_placeholder` - Find by placeholder
- `browser_find_by_alt_text` - Find by alt text
- `browser_find_by_title` - Find by title attribute
- `browser_find_by_test_id` - Find by test ID
- `browser_find_nth` - Find Nth matching element

### Wait
- `browser_wait` - Wait for element or time
- `browser_wait_for_url` - Wait for URL
- `browser_wait_for_load_state` - Wait for load state
- `browser_wait_for_function` - Wait for JS condition

### JavaScript
- `browser_evaluate` - Execute JavaScript

### Content
- `browser_get_content` - Get page HTML
- `browser_set_content` - Set page HTML

### PDF
- `browser_pdf` - Save as PDF

### Tabs & Windows
- `browser_tab_list` - List tabs
- `browser_tab_new` - Open new tab
- `browser_tab_switch` - Switch to tab
- `browser_tab_close` - Close tab
- `browser_window_new` - Open new window

### Frames
- `browser_frame` - Switch to iframe
- `browser_main_frame` - Switch to main frame

### Cookies & Storage
- `browser_cookies_get` - Get cookies
- `browser_cookies_set` - Set cookies
- `browser_storage_get` - Get storage
- `browser_storage_set` - Set storage
- `browser_storage_clear` - Clear storage

### Browser Settings
- `browser_set_viewport` - Set viewport size
- `browser_set_device` - Emulate device
- `browser_set_geolocation` - Set geolocation
- `browser_set_offline` - Set offline mode
- `browser_emulate_media` - Emulate media features
- `browser_set_timezone` - Set timezone
- `browser_set_locale` - Set locale
- `browser_set_headers` - Set HTTP headers
- `browser_set_credentials` - Set HTTP credentials

### Network
- `browser_network_route` - Intercept requests
- `browser_network_unroute` - Remove routes
- `browser_network_requests` - Get requests
- `browser_wait_for_download` - Wait for download
- `browser_download` - Trigger download
- `browser_response_body` - Get response body

### Dialogs
- `browser_dialog_accept` - Accept dialog
- `browser_dialog_dismiss` - Dismiss dialog

### Debug
- `browser_console` - Get console messages
- `browser_errors` - Get page errors
- `browser_trace_start` - Start trace
- `browser_trace_stop` - Stop trace

### Advanced Input
- `browser_keyboard` - Keyboard shortcut
- `browser_key_down` - Hold key
- `browser_key_up` - Release key
- `browser_mouse_move` - Move mouse
- `browser_mouse_down` - Press mouse button
- `browser_mouse_up` - Release mouse button
- `browser_wheel` - Mouse wheel

### Misc
- `browser_select_all` - Select all text
- `browser_set_value` - Set input value
- `browser_multiselect` - Multi-select dropdown
- `browser_dispatch_event` - Dispatch event
- `browser_add_script` - Add script tag
- `browser_add_style` - Add style tag
- `browser_add_init_script` - Add init script
- `browser_bring_to_front` - Bring to front

### Recording & State
- `browser_screencast_start` - Start screencast
- `browser_screencast_stop` - Stop screencast
- `browser_recording_start` - Start recording
- `browser_recording_stop` - Stop recording
- `browser_recording_restart` - Restart recording
- `browser_state_save` - Save state
- `browser_state_load` - Load state
- `browser_har_start` - Start HAR
- `browser_har_stop` - Stop HAR
- `browser_clipboard` - Clipboard operations

### Control
- `browser_close` - Close browser

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Development mode
npm run dev

# Type check
npm run typecheck

# Format code
npm run format
```

## Architecture

This MCP server wraps the [agent-browser](https://github.com/vercel-labs/agent-browser) library, which provides:

- **Playwright** browser automation
- Snapshot generation with accessibility tree and element refs
- Semantic locators (role, text, label, placeholder, etc.)
- Session management
- Network interception
- Multi-tab/window support

## License

Apache-2.0

## Credits

Based on [agent-browser](https://github.com/vercel-labs/agent-browser) by Vercel Labs.
