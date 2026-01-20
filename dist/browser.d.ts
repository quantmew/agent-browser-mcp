import { devices, type Browser, type Page, type Frame, type Locator, type CDPSession } from 'playwright-core';
import type { LaunchCommand } from './types.js';
import { type RefMap, type EnhancedSnapshot } from './snapshot.js';
export interface ScreencastFrame {
    data: string;
    metadata: {
        offsetTop: number;
        pageScaleFactor: number;
        deviceWidth: number;
        deviceHeight: number;
        scrollOffsetX: number;
        scrollOffsetY: number;
        timestamp?: number;
    };
    sessionId: number;
}
export interface ScreencastOptions {
    format?: 'jpeg' | 'png';
    quality?: number;
    maxWidth?: number;
    maxHeight?: number;
    everyNthFrame?: number;
}
interface TrackedRequest {
    url: string;
    method: string;
    headers: Record<string, string>;
    timestamp: number;
    resourceType: string;
}
interface ConsoleMessage {
    type: string;
    text: string;
    timestamp: number;
}
interface PageError {
    message: string;
    timestamp: number;
}
/**
 * Manages the Playwright browser lifecycle with multiple tabs/windows
 */
export declare class BrowserManager {
    private browser;
    private cdpPort;
    private isPersistentContext;
    private contexts;
    private pages;
    private activePageIndex;
    private activeFrame;
    private dialogHandler;
    private trackedRequests;
    private routes;
    private consoleMessages;
    private pageErrors;
    private isRecordingHar;
    private refMap;
    private lastSnapshot;
    private scopedHeaderRoutes;
    private cdpSession;
    private screencastActive;
    private screencastSessionId;
    private frameCallback;
    private screencastFrameHandler;
    private recordingContext;
    private recordingPage;
    private recordingOutputPath;
    private recordingTempDir;
    /**
     * Check if browser is launched
     */
    isLaunched(): boolean;
    /**
     * Get enhanced snapshot with refs and cache the ref map
     */
    getSnapshot(options?: {
        interactive?: boolean;
        maxDepth?: number;
        compact?: boolean;
        selector?: string;
    }): Promise<EnhancedSnapshot>;
    /**
     * Get the cached ref map from last snapshot
     */
    getRefMap(): RefMap;
    /**
     * Get a locator from a ref (e.g., "e1", "@e1", "ref=e1")
     * Returns null if ref doesn't exist or is invalid
     */
    getLocatorFromRef(refArg: string): Locator | null;
    /**
     * Check if a selector looks like a ref
     */
    isRef(selector: string): boolean;
    /**
     * Get locator - supports both refs and regular selectors
     */
    getLocator(selectorOrRef: string): Locator;
    /**
     * Get the current active page, throws if not launched
     */
    getPage(): Page;
    /**
     * Get the current frame (or page's main frame if no frame is selected)
     */
    getFrame(): Frame;
    /**
     * Switch to a frame by selector, name, or URL
     */
    switchToFrame(options: {
        selector?: string;
        name?: string;
        url?: string;
    }): Promise<void>;
    /**
     * Switch back to main frame
     */
    switchToMainFrame(): void;
    /**
     * Set up dialog handler
     */
    setDialogHandler(response: 'accept' | 'dismiss', promptText?: string): void;
    /**
     * Clear dialog handler
     */
    clearDialogHandler(): void;
    /**
     * Start tracking requests
     */
    startRequestTracking(): void;
    /**
     * Get tracked requests
     */
    getRequests(filter?: string): TrackedRequest[];
    /**
     * Clear tracked requests
     */
    clearRequests(): void;
    /**
     * Add a route to intercept requests
     */
    addRoute(url: string, options: {
        response?: {
            status?: number;
            body?: string;
            contentType?: string;
            headers?: Record<string, string>;
        };
        abort?: boolean;
    }): Promise<void>;
    /**
     * Remove a route
     */
    removeRoute(url?: string): Promise<void>;
    /**
     * Set geolocation
     */
    setGeolocation(latitude: number, longitude: number, accuracy?: number): Promise<void>;
    /**
     * Set permissions
     */
    setPermissions(permissions: string[], grant: boolean): Promise<void>;
    /**
     * Set viewport
     */
    setViewport(width: number, height: number): Promise<void>;
    /**
     * Get device descriptor
     */
    getDevice(deviceName: string): (typeof devices)[keyof typeof devices] | undefined;
    /**
     * List available devices
     */
    listDevices(): string[];
    /**
     * Start console message tracking
     */
    startConsoleTracking(): void;
    /**
     * Get console messages
     */
    getConsoleMessages(): ConsoleMessage[];
    /**
     * Clear console messages
     */
    clearConsoleMessages(): void;
    /**
     * Start error tracking
     */
    startErrorTracking(): void;
    /**
     * Get page errors
     */
    getPageErrors(): PageError[];
    /**
     * Clear page errors
     */
    clearPageErrors(): void;
    /**
     * Start HAR recording
     */
    startHarRecording(): Promise<void>;
    /**
     * Check if HAR recording
     */
    isHarRecording(): boolean;
    /**
     * Set offline mode
     */
    setOffline(offline: boolean): Promise<void>;
    /**
     * Set extra HTTP headers (global - all requests)
     */
    setExtraHeaders(headers: Record<string, string>): Promise<void>;
    /**
     * Set scoped HTTP headers (only for requests matching the origin)
     * Uses route interception to add headers only to matching requests
     */
    setScopedHeaders(origin: string, headers: Record<string, string>): Promise<void>;
    /**
     * Clear scoped headers for an origin (or all if no origin specified)
     */
    clearScopedHeaders(origin?: string): Promise<void>;
    /**
     * Start tracing
     */
    startTracing(options: {
        screenshots?: boolean;
        snapshots?: boolean;
    }): Promise<void>;
    /**
     * Stop tracing and save
     */
    stopTracing(path: string): Promise<void>;
    /**
     * Save storage state (cookies, localStorage, etc.)
     */
    saveStorageState(path: string): Promise<void>;
    /**
     * Get all pages
     */
    getPages(): Page[];
    /**
     * Get current page index
     */
    getActiveIndex(): number;
    /**
     * Get the current browser instance
     */
    getBrowser(): Browser | null;
    /**
     * Check if an existing CDP connection is still alive
     * by verifying we can access browser contexts and that at least one has pages
     */
    private isCdpConnectionAlive;
    /**
     * Check if CDP connection needs to be re-established
     */
    private needsCdpReconnect;
    /**
     * Launch the browser with the specified options
     * If already launched, this is a no-op (browser stays open)
     */
    launch(options: LaunchCommand): Promise<void>;
    /**
     * Connect to a running browser via CDP (Chrome DevTools Protocol)
     */
    private connectViaCDP;
    /**
     * Set up console, error, and close tracking for a page
     */
    private setupPageTracking;
    /**
     * Set up tracking for new pages in a context (for CDP connections)
     */
    private setupContextTracking;
    /**
     * Create a new tab in the current context
     */
    newTab(): Promise<{
        index: number;
        total: number;
    }>;
    /**
     * Create a new window (new context)
     */
    newWindow(viewport?: {
        width: number;
        height: number;
    }): Promise<{
        index: number;
        total: number;
    }>;
    /**
     * Invalidate the current CDP session (must be called before switching pages)
     * This ensures screencast and input injection work correctly after tab switch
     */
    private invalidateCDPSession;
    /**
     * Switch to a specific tab/page by index
     */
    switchTo(index: number): Promise<{
        index: number;
        url: string;
        title: string;
    }>;
    /**
     * Close a specific tab/page
     */
    closeTab(index?: number): Promise<{
        closed: number;
        remaining: number;
    }>;
    /**
     * List all tabs with their info
     */
    listTabs(): Promise<Array<{
        index: number;
        url: string;
        title: string;
        active: boolean;
    }>>;
    /**
     * Get or create a CDP session for the current page
     * Only works with Chromium-based browsers
     */
    getCDPSession(): Promise<CDPSession>;
    /**
     * Check if screencast is currently active
     */
    isScreencasting(): boolean;
    /**
     * Start screencast - streams viewport frames via CDP
     * @param callback Function called for each frame
     * @param options Screencast options
     */
    startScreencast(callback: (frame: ScreencastFrame) => void, options?: ScreencastOptions): Promise<void>;
    /**
     * Stop screencast
     */
    stopScreencast(): Promise<void>;
    /**
     * Inject a mouse event via CDP
     */
    injectMouseEvent(params: {
        type: 'mousePressed' | 'mouseReleased' | 'mouseMoved' | 'mouseWheel';
        x: number;
        y: number;
        button?: 'left' | 'right' | 'middle' | 'none';
        clickCount?: number;
        deltaX?: number;
        deltaY?: number;
        modifiers?: number;
    }): Promise<void>;
    /**
     * Inject a keyboard event via CDP
     */
    injectKeyboardEvent(params: {
        type: 'keyDown' | 'keyUp' | 'char';
        key?: string;
        code?: string;
        text?: string;
        modifiers?: number;
    }): Promise<void>;
    /**
     * Inject touch event via CDP (for mobile emulation)
     */
    injectTouchEvent(params: {
        type: 'touchStart' | 'touchEnd' | 'touchMove' | 'touchCancel';
        touchPoints: Array<{
            x: number;
            y: number;
            id?: number;
        }>;
        modifiers?: number;
    }): Promise<void>;
    /**
     * Check if video recording is currently active
     */
    isRecording(): boolean;
    /**
     * Start recording to a video file using Playwright's native video recording.
     * Creates a fresh browser context with video recording enabled.
     * Automatically captures current URL and transfers cookies/storage if no URL provided.
     *
     * @param outputPath - Path to the output video file (will be .webm)
     * @param url - Optional URL to navigate to (defaults to current page URL)
     */
    startRecording(outputPath: string, url?: string): Promise<void>;
    /**
     * Stop recording and save the video file
     * @returns Recording result with path
     */
    stopRecording(): Promise<{
        path: string;
        frames: number;
        error?: string;
    }>;
    /**
     * Restart recording - stops current recording (if any) and starts a new one.
     * Convenience method that combines stopRecording and startRecording.
     *
     * @param outputPath - Path to the output video file (must be .webm)
     * @param url - Optional URL to navigate to (defaults to current page URL)
     * @returns Result from stopping the previous recording (if any)
     */
    restartRecording(outputPath: string, url?: string): Promise<{
        previousPath?: string;
        stopped: boolean;
    }>;
    /**
     * Close the browser and clean up
     */
    close(): Promise<void>;
}
export {};
//# sourceMappingURL=browser.d.ts.map