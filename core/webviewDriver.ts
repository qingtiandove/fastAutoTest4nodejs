import * as CDP from 'chrome-remote-interface';
import {Chrome,Target} from 'chrome-remote-interface';
import {ADB} from 'appium-adb';

import * as fs from 'fs';
import * as path from 'path';

import {ElementNotFoundError} from '../utils/error';
import {logger} from "../utils/logger";
import {AdbHelper} from "../utils/adbHelper";
import {WebviewELement} from "./webviewELement";


// TODO  1.暂时不考虑webview内部的iframe的嵌套问题，遇到再处理
// TODO  2.点击的实现方式，
//         fat官方是获取元素中心点在屏幕的位置（不在视野内，先滚动至视野内），然后触发位置点击，优点拟人化，适用性广，缺点慢
//         node实现，获取元素，触发元素的点击事件，优点，快，缺点适用范围窄
// todo  3.关于虚拟机的支持，延后，待真机测试成功之后，进行

// todo 关于websocket中，事件类型的捕获，触发事件，会收到message；如何区分，如何响应

// todo 筛选webview-debuggerURL的方式，需要优化，或者实现可定制化
// todo  todo   执行Dom操作，必须先获取 DOM.getDocument
// todo  DOM.describeNode   没有相关方法

// todo 对于依赖的 appium-adb，chrome-remote-interface；其中.d.ts文件是生成的，但是需要自己手动修改


interface WebviewDriverOptions {
    device?:string;
    port?:number;
    target:(targets: Target[]) => any | Target | string;

}


// todo  点击打开文件操作，或者其他操作
export class WebviewDriver {
    device:string;
    adbHelper:AdbHelper;
    adb:ADB;
    client:Chrome;
    documentURL:string;

    Runtime:any;
    Page:any;
    Input:any;
    DOM:any;
    CSS:any;

    constructor(){
    }

    async initDriver(options:WebviewDriverOptions){
        try{
            if(!options.device){
                const adbhelpOwn=await ADB.createADB();
                const deviceList=await adbhelpOwn.getConnectedDevices();

                options.device=deviceList[0].udid;
            }
            if(!options.port){
                options.port=9223;
            }
            this.device=options.device;
            this.adbHelper=new AdbHelper(this.device,options.port);
            await this.adbHelper.initWebviewDevToolsRemote();
            await this.initClient(options);
            // todo  adb连接的初始化，多设备情况下，设置目标设备
            this.adb = await ADB.createADB();

            // 为了中文输入，安装一个插件
            const isInstall=await this.adb.isAppInstalled('com.tencent.fat.wxinputplug');
            if(!isInstall){
                const PLUG_SRC=path.resolve(__dirname,"./apk/inputPlug.apk");
                await  this.adb.install(PLUG_SRC);
            }
        }catch (err) {
            throw err;
        }
    }

    async initClient(options:WebviewDriverOptions){
        logger.info("初始化远程调试--initClient");
        try {
            this.client = await CDP({local: true,port:options.port|| 9223, target: options.target});

            const {Runtime, Input, DOM,Page,CSS} = this.client;
            this.Runtime=Runtime;
            this.Page=Page;
            this.Input=Input;
            this.DOM=DOM;
            this.CSS=CSS;

            //  初始化，dom
            const res=await this.DOM.getDocument();
            this.documentURL=res.root.documentURL;
        }catch (err) {
            throw err;
        }
    }

    async getDocumentURL(){
        logger.info(`获取DocumentURL`);

        return this.documentURL;
    }

    async getPageSource(){
        logger.info(`获取页面的OuterHTML`);
        try {
            const res=await this.DOM.getOuterHTML({nodeId:1});
            return res.outerHTML;
        } catch (err) {
            throw err;
        }
    }

    async isElementExist(xpath:string){
        logger.info(`元素是否存在-->xpath:${xpath}`);
        try {
            const script=`var xpath ='${xpath}';xpath_obj = document.evaluate(xpath,document,null, XPathResult.ANY_TYPE, null);var button = xpath_obj.iterateNext();button;`;
            const res=await this.Runtime.evaluate({expression: script});

            return res.result.subtype!=="null";
        } catch (err) {
            throw err;
        }
    }

    async clickElementByXpath(xpath:string,visibleItemXpath?:boolean,byUiAutomayor:boolean=false){
        logger.info(`点击元素-->xpath:${xpath}`);
        try {
            const isExist=await this.isElementExist(xpath);
            if(!isExist){
                throw new ElementNotFoundError('元素未找到');
            }else{
                await this.Runtime.evaluate({expression: "button.click()"});
            }
        } catch (err) {
            throw err;
        }
    }

