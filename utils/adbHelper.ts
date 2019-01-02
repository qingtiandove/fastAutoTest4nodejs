import {exec} from 'child_process';
import * as iconv from 'iconv-lite';

import * as http from 'http';


import {logger} from "./logger";

const KEYCODE_ENTER=66;
const DEFAULT_LOCAL_FORWARD_PORT=9223;

export class AdbHelper {
    device:string;
    localForWardPort:number;

    constructor(device:string,localForWardPort?:number){
        this.device=device;
        this.localForWardPort=localForWardPort || DEFAULT_LOCAL_FORWARD_PORT;
    }

    static async touchSearchByKeyEvent(){
        return new Promise((resolve,reject)=>{
            exec(`adb shell input keyevent ${KEYCODE_ENTER}`, { encoding: "buffer", maxBuffer: 2000 * 1024 * 1024 }, (err, stdout, stderr) => {
                if (err) {
                    console.log(err);
                    reject(err);
                }
                resolve();
            });
        });
    }

    async initWebviewDevToolsRemote(){
        logger.info("adbhelper-->开启小程序远程webview");
        const pid=await AdbHelper.fetchWeixinToolsProcessPid();
         await AdbHelper.startWebviewDevToolsRemote(this.localForWardPort,pid)
    }

    static async fetchWeixinToolsProcessPid(){
        logger.debug(`adbhelper-->获取微信小程序进程号`);
        return new Promise<string>((resolve,reject)=>{
            let pid:string;
            exec("adb shell dumpsys activity top | findStr ACTIVITY", { encoding: "buffer", maxBuffer: 2000 * 1024 * 1024 }, (err:Error, stdout, stderr) => {
                if (err) {
                    console.log(err);
                    reject(err);
                }
                const activityLists = iconv.decode(stdout, 'GBK').trim().split("\r\n");

                activityLists.forEach((value)=>{
                    if (value.indexOf("com.tencent.mm") >-1) {
                        [,pid]=value.split("pid=");
                        resolve(pid);
                    }
                });
            });
        });
    }

    static async startWebviewDevToolsRemote(localPort:number,pid:string){
        logger.debug(`adbhelper--开启webview远程调试`);
        const cmd=`adb forward tcp:${localPort} localabstract:webview_devtools_remote_${pid}`;
        return new Promise((resolve,reject)=>{

            exec(cmd, { encoding: "buffer", maxBuffer: 2000 * 1024 * 1024 }, (err, stdout, stderr) => {
                if (err) {
                    console.log(err);
                    reject(err);
                }
                resolve();
            });
        });
    }
}
