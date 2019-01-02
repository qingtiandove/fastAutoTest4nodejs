import { WebviewDriver } from "./webviewDriver";
interface ArrrDict {
    [key: string]: string;
}
export declare class WebviewELement {
    nodeId: number;
    webviewDriver: WebviewDriver;
    constructor(nodeId: number, webviewDriver: WebviewDriver);
    getDriver(): Promise<WebviewDriver>;
    getNodeId(): Promise<number>;
    getRect(): Promise<void>;
    click(): Promise<void>;
    getTagName(): Promise<void>;
    getComputedStyle(): Promise<any>;
    clear(): Promise<void>;
    getOuterHTML(): Promise<any>;
    getAttributesDict(): Promise<ArrrDict>;
    getAttributeValue(attr: string): Promise<string>;
}
export {};
