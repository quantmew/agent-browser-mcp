/**
 * Map merged tool calls to original command actions
 */
export interface MergedToolCall {
    name: string;
    args: Record<string, any>;
}
export interface OriginalCommand {
    action: string;
    [key: string]: any;
}
/**
 * Convert merged tool call to original command format
 */
export declare function mapMergedToolToCommand(call: MergedToolCall): OriginalCommand;
//# sourceMappingURL=tool-merger.d.ts.map