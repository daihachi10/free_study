document.addEventListener("DOMContentLoaded", () => {
  // PWAインストールボタンのロジック
  const installButton = document.getElementById("install-button");
  let deferredPrompt;

  window.addEventListener("beforeinstallprompt", (e) => {
    // ブラウザのデフォルトのプロンプトを無効化
    e.preventDefault();
    // プロンプトを後で使えるように保存
    deferredPrompt = e;
    // インストールボタンを表示
    installButton.hidden = false;
  });

  installButton.addEventListener("click", async () => {
    if (deferredPrompt) {
      // 保存しておいたプロンプトを表示
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to the install prompt: ${outcome}`);
      // プロンプトは一度しか使えないので、変数をクリア
      deferredPrompt = null;
      // ボタンを非表示に
      installButton.hidden = true;
    }
  });

  window.addEventListener("appinstalled", () => {
    // アプリがインストールされたら、ボタンを非表示にし、プロンプトもクリア
    installButton.hidden = true;
    deferredPrompt = null;
    console.log("PWA was installed");
  });

  // サーバーのWebSocketに接続
  const socket = io();

  // HTML要素を取得
  const progressValueElement = document.getElementById("progress-value");
  const totalProgressValueElement = document.getElementById(
    "total-progress-value"
  );
  const progressBarElement = document.getElementById("progress-bar");

  // 合計時間を保持する変数
  let totalFocusedTime = 0;

  // --- Chart.js（グラフ）の初期設定 ---
  const ctx = document.getElementById("progressChart").getContext("2d");
  const progressChart = new Chart(ctx, {
    type: "line", // 折れ線グラフ
    data: {
      labels: [], // X軸のラベル (時刻など)
      datasets: [
        {
          label: "経過時間 (分)",
          data: [], // Y軸のデータ
          borderColor: "#00f2ea",
          backgroundColor: "rgba(0, 242, 234, 0.2)",
          borderWidth: 2,
          fill: true,
          tension: 0.3, // 線を滑らかに
          pointBackgroundColor: "#ffffff",
          pointBorderColor: "#00f2ea",
        },
      ],
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
          suggestedMax: 25, // Y軸の最大値を25に仮設定
          grid: { color: "rgba(74, 74, 127, 0.5)" },
          ticks: { color: "#000000ff" },
        },
        x: {
          grid: { display: false },
          ticks: { color: "#000000ff" },
        },
      },
      plugins: {
        legend: { labels: { color: "#000000ff" } },
      },
    },
  });

  // --- ユーティリティ関数 ---
  // タイムスタンプ文字列から "HH:mm:ss" 形式の時刻を生成
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return `${date.getHours().toString().padStart(2, "0")}:${date
      .getMinutes()
      .toString()
      .padStart(2, "0")}:${date.getSeconds().toString().padStart(2, "0")}`;
  };

  // UI（テキストとプログレスバー）を更新する関数
  const updateUI = (value) => {
    // 1. 大きなテキスト表示を更新
    progressValueElement.textContent = value.toFixed(2);

    // 2. プログレスバーを更新 (最大25分と仮定)
    const maxTime = 25;
    const progressPercentage = Math.min((value / maxTime) * 100, 100);
    progressBarElement.style.width = `${progressPercentage}%`;
  };

  // 合計時間を更新・表示する関数
  const updateTotalUI = () => {
    totalProgressValueElement.textContent = totalFocusedTime.toFixed(2);
  };

  // --- WebSocketイベントリスナー ---

  // サーバーから履歴データ ('history') を受信したときの処理 (接続時に一度だけ)
  socket.on("history", (historyData) => {
    console.log("履歴データを受信:", historyData);

    // グラフのデータを準備
    const labels = historyData.map((data) => formatTime(data.timestamp));
    const values = historyData.map((data) => data.value);

    // 合計時間を計算
    totalFocusedTime = values.reduce((sum, current) => sum + current, 0);

    // グラフにデータを一括設定
    progressChart.data.labels = labels;
    progressChart.data.datasets[0].data = values;
    progressChart.update();

    // 最新のデータでUIを更新
    if (historyData.length > 0) {
      const lastData = historyData[historyData.length - 1];
      updateUI(lastData.value);
    }
    // 合計時間UIを更新
    updateTotalUI();
  });

  // サーバーから新しいデータ ('new_data') を受信したときの処理
  socket.on("new_data", (data) => {
    console.log("新規データを受信:", data);

    // UIを更新
    updateUI(data.value);

    // 合計時間を加算してUIを更新
    totalFocusedTime += data.value;
    updateTotalUI();

    // グラフに新しいデータを追加
    const timeLabel = formatTime(data.timestamp);

    // データが多すぎないように古いものから削除 (最新30件を維持)
    if (progressChart.data.labels.length > 30) {
      progressChart.data.labels.shift();
      progressChart.data.datasets[0].data.shift();
    }

    progressChart.data.labels.push(timeLabel);
    progressChart.data.datasets[0].data.push(data.value);

    // グラフを再描画
    progressChart.update();
  });

  // 接続・切断時のログ
  socket.on("connect", () => {
    console.log("サーバーに接続しました。");
  });
  socket.on("disconnect", () => {
    console.log("サーバーから切断されました。");
  });
});
