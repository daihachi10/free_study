document.addEventListener("DOMContentLoaded", () => {
  // サーバーのWebSocketに接続
  const socket = io();

  // HTML要素を取得
  const progressValueElement = document.getElementById("progress-value");
  const progressBarElement = document.getElementById("progress-bar");

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

  // --- WebSocketイベントリスナー ---

  // サーバーから履歴データ ('history') を受信したときの処理 (接続時に一度だけ)
  socket.on("history", (historyData) => {
    console.log("履歴データを受信:", historyData);

    // グラフのデータを準備
    const labels = historyData.map((data) => formatTime(data.timestamp));
    const values = historyData.map((data) => data.value);

    // グラフにデータを一括設定
    progressChart.data.labels = labels;
    progressChart.data.datasets[0].data = values;
    progressChart.update();

    // 最新のデータでUIを更新
    if (historyData.length > 0) {
      const lastData = historyData[historyData.length - 1];
      updateUI(lastData.value);
    }
  });

  // サーバーから新しいデータ ('new_data') を受信したときの処理
  socket.on("new_data", (data) => {
    console.log("新規データを受信:", data);

    // UIを更新
    updateUI(data.value);

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