    async getBodyHtml(){
        logger.info("获取webview的全部html");
        try{
            const script=`document.body.outerHTML`;
            const res=await this.Runtime.evaluate({expression: script});
            return res.result.value;
        }catch (err) {
            throw err;
        }
    }

    static async sleep(milliseconds=100){
        logger.info(`等待${milliseconds}毫秒继续`);
        return new Promise((resolve)=>{
            setTimeout(()=>{
                resolve();
            },milliseconds)
        })
    }

    async pageBack(){
        logger.info("页面退回");
        try{
            const script=`window.history.back();`;
            const res=await this.Runtime.evaluate({expression: script})
        }catch (err) {
            throw err;
        }
    }

    async pageFresh(){
        logger.info("页面刷新");
        try{
            const script=`location.reload();`;
            const res=await this.Runtime.evaluate({expression: script})
        }catch (err) {
            throw err;
        }
    }

    // 当输入框，具有输入焦点的时候，可用来输入文本，搜索框，可模拟点击搜索按钮
    async inputByBroadcast(text:string,search=false) {
        logger.info(`输入法输入文本：${text},点击搜索：${search}`);
        try{
            await this.Input.dispatchKeyEvent({
                type:"char",
                text,
            });
            if(search){
                await AdbHelper.touchSearchByKeyEvent();
            }
        }catch (err) {
            throw err;
        }
    }

    // 通过更改输入框的value，直接输入文本，速度快，适用范围窄
    async inputByChangeInputValue(xpath:string,text:string){
        logger.info(`更改输入框value-->xpath:${xpath},文本:${text}`);
        try {
            const isExist=await this.isElementExist(xpath);
            if(!isExist){
                throw new ElementNotFoundError('元素未找到')
            }else{
                await this.Runtime.evaluate({expression: `button.setAttribute('value','${text}')`});
            }
        } catch (err) {
            throw err;
        }
    }

    async clickFirstElementByText(text:string){
        logger.info(`点击目标文本-->文本:${text}`);
        try {
            const xpath=`.//*[text()='${text}']`;
            await this.clickElementByXpath(xpath)
        } catch (err) {
            throw err;
        }
    }

    async scrollToElementByXpath(xpath:String,speed=600){
        logger.info(`滚动元素至屏幕-->xpath:${xpath},speed:${speed}`);
        try {
            const script=`
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
            const res=await this.Runtime.evaluate({expression: script,returnByValue:false});
            const resFat=JSON.parse(res.result.value);

            await this.Input.synthesizeScrollGesture({
                yDistance:resFat.yDis,
                xDistance:resFat.xDis,
                speed,
                y:resFat.y,
                x:resFat.x,
                type:'mouseWheel',
            })
        } catch (err) {
            throw err;
        }
    }

    async takeWebviewScreenshot(screenFilePath:string){
        // todo ,websocket,发送截屏命令之后，无反应，卡住，待解决
        logger.info(`webview页面截屏-->screenFilePath:${screenFilePath}`);
        try {
            await this.Page.enable();
            const base64Img=(await this.Page.captureScreenshot()).result.data;
            const eImgBase64 = base64Img.replace(/^data:image\/\w+;base64,/, "");
            const imgBuffer = new Buffer(eImgBase64, 'base64');

            fs.writeFile(`search.png`, imgBuffer, (err) => {
                if (err) {
                    throw err;
                } else {
                    console.log("保存屏幕截图成功")
                }
            });

        } catch (err) {
            throw err;
        }

    }

    async getTitle(){
        logger.info("获取页面title");
        try{
            const script=`document.title;`;
            const res=await this.Runtime.evaluate({expression: script})
            return res.result.value;
        }catch (err) {
            throw err;
        }
    }

    async closeClient(){
        logger.info("关闭远程调试");
        try{
            if (this.client) {
                await this.client.close();
            }
        }catch (err) {
            throw err;
        }
    }


    async findElement(query:string){
        logger.info(`根据各种定位方式，获取单个元素-->query:${query}`);
        try {
            return (await this.findElements(query))[0];
        } catch (err) {
            throw err;
        }
    }

    getThis(){
        return this;
    }

    async findElements(query:string){
        const a=new WebviewELement(23,this);
        logger.info(`根据各种定位方式，获取多个元素-->query:${query}`);
        try {
            const res=await this.DOM.performSearch({query});
            if(res.resultCount===0){
                throw new ElementNotFoundError('元素未找到');
            }else{
                const params={
                    searchId:res.searchId,
                    fromIndex:0,
                    toIndex:res.resultCount,
                };
                const nodeIdLists=(await this.DOM.getSearchResults(params)).nodeIds;
                const webviewElemwnts=nodeIdLists.map((item:number)=>{
                    const res=new WebviewELement(item,this);
                    return res ;
                });

                return webviewElemwnts
            }
        } catch (err) {
            throw err;
        }
    }
}


