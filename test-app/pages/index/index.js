// index.js
import {generateQRCode, generateQRCodePng} from '../../utils/qrcode_svg'
Page({
  data: {},
  async onLoad(){
    let imgData = await generateQRCodePng('hello!', 500);
    console.log('图片:', imgData);
    this.setData({
      imgData
    });
  },
})
