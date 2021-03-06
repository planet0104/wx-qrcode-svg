use qrcode_generator::QrCodeEcc;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
    #[wasm_bindgen(js_namespace = console)]
    fn error(s: &str);
}

/// 字符串生成二维码
#[wasm_bindgen(js_name = stringToQRCode)]
pub fn string_to_qrcode(msg: String, size: usize) -> JsValue {
    bytes_to_qrcode(msg.as_bytes(), size)
}

/// 字节数组生成二维码
#[wasm_bindgen(js_name = bytesToQRCode)]
pub fn bytes_to_qrcode(data: &[u8], size: usize) -> JsValue {
    match qrcode_generator::to_svg_to_string(data, QrCodeEcc::Low, size, None::<&str>){
        Ok(png_data) => {
            JsValue::from(png_data)
        },
        Err(err) => {
            error(&format!("二维码{:?}", err));
            JsValue::null()
        }
    }
}

/// 字符串生成二维码
#[wasm_bindgen(js_name = stringToQRCodePng)]
pub fn string_to_qrcode_png(msg: String, size: usize) -> JsValue {
    bytes_to_qrcode_png(msg.as_bytes(), size)
}

/// 字节数组生成PNG图片base64
#[wasm_bindgen(js_name = bytesToQRCodePng)]
pub fn bytes_to_qrcode_png(data: &[u8], size: usize) -> JsValue {
    match qrcode_generator::to_png_to_vec(data, QrCodeEcc::Low, size){
        Ok(png_data) => {
            let png_base64 = base64::encode(png_data);
            JsValue::from(png_base64)
        },
        Err(err) => {
            error(&format!("二维码{:?}", err));
            JsValue::null()
        }
    }
}

#[wasm_bindgen(start)]
pub fn run() {
    log("二维码工具初始化完成");
}