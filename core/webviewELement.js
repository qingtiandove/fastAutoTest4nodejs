"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = require("../utils/logger");
class WebviewELement {
    constructor(nodeId, webviewDriver) {
        this.nodeId = nodeId;
        this.webviewDriver = webviewDriver;
    }
    async getDriver() {
        return this.webviewDriver;
    }
    async getNodeId() {
        return this.nodeId;
    }
    async getRect() {
        logger_1.logger.info(`清除输入框内容`);
        try {
            // todo 此方法是实验性的，没有找到此方法我（webciew版本相关）
            const res = await this.webviewDriver.DOM.getContentQuads({
                nodeId: this.nodeId,
            });
        }
        catch (err) {
            throw err;
        }
    }
    async click() {
        //    todo  根据nodeid，进行点击，获取不到node的位置信息，无法继续
    }
    async getTagName() {
        //    todo getTagName()
    }
    async getComputedStyle() {
        logger_1.logger.info(`获取元素的css属性`);
        try {
            const res = await this.webviewDriver.CSS.getComputedStyleForNode({
                nodeId: this.nodeId,
            });
            return res.computedStyle;
        }
        catch (err) {
            throw err;
        }
    }
    async clear() {
        logger_1.logger.info(`清除输入框内容`);
        try {
            await this.webviewDriver.DOM.setNodeValue({
                nodeId: this.nodeId,
                value: "",
            });
        }
        catch (err) {
            throw err;
        }
    }
    async getOuterHTML() {
        logger_1.logger.info(`WebviewElement-->获取元素的OuterHTML`);
        try {
            const res = await this.webviewDriver.DOM.getOuterHTML({ nodeId: this.nodeId });
            return res.outerHTML;
        }
        catch (err) {
            throw err;
        }
    }
    async getAttributesDict() {
        logger_1.logger.info(`获取元素属性字典`);
        try {
            // 返回值是  key,value 交错的数组；
            const attrArray = (await this.webviewDriver.DOM.getAttributes({ nodeId: this.nodeId })).attributes;
            const attrDict = {};
            for (let i = 0; i < attrArray.length; i += 2) {
                attrDict[attrArray[i]] = attrArray[i + 1];
            }
            return attrDict;
        }
        catch (err) {
            throw err;
        }
    }
    async getAttributeValue(attr) {
        logger_1.logger.info(`获取元素属性值-->nodeId:${this.nodeId},attr:${attr}`);
        try {
            const attrDict = await this.getAttributesDict();
            return attrDict[attr];
        }
        catch (err) {
            throw err;
        }
    }
}
exports.WebviewELement = WebviewELement;
