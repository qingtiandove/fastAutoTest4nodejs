import { Chrome, Target } from 'chrome-remote-interface';
import { ADB } from 'appium-adb';
import { AdbHelper } from "../utils/adbHelper";
interface WebviewDriverOptions {
    device?: string;
    port?: number;
    target: (targets: Target[]) => any | Target | string;
}
export declare class WebviewDriver {
    device: string;
    adbHelper: AdbHelper;
    adb: ADB;
    client: Chrome;
    documentURL: string;
    Runtime: any;
    Page: any;
    Input: any;
    DOM: any;
    CSS: any;
    constructor();
    initDriver(options: WebviewDriverOptions): Promise<void>;
    initClient(options: WebviewDriverOptions): Promise<void>;
    getDocumentURL(): Promise<string>;
    getPageSource(): Promise<any>;
    isElementExist(xpath: string): Promise<boolean>;
    clickElementByXpath(xpath: string, visibleItemXpath?: boolean, byUiAutomayor?: boolean): Promise<void>;
    getBodyHtml(): Promise<any>;
    static sleep(milliseconds?: number): Promise<{}>;
    pageBack(): Promise<void>;
    pageFresh(): Promise<void>;
    inputByBroadcast(text: string, search?: boolean): Promise<void>;
    inputByChangeInputValue(xpath: string, text: string): Promise<void>;
    clickFirstElementByText(text: string): Promise<void>;
    scrollToElementByXpath(xpath: String, speed?: number): Promise<void>;
    takeWebviewScreenshot(screenFilePath: string): Promise<void>;
    getTitle(): Promise<any>;
    closeClient(): Promise<void>;
    findElement(query: string): Promise<any>;
    getThis(): this;
    findElements(query: string): Promise<any>;
}
export {};
