export declare class AdbHelper {
    device: string;
    localForWardPort: number;
    constructor(device: string, localForWardPort?: number);
    static touchSearchByKeyEvent(): Promise<{}>;
    initWebviewDevToolsRemote(): Promise<void>;
    static fetchWeixinToolsProcessPid(): Promise<string>;
    static startWebviewDevToolsRemote(localPort: number, pid: string): Promise<{}>;
}
