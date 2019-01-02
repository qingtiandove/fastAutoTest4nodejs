// Type definitions for chrome-remote-interface 0.26.1
// Project: https://github.com/cyrus-and/chrome-remote-interface
// Definitions by: GP <https://github.com/paambaati>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped

export = CDP;

declare function CDP(options?: CDP.ChromeRemoteInterfaceOptions): CDP.Chrome;


declare namespace CDP {
    class Chrome{
        constructor(options:any,notifier:any);
        Runtime:any;
        Input:any;
        DOM:any;
        Page:any;
        CSS:any;

        close(callback?:()=>void):void;
    }
    
    interface ChromeRemoteInterfaceOptions {
        host?: string;
        port?: number;
        secure?: boolean;
        useHostName?: boolean;
        target?: (targets: Target[]) => any | Target | string;
        protocol?: DevtoolsProtocol;
        local?: boolean;
    }
    interface ProtocolOptions {
        host?: string;
        port?: number;
        secure?: boolean;
        useHostName?: boolean;
        local?: boolean;
    }
    interface ListTargetOptions {
        host?: string;
        port?: number;
        secure?: boolean;
        useHostName?: boolean;
    }
    interface NewTargetOptions {
        host?: string;
        port?: number;
        secure?: boolean;
        useHostName?: boolean;
        url?: string;
    }
    interface ActivateTargetOptions {
        host?: string;
        port?: number;
        secure?: boolean;
        useHostName?: boolean;
        url?: string;
        id: string;
    }
    interface CloseTargetOptions extends ActivateTargetOptions { }
    interface VersionOptions {
        host?: string;
        port?: number;
        secure?: boolean;
        useHostName?: boolean;
    }
    type Version = {
        Browser: string;
        'Protocol-Version': string;
        'User-Agent': string;
        'V8-Version': string;
        'Webkit-Version': string;
        webSocketDebuggerUrl: string;
    }
    type Target = {
        description: string;
        devtoolsFrontendUrl: string;
        id: string;
        title: string;
        type: string;
        url: string;
        webSocketDebuggerUrl: string;
    }
    interface DevtoolsProtocol extends Object { }
    export class CDP {
        constructor(options?: CDP.ChromeRemoteInterfaceOptions);
        public Protocol(options?: ProtocolOptions, callback?: ((err: Error, protocol: DevtoolsProtocol) => DevtoolsProtocol)): DevtoolsProtocol;
        public Protocol(options?: ProtocolOptions): Promise<DevtoolsProtocol>;
        public List(options?: ListTargetOptions, callback?: ((err: Error, targets: Target[]) => Target[])): Target[];
        public List(options?: ListTargetOptions): Promise<ListTargetOptions>;
        public New(options?: NewTargetOptions, callback?: ((err: Error, target: Target) => Target)): Target;
        public New(options?: NewTargetOptions): Promise<Target>;
        public Activate(options?: ActivateTargetOptions, callback?: ((err: Error) => void)): void;
        public Activate(options?: ActivateTargetOptions): Promise<void>;
        public Close(options?: CloseTargetOptions, callback?: ((err: Error) => void)): void;
        public Close(options?: CloseTargetOptions): Promise<void>;
        public Version(options?: VersionOptions, callback?: ((err: Error, browserVersion: Version) => void)): Version;
        public Version(options?: VersionOptions): Promise<Version>;
        // TODO: Include Protocol domains and their methods.
    }
}
