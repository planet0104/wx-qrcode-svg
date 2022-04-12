# wx-qrcode-svg 小程序生成SVG格式二维码工具

## 使用

### 修改qrcode_svg.js中的wasm绝对路径

```javascript
export default async function generateQRCode(data, size){
  if(!wasm){
    // 将此处的wasm文件路径改为你项目中的绝对路径
    await init('/utils/qrcode_svg.wasm');
  }
  if(typeof data == "string"){
    return stringToQRCode(data, size);
  }else{
    return bytesToQRCode(data, size);
  }
}

```

### 调用

```javascript
import generateQRCode from '../../utils/qrcode_svg'
Page({
  data: {},
  async onLoad(){

    // 生成svg图片
    let svg = await generateQRCode('hello!', 500);

    // 保存图片
    var filePath = `${wx.env.USER_DATA_PATH}/qrcode.svg`;

    const fs = wx.getFileSystemManager();
    fs.writeFile({
      filePath,
      encoding: 'utf-8',
      data: svg,
      success:(res) => {
        //保存成功，显示二维码
        this.setData({
          'qrCode': filePath
        });
        console.log('filePath=', filePath);
      },
      fail(res) {
        console.error(res)
      }
    })
  },
})

```

```xml
<!--index.wxml-->
<view>
    <text>仅支持真机运行</text>
    <image src="{{ qrCode }}" />
</view>
```


## 编译

[编译教程](./adaptation.md)