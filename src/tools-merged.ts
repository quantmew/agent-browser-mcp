/**
 * Merged tool definitions - reduced from 114 to ~40 tools
 */

export interface Tool {
  name: string;
  description?: string;
  inputSchema: {
    type: 'object';
    properties?: Record<string, any>;
    required?: string[];
    [key: string]: any;
  };
}

export const MERGED_TOOLS: Tool[] = [
  // === Core ===
  {
    name: 'browser_launch',
    description: 'Launch browser session with startup options',
    inputSchema: {
      type: 'object',
      properties: {
        headless: { type: 'boolean', description: 'Run browser in headless mode' },
        browser: { type: 'string', enum: ['chromium', 'firefox', 'webkit'], description: 'Browser engine' },
        cdpPort: { type: 'number', description: 'Connect to local CDP port' },
        cdpUrl: { type: 'string', description: 'Connect to CDP URL (ws/http)' },
        executablePath: { type: 'string', description: 'Browser executable path' },
        args: { type: 'array', items: { type: 'string' }, description: 'Additional browser args' },
        userAgent: { type: 'string', description: 'Context user agent' },
        provider: { type: 'string', enum: ['ios', 'browserbase', 'browseruse', 'kernel'], description: 'Browser provider' },
        ignoreHTTPSErrors: { type: 'boolean', description: 'Ignore HTTPS/TLS errors' },
        profile: { type: 'string', description: 'Persistent profile directory path' },
        storageState: { type: 'string', description: 'Storage state JSON path' },
        allowFileAccess: { type: 'boolean', description: 'Enable file:// cross-origin access (Chromium)' },
      },
    },
  },
  {
    name: 'browser_navigate',
    description: 'Navigate to a URL',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'The URL to navigate to' },
        waitUntil: { type: 'string', enum: ['load', 'domcontentloaded', 'networkidle'], description: 'When to consider navigation succeeded' },
        headers: { type: 'object', description: 'HTTP headers to set for this origin' },
      },
      required: ['url'],
    },
  },
  {
    name: 'browser_snapshot',
    description: 'Get accessibility tree with element refs (@e1, @e2, etc.) for interaction',
    inputSchema: {
      type: 'object',
      properties: {
        interactiveOnly: { type: 'boolean', description: 'Only show interactive elements' },
        cursor: { type: 'boolean', description: 'Include cursor-interactive elements' },
        compact: { type: 'boolean', description: 'Remove empty structural elements' },
        depth: { type: 'number', description: 'Limit tree depth' },
        selector: { type: 'string', description: 'Scope to CSS selector' },
      },
    },
  },
  {
    name: 'browser_screenshot',
    description: 'Take screenshot of current page or element',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path to save screenshot (optional)' },
        fullPage: { type: 'boolean', description: 'Capture full page scrollable screenshot' },
        selector: { type: ['string', 'null'], description: 'CSS selector for element screenshot' },
      },
    },
  },
  {
    name: 'browser_close',
    description: 'Close the browser',
    inputSchema: { type: 'object', properties: {} },
  },

  // === Navigation History ===
  {
    name: 'browser_history',
    description: 'Navigate browser history',
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['back', 'forward', 'reload'], description: 'History action' },
      },
      required: ['action'],
    },
  },
  {
    name: 'browser_page_info',
    description: 'Get current page information',
    inputSchema: {
      type: 'object',
      properties: {
        info: { type: 'string', enum: ['url', 'title'], description: 'Page info to retrieve' },
      },
      required: ['info'],
    },
  },

  // === Element Actions ===
  {
    name: 'browser_element_action',
    description: 'Perform action on an element (click, dblclick, hover, focus, tap)',
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['click', 'dblclick', 'hover', 'focus', 'tap'], description: 'Action to perform' },
        selector: { type: 'string', description: 'CSS selector or element ref (@e1, @e2, etc.)' },
        button: { type: 'string', enum: ['left', 'right', 'middle'], description: 'Mouse button (for click)' },
        clickCount: { type: 'number', description: 'Number of clicks (for click)' },
      },
      required: ['action', 'selector'],
    },
  },
  {
    name: 'browser_input',
    description: 'Input text into an element',
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['fill', 'type'], description: 'fill: clear then input, type: append text' },
        selector: { type: 'string', description: 'CSS selector or element ref' },
        value: { type: 'string', description: 'Text value to input' },
        delay: { type: 'number', description: 'Delay between keystrokes in ms (for type)' },
      },
      required: ['action', 'selector', 'value'],
    },
  },
  {
    name: 'browser_input_action',
    description: 'Perform input control actions (check, uncheck, clear, select_all)',
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['check', 'uncheck', 'clear', 'select_all'], description: 'Input control action' },
        selector: { type: 'string', description: 'CSS selector or element ref' },
      },
      required: ['action', 'selector'],
    },
  },
  {
    name: 'browser_select',
    description: 'Select option(s) from a dropdown',
    inputSchema: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'CSS selector or element ref' },
        values: {
          oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
          description: 'Value(s) to select',
        },
        multiSelect: { type: 'boolean', description: 'Select multiple options (use browser_select instead)' },
      },
      required: ['selector', 'values'],
    },
  },
  {
    name: 'browser_press',
    description: 'Press a keyboard key (Enter, Tab, Escape, etc.)',
    inputSchema: {
      type: 'object',
      properties: {
        key: { type: 'string', description: 'Key to press (Enter, Tab, Escape, Backspace, ArrowDown, etc.)' },
        selector: { type: 'string', description: 'Optional element selector to focus first' },
      },
      required: ['key'],
    },
  },
  {
    name: 'browser_scroll',
    description: 'Scroll page or element',
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['scroll', 'scroll_into_view'], description: 'Scroll action type' },
        selector: { type: 'string', description: 'Element selector (for scroll_into_view or element scroll)' },
        direction: { type: 'string', enum: ['up', 'down', 'left', 'right'], description: 'Scroll direction (for scroll)' },
        amount: { type: 'number', description: 'Pixels to scroll (for scroll)' },
        x: { type: 'number', description: 'X position to scroll to' },
        y: { type: 'number', description: 'Y position to scroll to' },
      },
      required: ['action'],
    },
  },

  // === Find Elements ===
  {
    name: 'browser_find',
    description: 'Find element by accessible criteria and perform action',
    inputSchema: {
      type: 'object',
      properties: {
        method: {
          type: 'string',
          enum: ['role', 'text', 'label', 'placeholder', 'testId', 'title', 'altText', 'nth'],
          description: 'Find method',
        },
        value: { type: 'string', description: 'Value to search for' },
        exact: { type: 'boolean', description: 'Exact match (for text, title, altText)' },
        action: { type: 'string', enum: ['click', 'hover', 'fill', 'check'], description: 'Action to perform on found element' },
        fillValue: { type: 'string', description: 'Value to fill (for fill action)' },
        index: { type: 'number', description: 'Element index (for nth method, 0-based, -1 for last)' },
        selector: { type: 'string', description: 'CSS selector (for nth method)' },
      },
      required: ['method', 'value'],
    },
  },

  // === Get Element Content ===
  {
    name: 'browser_get',
    description: 'Get element content or attribute',
    inputSchema: {
      type: 'object',
      properties: {
        property: {
          type: 'string',
          enum: ['text', 'innerText', 'innerHtml', 'html', 'value', 'attribute', 'boundingBox', 'count'],
          description: 'Property to get',
        },
        selector: { type: 'string', description: 'CSS selector or element ref' },
        attribute: { type: 'string', description: 'Attribute name (for property=attribute)' },
      },
      required: ['property', 'selector'],
    },
  },
  {
    name: 'browser_check_state',
    description: 'Check element state',
    inputSchema: {
      type: 'object',
      properties: {
        state: { type: 'string', enum: ['visible', 'enabled', 'checked'], description: 'State to check' },
        selector: { type: 'string', description: 'CSS selector or element ref' },
      },
      required: ['state', 'selector'],
    },
  },

  // === Storage & Cookies ===
  {
    name: 'browser_storage',
    description: 'Manage localStorage or sessionStorage',
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['get', 'set', 'clear'], description: 'Storage action' },
        type: { type: 'string', enum: ['local', 'session'], description: 'Storage type' },
        key: { type: 'string', description: 'Storage key (for get/set)' },
        value: { type: 'string', description: 'Storage value (for set)' },
      },
      required: ['action', 'type'],
    },
  },
  {
    name: 'browser_cookies',
    description: 'Get or set cookies',
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['get', 'set'], description: 'Cookie action' },
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
          },
          description: 'Cookies to set (for set action)',
        },
        urls: { type: 'array', items: { type: 'string' }, description: 'URLs to filter cookies (for get)' },
      },
      required: ['action'],
    },
  },
  {
    name: 'browser_state',
    description: 'Save or load storage state',
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['save', 'load'], description: 'State action' },
        path: { type: 'string', description: 'State file path' },
      },
      required: ['action', 'path'],
    },
  },

  // === Context & Settings ===
  {
    name: 'browser_set_context',
    description: 'Set browser context (device, viewport, geolocation, locale, timezone, offline, media, headers, credentials)',
    inputSchema: {
      type: 'object',
      properties: {
        setting: {
          type: 'string',
          enum: ['device', 'viewport', 'geolocation', 'locale', 'timezone', 'offline', 'media', 'headers', 'credentials'],
          description: 'Context setting to change',
        },
        device: { type: 'string', description: 'Device name (for device setting, e.g., "iPhone 14")' },
        width: { type: 'number', description: 'Viewport width (for viewport setting)' },
        height: { type: 'number', description: 'Viewport height (for viewport setting)' },
        latitude: { type: 'number', description: 'Latitude (for geolocation setting)' },
        longitude: { type: 'number', description: 'Longitude (for geolocation setting)' },
        accuracy: { type: 'number', description: 'Accuracy in meters (for geolocation setting)' },
        locale: { type: 'string', description: 'Locale code e.g. "en-US" (for locale setting)' },
        timezone: { type: 'string', description: 'Timezone ID e.g. "America/New_York" (for timezone setting)' },
        offline: { type: 'boolean', description: 'Offline mode (for offline setting)' },
        media: { type: 'string', enum: ['screen', 'print'], description: 'Media type (for media setting)' },
        colorScheme: { type: 'string', enum: ['light', 'dark', 'no-preference'], description: 'Color scheme (for media setting)' },
        reducedMotion: { type: 'string', enum: ['reduce', 'no-preference'], description: 'Reduced motion (for media setting)' },
        headers: { type: 'object', description: 'HTTP headers object (for headers setting)' },
        username: { type: 'string', description: 'Username (for credentials setting)' },
        password: { type: 'string', description: 'Password (for credentials setting)' },
      },
      required: ['setting'],
    },
  },

  // === Dialogs ===
  {
    name: 'browser_dialog',
    description: 'Accept or dismiss dialogs (alert, confirm, prompt)',
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['accept', 'dismiss'], description: 'Dialog action' },
        promptText: { type: 'string', description: 'Text to enter for prompt dialog (for accept action)' },
      },
      required: ['action'],
    },
  },

  // === Mouse & Keyboard Raw ===
  {
    name: 'browser_mouse',
    description: 'Raw mouse control (down, up, move, wheel)',
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['down', 'up', 'move', 'wheel'], description: 'Mouse action' },
        button: { type: 'string', enum: ['left', 'right', 'middle'], description: 'Mouse button (for down/up)' },
        x: { type: 'number', description: 'X coordinate (for move)' },
        y: { type: 'number', description: 'Y coordinate (for move)' },
        deltaX: { type: 'number', description: 'Horizontal scroll delta (for wheel)' },
        deltaY: { type: 'number', description: 'Vertical scroll delta (for wheel)' },
        selector: { type: 'string', description: 'Element selector (for wheel on element)' },
      },
      required: ['action'],
    },
  },
  {
    name: 'browser_keyboard_raw',
    description: 'Raw keyboard control (keydown, keyup, keyboard shortcut)',
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['down', 'up', 'shortcut'], description: 'Keyboard action' },
        key: { type: 'string', description: 'Key to press (for down/up)' },
        keys: { type: 'string', description: 'Keyboard shortcut e.g. "Control+a" (for shortcut)' },
      },
      required: ['action'],
    },
  },

  // === Network ===
  {
    name: 'browser_network',
    description: 'Network control and monitoring',
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['route', 'unroute', 'requests'], description: 'Network action' },
        url: { type: 'string', description: 'URL pattern (for route/unroute)' },
        filter: { type: 'string', description: 'URL filter pattern (for requests)' },
        clear: { type: 'boolean', description: 'Clear tracked requests (for requests)' },
        abort: { type: 'boolean', description: 'Abort the request (for route)' },
        response: {
          type: 'object',
          properties: {
            status: { type: 'number' },
            body: { type: 'string' },
            contentType: { type: 'string' },
            headers: { type: 'object' },
          },
          description: 'Mock response (for route)',
        },
      },
      required: ['action'],
    },
  },
  {
    name: 'browser_response_body',
    description: 'Get response body for intercepted request',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'Request URL' },
        timeout: { type: 'number', description: 'Timeout in ms' },
      },
      required: ['url'],
    },
  },

  // === Advanced/Debug ===
  {
    name: 'browser_evaluate',
    description: 'Execute JavaScript in the page',
    inputSchema: {
      type: 'object',
      properties: {
        script: { type: 'string', description: 'JavaScript code to execute' },
        args: { type: 'array', items: { type: 'string' }, description: 'Arguments for the script' },
      },
      required: ['script'],
    },
  },
  {
    name: 'browser_set_content',
    description: 'Set page HTML content',
    inputSchema: {
      type: 'object',
      properties: {
        html: { type: 'string', description: 'HTML content to set' },
      },
      required: ['html'],
    },
  },
  {
    name: 'browser_add_script',
    description: 'Add script tag to page',
    inputSchema: {
      type: 'object',
      properties: {
        content: { type: 'string', description: 'Script content' },
        url: { type: 'string', description: 'Script URL' },
      },
    },
  },
  {
    name: 'browser_add_style',
    description: 'Add style tag to page',
    inputSchema: {
      type: 'object',
      properties: {
        content: { type: 'string', description: 'CSS content' },
        url: { type: 'string', description: 'CSS URL' },
      },
    },
  },
  {
    name: 'browser_add_init_script',
    description: 'Add init script (runs on every navigation)',
    inputSchema: {
      type: 'object',
      properties: {
        script: { type: 'string', description: 'Script content' },
      },
      required: ['script'],
    },
  },
  {
    name: 'browser_dispatch_event',
    description: 'Dispatch DOM event',
    inputSchema: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'CSS selector or element ref' },
        event: { type: 'string', description: 'Event name' },
        eventInit: { type: 'object', description: 'Event init properties' },
      },
      required: ['selector', 'event'],
    },
  },

  // === Logs & Debug ===
  {
    name: 'browser_logs',
    description: 'Get console logs or page errors',
    inputSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['console', 'errors'], description: 'Log type' },
        clear: { type: 'boolean', description: 'Clear logs after retrieving' },
      },
      required: ['type'],
    },
  },
  {
    name: 'browser_highlight',
    description: 'Highlight element (for debugging)',
    inputSchema: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'CSS selector or element ref' },
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
        selector: { type: 'string', description: 'CSS selector or element ref' },
      },
      required: ['selector'],
    },
  },

  // === Recording & Tracing ===
  {
    name: 'browser_screencast',
    description: 'Control screencast for streaming',
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['start', 'stop'], description: 'Screencast action' },
        format: { type: 'string', enum: ['jpeg', 'png'], description: 'Image format (for start)' },
        quality: { type: 'number', description: 'JPEG quality 0-100 (for start)' },
        maxWidth: { type: 'number', description: 'Max width (for start)' },
        maxHeight: { type: 'number', description: 'Max height (for start)' },
      },
      required: ['action'],
    },
  },
  {
    name: 'browser_trace',
    description: 'Control Playwright trace',
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['start', 'stop'], description: 'Trace action' },
        screenshots: { type: 'boolean', description: 'Capture screenshots (for start)' },
        snapshots: { type: 'boolean', description: 'Capture snapshots (for start)' },
        path: { type: 'string', description: 'Trace file path (for stop)' },
      },
      required: ['action'],
    },
  },
  {
    name: 'browser_recording',
    description: 'Control screen recording to video',
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['start', 'stop', 'restart'], description: 'Recording action' },
        path: { type: 'string', description: 'Video file path' },
        url: { type: 'string', description: 'Optional URL to navigate to (for start/restart)' },
      },
      required: ['action'],
    },
  },
  {
    name: 'browser_har',
    description: 'Control HAR recording',
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['start', 'stop'], description: 'HAR action' },
        path: { type: 'string', description: 'HAR file path (for stop)' },
      },
      required: ['action'],
    },
  },

  // === Tabs & Windows ===
  {
    name: 'browser_tab',
    description: 'Tab management',
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['list', 'new', 'switch', 'close'], description: 'Tab action' },
        index: { type: 'number', description: 'Tab index 0-based (for switch/close)' },
        url: { type: 'string', description: 'URL to navigate to (for new)' },
      },
      required: ['action'],
    },
  },
  {
    name: 'browser_window',
    description: 'Window management',
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['new', 'bring_to_front'], description: 'Window action' },
        viewportWidth: { type: 'number', description: 'Viewport width (for new)' },
        viewportHeight: { type: 'number', description: 'Viewport height (for new)' },
      },
      required: ['action'],
    },
  },

  // === Frames ===
  {
    name: 'browser_frame',
    description: 'Switch to iframe',
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['switch', 'main'], description: 'Frame action' },
        selector: { type: 'string', description: 'CSS selector for iframe (for switch)' },
        name: { type: 'string', description: 'Frame name (for switch)' },
        url: { type: 'string', description: 'Frame URL (for switch)' },
      },
      required: ['action'],
    },
  },

  // === Other ===
  {
    name: 'browser_pdf',
    description: 'Save page as PDF',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path to save PDF' },
        format: { type: 'string', enum: ['Letter', 'Legal', 'Tabloid', 'Ledger', 'A0', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6'], description: 'Paper format' },
      },
      required: ['path'],
    },
  },
  {
    name: 'browser_download',
    description: 'Trigger and wait for download',
    inputSchema: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'Element selector that triggers download' },
        path: { type: 'string', description: 'Save path' },
      },
      required: ['selector', 'path'],
    },
  },
  {
    name: 'browser_wait',
    description: 'Wait for element or time',
    inputSchema: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'CSS selector to wait for (or wait for time if not provided)' },
        timeout: { type: 'number', description: 'Timeout in ms' },
        state: { type: 'string', enum: ['attached', 'detached', 'visible', 'hidden'], description: 'Element state' },
      },
    },
  },
  {
    name: 'browser_wait_for',
    description: 'Wait for specific conditions',
    inputSchema: {
      type: 'object',
      properties: {
        condition: { type: 'string', enum: ['url', 'load_state', 'function', 'download'], description: 'Wait condition' },
        url: { type: 'string', description: 'URL pattern (for url)' },
        state: { type: 'string', enum: ['load', 'domcontentloaded', 'networkidle'], description: 'Load state (for load_state)' },
        expression: { type: 'string', description: 'JavaScript expression (for function)' },
        path: { type: 'string', description: 'Save path (for download)' },
        timeout: { type: 'number', description: 'Timeout in ms' },
      },
      required: ['condition'],
    },
  },
  {
    name: 'browser_clipboard',
    description: 'Clipboard operations',
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['copy', 'paste', 'read'], description: 'Clipboard action' },
        text: { type: 'string', description: 'Text for copy/paste' },
      },
      required: ['action'],
    },
  },
  {
    name: 'browser_upload',
    description: 'Upload file(s)',
    inputSchema: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'CSS selector or element ref' },
        files: { oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }], description: 'File path(s)' },
      },
      required: ['selector', 'files'],
    },
  },
  {
    name: 'browser_drag',
    description: 'Drag and drop',
    inputSchema: {
      type: 'object',
      properties: {
        source: { type: 'string', description: 'Source element selector' },
        target: { type: 'string', description: 'Target element selector' },
      },
      required: ['source', 'target'],
    },
  },
  {
    name: 'browser_multiselect',
    description: 'Select multiple options from dropdown',
    inputSchema: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'CSS selector or element ref' },
        values: { type: 'array', items: { type: 'string' }, description: 'Values to select' },
      },
      required: ['selector', 'values'],
    },
  },
  {
    name: 'browser_set_value',
    description: 'Set input value directly (without events)',
    inputSchema: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'CSS selector or element ref' },
        value: { type: 'string', description: 'Value to set' },
      },
      required: ['selector', 'value'],
    },
  },

  // iOS specific (keep as is)
  {
    name: 'browser_ios_device_list',
    description: 'List available iOS devices/simulators',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'browser_ios_swipe',
    description: 'Perform swipe gesture on iOS',
    inputSchema: {
      type: 'object',
      properties: {
        direction: { type: 'string', enum: ['up', 'down', 'left', 'right'], description: 'Swipe direction' },
        distance: { type: 'number', description: 'Swipe distance in pixels' },
      },
      required: ['direction'],
    },
  },
];

export default MERGED_TOOLS;
