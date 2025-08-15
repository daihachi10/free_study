document.addEventListener("DOMContentLoaded", () => {
  // サーバーのWebSocketに接続
  const socket = io();

  // HTML要素を取得
  const progressValueElement = document.getElementById("progress-value");
  const progressBarElement = document.getElementById("progress-bar");

  // Chart.js（グラフ）の初期設定
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
          ticks: { color: "#e0e0e0" },
        },
        x: {
          grid: { display: false },
          ticks: { color: "#e0e0e0" },
        },
      },
      plugins: {
        legend: { labels: { color: "#e0e0e0" } },
      },
    },
  });

  // サーバーから 'new_data' イベントを受信したときの処理
  socket.on("new_data", (data) => {
    const value = data.value;
    console.log("受信データ:", value);

    // 1. 大きなテキスト表示を更新
    progressValueElement.textContent = value.toFixed(2);

    // 2. プログレスバーを更新 (最大25分と仮定)
    const maxTime = 25;
    const progressPercentage = Math.min((value / maxTime) * 100, 100);
    progressBarElement.style.width = `${progressPercentage}%`;

    // 3. グラフにデータを追加
    const now = new Date();
    const timeLabel = `${now.getHours().toString().padStart(2, "0")}:${now
      .getMinutes()
      .toString()
      .padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;

    // データが多すぎないように古いものから削除 (最新30件)
    if (progressChart.data.labels.length > 30) {
      progressChart.data.labels.shift();
      progressChart.data.datasets[0].data.shift();
    }

    progressChart.data.labels.push(timeLabel);
    progressChart.data.datasets[0].data.push(value);

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
