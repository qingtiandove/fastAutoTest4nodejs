"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CDP = require("chrome-remote-interface");
const appium_adb_1 = require("appium-adb");
const fs = require("fs");
const path = require("path");
const error_1 = require("../utils/error");
const logger_1 = require("../utils/logger");
const adbHelper_1 = require("../utils/adbHelper");
const webviewELement_1 = require("./webviewELement");
// todo  点击打开文件操作，或者其他操作
class WebviewDriver {
    constructor() {
    }
    async initDriver(options) {
        try {
            if (!options.device) {
                const adbhelpOwn = await appium_adb_1.ADB.createADB();
                const deviceList = await adbhelpOwn.getConnectedDevices();
                options.device = deviceList[0].udid;
            }
            if (!options.port) {
                options.port = 9223;
            }
            this.device = options.device;
            this.adbHelper = new adbHelper_1.AdbHelper(this.device, options.port);
            await this.adbHelper.initWebviewDevToolsRemote();
            await this.initClient(options);
            // todo  adb连接的初始化，多设备情况下，设置目标设备
            this.adb = await appium_adb_1.ADB.createADB();
            // 为了中文输入，安装一个插件
            const isInstall = await this.adb.isAppInstalled('com.tencent.fat.wxinputplug');
            if (!isInstall) {
                const PLUG_SRC = path.resolve(__dirname, "./apk/inputPlug.apk");
                await this.adb.install(PLUG_SRC);
            }
        }
        catch (err) {
            throw err;
        }
    }
    async initClient(options) {
        logger_1.logger.info("初始化远程调试--initClient");
        try {
            this.client = await CDP({ local: true, port: options.port || 9223, target: options.target });
            const { Runtime, Input, DOM, Page, CSS } = this.client;
            this.Runtime = Runtime;
            this.Page = Page;
            this.Input = Input;
            this.DOM = DOM;
            this.CSS = CSS;
            //  初始化，dom
            const res = await this.DOM.getDocument();
            this.documentURL = res.root.documentURL;
        }
        catch (err) {
            throw err;
        }
    }
    async getDocumentURL() {
        logger_1.logger.info(`获取DocumentURL`);
        return this.documentURL;
    }
    async getPageSource() {
        logger_1.logger.info(`获取页面的OuterHTML`);
        try {
            const res = await this.DOM.getOuterHTML({ nodeId: 1 });
            return res.outerHTML;
        }
        catch (err) {
            throw err;
        }
    }
    async isElementExist(xpath) {
        logger_1.logger.info(`元素是否存在-->xpath:${xpath}`);
        try {
            const script = `var xpath ='${xpath}';xpath_obj = document.evaluate(xpath,document,null, XPathResult.ANY_TYPE, null);var button = xpath_obj.iterateNext();button;`;
            const res = await this.Runtime.evaluate({ expression: script });
            return res.result.subtype !== "null";
        }
        catch (err) {
            throw err;
        }
    }
    async clickElementByXpath(xpath, visibleItemXpath, byUiAutomayor = false) {
        logger_1.logger.info(`点击元素-->xpath:${xpath}`);
        try {
            const isExist = await this.isElementExist(xpath);
            if (!isExist) {
                throw new error_1.ElementNotFoundError('元素未找到');
            }
            else {
                await this.Runtime.evaluate({ expression: "button.click()" });
            }
        }
        catch (err) {
            throw err;
        }
    }
    async getBodyHtml() {
        logger_1.logger.info("获取webview的全部html");
        try {
            const script = `document.body.outerHTML`;
            const res = await this.Runtime.evaluate({ expression: script });
            return res.result.value;
        }
        catch (err) {
            throw err;
        }
    }
    static async sleep(milliseconds = 100) {
        logger_1.logger.info(`等待${milliseconds}毫秒继续`);
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve();
            }, milliseconds);
        });
    }
    async pageBack() {
        logger_1.logger.info("页面退回");
        try {
            const script = `window.history.back();`;
            const res = await this.Runtime.evaluate({ expression: script });
        }
        catch (err) {
            throw err;
        }
    }
    async pageFresh() {
        logger_1.logger.info("页面刷新");
        try {
            const script = `location.reload();`;
            const res = await this.Runtime.evaluate({ expression: script });
        }
        catch (err) {
            throw err;
        }
    }
    // 当输入框，具有输入焦点的时候，可用来输入文本，搜索框，可模拟点击搜索按钮
    async inputByBroadcast(text, search = false) {
        logger_1.logger.info(`输入法输入文本：${text},点击搜索：${search}`);
        try {
            await this.Input.dispatchKeyEvent({
                type: "char",
                text,
            });
            if (search) {
                await adbHelper_1.AdbHelper.touchSearchByKeyEvent();
            }
        }
        catch (err) {
            throw err;
        }
    }
    // 通过更改输入框的value，直接输入文本，速度快，适用范围窄
    async inputByChangeInputValue(xpath, text) {
        logger_1.logger.info(`更改输入框value-->xpath:${xpath},文本:${text}`);
        try {
            const isExist = await this.isElementExist(xpath);
            if (!isExist) {
                throw new error_1.ElementNotFoundError('元素未找到');
            }
            else {
                await this.Runtime.evaluate({ expression: `button.setAttribute('value','${text}')` });
            }
        }
        catch (err) {
            throw err;
        }
    }
    async clickFirstElementByText(text) {
        logger_1.logger.info(`点击目标文本-->文本:${text}`);
        try {
            const xpath = `.//*[text()='${text}']`;
            await this.clickElementByXpath(xpath);
        }
        catch (err) {
            throw err;
        }
    }
    async scrollToElementByXpath(xpath, speed = 600) {
        logger_1.logger.info(`滚动元素至屏幕-->xpath:${xpath},speed:${speed}`);
        try {
            const script = `
            var xpath ='${xpath}';
            xpath_obj = document.evaluate(xpath,document,null, XPathResult.ANY_TYPE, null);var button = xpath_obj.iterateNext();
            var boundFat=button.getBoundingClientRect();
            var resFat={};
            
            resFat.x=Math.round(document.documentElement.clientWidth/2);
            resFat.y=Math.round(document.documentElement.clientHeight/2);
            resFat.yDis=Math.round(resFat.y-(boundFat.top+boundFat.bottom)/2);
            resFat.xDis=Math.round(resFat.x-(boundFat.left+boundFat.right)/2);
            var resFatStr=JSON.stringify(resFat);
            resFatStr;
            `;
            const res = await this.Runtime.evaluate({ expression: script, returnByValue: false });
            const resFat = JSON.parse(res.result.value);
            await this.Input.synthesizeScrollGesture({
                yDistance: resFat.yDis,
                xDistance: resFat.xDis,
                speed,
                y: resFat.y,
                x: resFat.x,
                type: 'mouseWheel',
            });
        }
        catch (err) {
            throw err;
        }
    }
    async takeWebviewScreenshot(screenFilePath) {
        // todo ,websocket,发送截屏命令之后，无反应，卡住，待解决
        logger_1.logger.info(`webview页面截屏-->screenFilePath:${screenFilePath}`);
        try {
            await this.Page.enable();
            const base64Img = (await this.Page.captureScreenshot()).result.data;
            const eImgBase64 = base64Img.replace(/^data:image\/\w+;base64,/, "");
            const imgBuffer = new Buffer(eImgBase64, 'base64');
            fs.writeFile(`search.png`, imgBuffer, (err) => {
                if (err) {
                    throw err;
                }
                else {
                    console.log("保存屏幕截图成功");
                }
            });
        }
        catch (err) {
            throw err;
        }
    }
    async getTitle() {
        logger_1.logger.info("获取页面title");
        try {
            const script = `document.title;`;
            const res = await this.Runtime.evaluate({ expression: script });
            return res.result.value;
        }
        catch (err) {
            throw err;
        }
    }
    async closeClient() {
        logger_1.logger.info("关闭远程调试");
        try {
            if (this.client) {
                await this.client.close();
            }
        }
        catch (err) {
            throw err;
        }
    }
    async findElement(query) {
        logger_1.logger.info(`根据各种定位方式，获取单个元素-->query:${query}`);
        try {
            return (await this.findElements(query))[0];
        }
        catch (err) {
            throw err;
        }
    }
    getThis() {
        return this;
    }
    async findElements(query) {
        const a = new webviewELement_1.WebviewELement(23, this);
        logger_1.logger.info(`根据各种定位方式，获取多个元素-->query:${query}`);
        try {
            const res = await this.DOM.performSearch({ query });
            if (res.resultCount === 0) {
                throw new error_1.ElementNotFoundError('元素未找到');
            }
            else {
                const params = {
                    searchId: res.searchId,
                    fromIndex: 0,
                    toIndex: res.resultCount,
                };
                const nodeIdLists = (await this.DOM.getSearchResults(params)).nodeIds;
                const webviewElemwnts = nodeIdLists.map((item) => {
                    const res = new webviewELement_1.WebviewELement(item, this);
                    return res;
                });
                return webviewElemwnts;
            }
        }
        catch (err) {
            throw err;
        }
    }
}
exports.WebviewDriver = WebviewDriver;
