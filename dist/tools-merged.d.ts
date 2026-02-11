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
export declare const MERGED_TOOLS: Tool[];
export default MERGED_TOOLS;
//# sourceMappingURL=tools-merged.d.ts.map