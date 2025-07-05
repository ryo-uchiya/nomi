/**
 * Google Apps Script（GAS）用サンプル（CORS対応版）
 * スプレッドシートで飲み会状況・地図URLを簡易共有するAPI
 * 
 * 1. Googleスプレッドシートを作成し、[拡張機能]→[Apps Script]でこのコードを貼り付け
 * 2. デプロイ→ウェブアプリとして公開（全員がアクセス可に設定）
 * 3. 公開URLをapp.jsに組み込む
 */

// スプレッドシートIDを指定
const SHEET_ID = '1GD5SL37c26-MPrTmBcU2K8RBHIcjHykcWuXNA_K4Ilw';
const SHEET_NAME = 'Sheet1'; // シート名

function doGet(e) {
  Logger.log(JSON.stringify(e))
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  // 最新行のみ返す
  const last = data.length > 1 ? data[data.length - 1] : null;
  if (!last) {
    return ContentService.createTextOutput('{}')
      .setMimeType(ContentService.MimeType.JSON);
  }
  const [timestamp, nickname, role, status, mapUrl] = last;
  return ContentService.createTextOutput(JSON.stringify({
    timestamp, nickname, role, status, mapUrl
  }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  Logger.log(JSON.stringify(e))
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
  const params = JSON.parse(e.postData.contents);
  const now = new Date().toISOString();
  sheet.appendRow([
    now,
    params.nickname || '',
    params.role || '',
    params.status || '',
    params.mapUrl || ''
  ]);
  return ContentService.createTextOutput(JSON.stringify({result: 'ok'}))
    .setMimeType(ContentService.MimeType.JSON);
}
