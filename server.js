const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");
const fs = require("fs");
const path = require("path");

// --- ★★★ 環境に合わせて必ず変更してください ★★★ ---
// micro:bitが接続されているCOMポート番号をデバイスマネージャーで確認
// (Linuxの場合は /dev/ttyACM0, Windowsの場合は COM3 など)
const COM_PORT_PATH = "/dev/ttyACM0";

const BAUD_RATE = 115200;
// ------------------------------------------------

// --- データ保存設定 ---
const HISTORY_FILE = path.join(__dirname, "study_history.json");
let historyData = [];

// 履歴ファイルを読み込む関数
function loadHistory() {
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      const fileContent = fs.readFileSync(HISTORY_FILE, "utf8");
      historyData = JSON.parse(fileContent);
      console.log(`履歴を ${HISTORY_FILE} から読み込みました。`);
    } else {
      console.log("履歴ファイルが見つかりません。新しい履歴を開始します。");
    }
  } catch (err) {
    console.error("履歴ファイルの読み込みエラー:", err);
  }
}

// 履歴ファイルを保存する関数
function saveHistory() {
  try {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(historyData, null, 2));
  } catch (err) {
    console.error("履歴ファイルの書き込みエラー:", err);
  }
}

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// 'public'フォルダの中のファイルをWebページとして公開する設定
app.use(express.static("public"));

let port;
let parser;

// シリアルポートに接続する関数
function connectToSerialPort() {
  console.log(`シリアルポート ${COM_PORT_PATH} への接続を試みます...`);
  port = new SerialPort({
    path: COM_PORT_PATH,
    baudRate: BAUD_RATE,
    autoOpen: false,
  });
  parser = port.pipe(new ReadlineParser({ delimiter: "\r\n" }));

  port.open((err) => {
    if (err) {
      console.error(
        `エラー: ポート ${COM_PORT_PATH} を開けませんでした:`,
        err.message
      );
      console.log("5秒後に再接続を試みます。");
      setTimeout(connectToSerialPort, 5000); // 5秒後に再試行
      return;
    }
    console.log(`接続成功！ ${COM_PORT_PATH} からのデータを待機しています。`);
  });

  // データ受信時の処理
  parser.on("data", (line) => {
    try {
      const progressValue = parseFloat(line);
      if (!isNaN(progressValue)) {
        const newData = {
          value: progressValue,
          timestamp: new Date().toISOString(),
        };
        // 履歴に追加して保存
        historyData.push(newData);
        saveHistory();

        // 接続している全てのWebクライアントに 'new_data' というイベント名でデータを送信
        io.emit("new_data", newData);
        console.log(`受信: ${progressValue} -> 保存・ブラウザに送信しました。`);
      }
    } catch (e) {
      console.error("データ処理エラー:", e);
    }
  });

  // ポートが閉じたときの処理
  port.on("close", () => {
    console.log(`ポート ${COM_PORT_PATH} との接続が切れました。`);
    setTimeout(connectToSerialPort, 5000); // 5秒後に再試行
  });

  // エラー発生時の処理
  port.on("error", (err) => {
    console.error("シリアルポートエラー:", err.message);
  });
}

// Webクライアントが接続してきたときの処理
io.on("connection", (socket) => {
  console.log("Webクライアントが接続しました。");
  // 接続時に、まずこれまでの履歴を送信
  socket.emit("history", historyData);

  socket.on("disconnect", () => {
    console.log("Webクライアントが切断しました。");
  });
});

// 最初に履歴を読み込む
loadHistory();

// 次にシリアルポートへの接続を開始
connectToSerialPort();

const PORT = 3002;
server.listen(PORT, () => {
  console.log(`Webサーバーを http://localhost:${PORT} で起動しました。`);
});
