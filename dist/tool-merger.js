/**
 * Map merged tool calls to original command actions
 */
/**
 * Convert merged tool call to original command format
 */
export function mapMergedToolToCommand(call) {
    const { name, args } = call;
    switch (name) {
        // Core - no mapping needed
        case 'browser_launch':
            return { action: 'launch', ...args };
        case 'browser_navigate':
            return { action: 'navigate', ...args };
        case 'browser_snapshot':
            return { action: 'snapshot', ...args };
        case 'browser_screenshot':
            return { action: 'screenshot', ...args };
        case 'browser_close':
            return { action: 'close', ...args };
        // History
        case 'browser_history':
            const historyAction = args.action; // back, forward, reload
            return { action: historyAction };
        // Page info
        case 'browser_page_info':
            const pageInfo = args.info; // url, title
            return { action: pageInfo === 'url' ? 'url' : 'title' };
        // Element action
        case 'browser_element_action':
            const elemAction = args.action; // click, dblclick, hover, focus, tap
            const elemCmd = { action: elemAction, selector: args.selector };
            if (args.button !== undefined)
                elemCmd.button = args.button;
            if (args.clickCount !== undefined)
                elemCmd.clickCount = args.clickCount;
            return elemCmd;
        // Input
        case 'browser_input':
            if (args.action === 'fill') {
                return { action: 'fill', selector: args.selector, value: args.value };
            }
            else {
                const typeCmd = { action: 'type', selector: args.selector, text: args.value };
                if (args.delay !== undefined)
                    typeCmd.delay = args.delay;
                return typeCmd;
            }
        // Input action
        case 'browser_input_action':
            return { action: args.action, selector: args.selector };
        // Press
        case 'browser_press':
            const pressCmd = { action: 'press', key: args.key };
            if (args.selector !== undefined)
                pressCmd.selector = args.selector;
            return pressCmd;
        // Scroll
        case 'browser_scroll':
            if (args.action === 'scroll_into_view') {
                return { action: 'scroll_into_view', selector: args.selector };
            }
            else {
                const scrollCmd = { action: 'scroll' };
                if (args.selector !== undefined)
                    scrollCmd.selector = args.selector;
                if (args.direction !== undefined)
                    scrollCmd.direction = args.direction;
                if (args.amount !== undefined)
                    scrollCmd.amount = args.amount;
                if (args.x !== undefined)
                    scrollCmd.x = args.x;
                if (args.y !== undefined)
                    scrollCmd.y = args.y;
                return scrollCmd;
            }
        // Find
        case 'browser_find':
            const method = args.method;
            const findByActionMap = {
                role: 'find_by_role',
                text: 'find_by_text',
                label: 'find_by_label',
                placeholder: 'find_by_placeholder',
                testId: 'find_by_test_id',
                title: 'find_by_title',
                altText: 'find_by_alt_text',
                nth: 'find_nth',
            };
            const findCmd = {
                action: findByActionMap[method],
            };
            if (method === 'nth') {
                findCmd.selector = args.selector;
                findCmd.index = args.index ?? 0;
            }
            else {
                findCmd[args.method === 'testId' ? 'testId' : method === 'altText' ? 'text' : method] = args.value;
                if (args.exact !== undefined)
                    findCmd.exact = args.exact;
            }
            if (args.action !== undefined) {
                findCmd.action = args.action; // click, hover, fill, check
                if (args.action === 'fill' && args.fillValue !== undefined) {
                    findCmd.value = args.fillValue;
                }
            }
            return findCmd;
        // Get
        case 'browser_get':
            const prop = args.property;
            const getActionMap = {
                text: 'get_text',
                innerText: 'get_inner_text',
                innerHtml: 'get_inner_html',
                html: 'content',
                value: 'get_value',
                attribute: 'get_attribute',
                boundingBox: 'bounding_box',
                count: 'count',
            };
            const getCmd = {
                action: getActionMap[prop],
                selector: args.selector,
            };
            if (prop === 'attribute')
                getCmd.attribute = args.attribute;
            return getCmd;
        // Check state
        case 'browser_check_state':
            const stateActionMap = {
                visible: 'is_visible',
                enabled: 'is_enabled',
                checked: 'is_checked',
            };
            return { action: stateActionMap[args.state], selector: args.selector };
        // Storage
        case 'browser_storage':
            const storageActionMap = {
                get: 'get',
                set: 'set',
                clear: 'clear',
            };
            const storageCmd = {
                action: storageActionMap[args.action],
                type: args.type,
            };
            if (args.key !== undefined)
                storageCmd.key = args.key;
            if (args.value !== undefined)
                storageCmd.value = args.value;
            return storageCmd;
        // Cookies
        case 'browser_cookies':
            if (args.action === 'get') {
                const getCookieCmd = { action: 'get' };
                if (args.urls !== undefined)
                    getCookieCmd.urls = args.urls;
                return getCookieCmd;
            }
            else {
                return { action: 'set', cookies: args.cookies };
            }
        // State
        case 'browser_state':
            return { action: args.action === 'save' ? 'state_save' : 'state_load', path: args.path };
        // Set context
        case 'browser_set_context':
            const setting = args.setting;
            const contextCmd = {};
            switch (setting) {
                case 'device':
                    contextCmd.action = 'set_device';
                    contextCmd.device = args.device;
                    break;
                case 'viewport':
                    contextCmd.action = 'set_viewport';
                    contextCmd.width = args.width;
                    contextCmd.height = args.height;
                    break;
                case 'geolocation':
                    contextCmd.action = 'set_geolocation';
                    contextCmd.latitude = args.latitude;
                    contextCmd.longitude = args.longitude;
                    if (args.accuracy !== undefined)
                        contextCmd.accuracy = args.accuracy;
                    break;
                case 'locale':
                    contextCmd.action = 'set_locale';
                    contextCmd.locale = args.locale;
                    break;
                case 'timezone':
                    contextCmd.action = 'set_timezone';
                    contextCmd.timezone = args.timezone;
                    break;
                case 'offline':
                    contextCmd.action = 'set_offline';
                    contextCmd.offline = args.offline;
                    break;
                case 'media':
                    contextCmd.action = 'emulate_media';
                    if (args.media !== undefined)
                        contextCmd.media = args.media;
                    if (args.colorScheme !== undefined)
                        contextCmd.colorScheme = args.colorScheme;
                    if (args.reducedMotion !== undefined)
                        contextCmd.reducedMotion = args.reducedMotion;
                    break;
                case 'headers':
                    contextCmd.action = 'set_headers';
                    contextCmd.headers = args.headers;
                    break;
                case 'credentials':
                    contextCmd.action = 'set_credentials';
                    contextCmd.username = args.username;
                    contextCmd.password = args.password;
                    break;
            }
            return contextCmd;
        // Dialog
        case 'browser_dialog':
            const dialogCmd = { action: args.action === 'accept' ? 'dialog_accept' : 'dialog_dismiss' };
            if (args.promptText !== undefined)
                dialogCmd.promptText = args.promptText;
            return dialogCmd;
        // Mouse
        case 'browser_mouse':
            const mouseCmd = { action: args.action === 'down' ? 'mouse_down' : args.action === 'up' ? 'mouse_up' : args.action === 'move' ? 'mouse_move' : 'wheel' };
            if (args.button !== undefined)
                mouseCmd.button = args.button;
            if (args.x !== undefined)
                mouseCmd.x = args.x;
            if (args.y !== undefined)
                mouseCmd.y = args.y;
            if (args.deltaX !== undefined)
                mouseCmd.deltaX = args.deltaX;
            if (args.deltaY !== undefined)
                mouseCmd.deltaY = args.deltaY;
            if (args.selector !== undefined)
                mouseCmd.selector = args.selector;
            return mouseCmd;
        // Keyboard raw
        case 'browser_keyboard_raw':
            if (args.action === 'shortcut') {
                return { action: 'keyboard', keys: args.keys };
            }
            else {
                const keyCmd = { action: args.action === 'down' ? 'key_down' : 'key_up', key: args.key };
                return keyCmd;
            }
        // Network
        case 'browser_network':
            if (args.action === 'requests') {
                const reqCmd = { action: 'requests' };
                if (args.filter !== undefined)
                    reqCmd.filter = args.filter;
                if (args.clear !== undefined)
                    reqCmd.clear = args.clear;
                return reqCmd;
            }
            else if (args.action === 'route') {
                const routeCmd = { action: 'route', url: args.url };
                if (args.abort !== undefined)
                    routeCmd.abort = args.abort;
                if (args.response !== undefined)
                    routeCmd.response = args.response;
                return routeCmd;
            }
            else {
                return { action: 'unroute', url: args.url };
            }
        // Response body
        case 'browser_response_body':
            const respCmd = { action: 'response_body', url: args.url };
            if (args.timeout !== undefined)
                respCmd.timeout = args.timeout;
            return respCmd;
        // Evaluate
        case 'browser_evaluate':
            const evalCmd = { action: 'evaluate', script: args.script };
            if (args.args !== undefined)
                evalCmd.args = args.args;
            return evalCmd;
        // Set content
        case 'browser_set_content':
            return { action: 'set_content', html: args.html };
        // Add script/style
        case 'browser_add_script':
            return { action: 'add_script', ...args };
        case 'browser_add_style':
            return { action: 'add_style', ...args };
        case 'browser_add_init_script':
            return { action: 'add_init_script', script: args.script };
        // Dispatch event
        case 'browser_dispatch_event':
            const eventCmd = { action: 'dispatch_event', selector: args.selector, event: args.event };
            if (args.eventInit !== undefined)
                eventCmd.eventInit = args.eventInit;
            return eventCmd;
        // Logs
        case 'browser_logs':
            return { action: args.type, clear: args.clear };
        // Highlight
        case 'browser_highlight':
            return { action: 'highlight', selector: args.selector };
        // Styles
        case 'browser_styles':
            return { action: 'styles', selector: args.selector };
        // Screencast
        case 'browser_screencast':
            const screencastCmd = { action: args.action === 'start' ? 'screencast_start' : 'screencast_stop' };
            if (args.format !== undefined)
                screencastCmd.format = args.format;
            if (args.quality !== undefined)
                screencastCmd.quality = args.quality;
            if (args.maxWidth !== undefined)
                screencastCmd.maxWidth = args.maxWidth;
            if (args.maxHeight !== undefined)
                screencastCmd.maxHeight = args.maxHeight;
            return screencastCmd;
        // Trace
        case 'browser_trace':
            const traceCmd = { action: args.action === 'start' ? 'trace_start' : 'trace_stop' };
            if (args.action === 'start') {
                if (args.screenshots !== undefined)
                    traceCmd.screenshots = args.screenshots;
                if (args.snapshots !== undefined)
                    traceCmd.snapshots = args.snapshots;
            }
            else {
                traceCmd.path = args.path;
            }
            return traceCmd;
        // Recording
        case 'browser_recording':
            const recAction = args.action === 'start' ? 'recording_start' : args.action === 'stop' ? 'recording_stop' : 'recording_restart';
            const recCmd = { action: recAction };
            if (args.path !== undefined)
                recCmd.path = args.path;
            if (args.url !== undefined)
                recCmd.url = args.url;
            return recCmd;
        // HAR
        case 'browser_har':
            const harCmd = { action: args.action === 'start' ? 'har_start' : 'har_stop' };
            if (args.action === 'stop')
                harCmd.path = args.path;
            return harCmd;
        // Tab
        case 'browser_tab':
            const tabCmd = { action: `tab_${args.action}` };
            if (args.index !== undefined)
                tabCmd.index = args.index;
            if (args.url !== undefined)
                tabCmd.url = args.url;
            return tabCmd;
        // Window
        case 'browser_window':
            if (args.action === 'new') {
                const winCmd = { action: 'window_new' };
                if (args.viewportWidth !== undefined || args.viewportHeight !== undefined) {
                    winCmd.viewport = {};
                    if (args.viewportWidth !== undefined)
                        winCmd.viewport.width = args.viewportWidth;
                    if (args.viewportHeight !== undefined)
                        winCmd.viewport.height = args.viewportHeight;
                }
                return winCmd;
            }
            else {
                return { action: 'bring_to_front' };
            }
        // Frame
        case 'browser_frame':
            if (args.action === 'main') {
                return { action: 'main_frame' };
            }
            else {
                const frameCmd = { action: 'frame' };
                if (args.selector !== undefined)
                    frameCmd.selector = args.selector;
                if (args.name !== undefined)
                    frameCmd.name = args.name;
                if (args.url !== undefined)
                    frameCmd.url = args.url;
                return frameCmd;
            }
        // PDF
        case 'browser_pdf':
            const pdfCmd = { action: 'pdf', path: args.path };
            if (args.format !== undefined)
                pdfCmd.format = args.format;
            return pdfCmd;
        // Download
        case 'browser_download':
            return { action: 'download', selector: args.selector, path: args.path };
        // Wait
        case 'browser_wait':
            const waitCmd = { action: 'wait' };
            if (args.selector !== undefined)
                waitCmd.selector = args.selector;
            if (args.timeout !== undefined)
                waitCmd.timeout = args.timeout;
            if (args.state !== undefined)
                waitCmd.state = args.state;
            return waitCmd;
        // Wait for
        case 'browser_wait_for':
            const waitForActionMap = {
                url: 'wait_for_url',
                load_state: 'wait_for_load_state',
                function: 'wait_for_function',
                download: 'wait_for_download',
            };
            const waitForCmd = { action: waitForActionMap[args.condition] };
            if (args.url !== undefined)
                waitForCmd.url = args.url;
            if (args.state !== undefined)
                waitForCmd.state = args.state;
            if (args.expression !== undefined)
                waitForCmd.expression = args.expression;
            if (args.path !== undefined)
                waitForCmd.path = args.path;
            if (args.timeout !== undefined)
                waitForCmd.timeout = args.timeout;
            return waitForCmd;
        // Clipboard
        case 'browser_clipboard':
            const clipCmd = { action: 'clipboard', operation: args.action };
            if (args.text !== undefined)
                clipCmd.text = args.text;
            return clipCmd;
        // Upload
        case 'browser_upload':
            return { action: 'upload', selector: args.selector, files: args.files };
        // Drag
        case 'browser_drag':
            return { action: 'drag', source: args.source, target: args.target };
        // Select (keep as is)
        case 'browser_select':
            return { action: 'select', selector: args.selector, values: args.values };
        // Multiselect (keep as is)
        case 'browser_multiselect':
            return { action: 'multiselect', selector: args.selector, values: args.values };
        // Set value (keep as is)
        case 'browser_set_value':
            return { action: 'set_value', selector: args.selector, value: args.value };
        // iOS
        case 'browser_ios_device_list':
            return { action: 'device_list' };
        case 'browser_ios_swipe':
            const swipeCmd = { action: 'swipe', direction: args.direction };
            if (args.distance !== undefined)
                swipeCmd.distance = args.distance;
            return swipeCmd;
        default:
            throw new Error(`Unknown merged tool: ${name}`);
    }
}
//# sourceMappingURL=tool-merger.js.map