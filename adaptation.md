# 小程序端代码适配

## 解决错误#1
```text
 Cannot use 'import.meta' outside a module 
 SyntaxError: Cannot use 'import.meta' outside a module
```
删除以下代码
```javascript
if (typeof input === 'undefined') {
    input = new URL('wx_qrcode.wasm', import.meta.url);
}
```

## 解决错误#2

```text
WASubContext.js?t=wechat&s=1649755450624&v=2.19.4:2 Unhandled promise rejection TypeError: fetch is not a function
```

删除以下代码

```javascript
if (typeof input === 'string' || (typeof Request === 'function' && input instanceof Request) || (typeof URL === 'function' && input instanceof URL)) {
    input = fetch(input);
}
```
## 解决错误#3
```test
WASubContext.js?t=wechat&s=1649755450624&v=2.19.4:2 Unhandled promise rejection ReferenceError: WebAssembly is not defined
```
将 async function load() 函数替换为
```javascript
async function load(module, imports) {
    const instance = await WXWebAssembly.instantiate(module, imports);
    return instance;
}
```

## TextEncoder
真机可能没有TextDecoder，在qrcode_svg.js文件开头加入encoding_utf8.min.js的内容

## 封装API


```javascript
/**
* 生成二维码
* @param {Uint8Array | String} data
* @param {number} size
* @returns {String}
*/
export async function generateQRCode(data, size){
    if(!wasm){
        await init('/utils/qrcode_svg.wasm');
    }
    if(typeof data == "string"){
        return stringToQRCode(data, size);
    }else{
        return bytesToQRCode(data, size);
    }
}

/**
* 生成二维码 PNG Base64
* @param {Uint8Array | String} data
* @param {number} size
* @returns {String}
*/
export async function generateQRCodePng(data, size){
    if(!wasm){
        await init('/utils/qrcode_svg.wasm');
    }
    if(typeof data == "string"){
        return stringToQRCodePng(data, size);
    }else{
        return bytesToQRCodePng(data, size);
    }
}

export default{
    generateQRCode,
    generateQRCodePng,
}
```
