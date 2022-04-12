// index.js
import generateQRCode from '../../utils/qrcode_svg'
Page({
  data: {},
  async onLoad(){
    let svg = await generateQRCode('hello!', 500);
    var filePath = `${wx.env.USER_DATA_PATH}/qrcode.svg`;
    const fs = wx.getFileSystemManager();
    fs.writeFile({
      filePath,
      encoding: 'utf-8',
      data: svg,
      success:(res) => {
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
