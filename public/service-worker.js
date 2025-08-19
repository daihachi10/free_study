const CACHE_NAME = "otedudai-tracker-v3";
const urlsToCache = [
  "/",
  "/index.html",
  "/style.css",
  "/script.js",
  "/navbar.html",
  "/otedudai.html",
  "https://cdn.jsdelivr.net/npm/fullcalendar@6.1.8/index.global.min.js",
  // アイコンファイルもキャッシュ対象に含める
  "/icon-192x192.png",
  "/icon-512x512.png",
];

self.addEventListener("install", (event) => {
  // インストール完了後すぐにアクティブ化
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  // 他の古いSWがあってもすぐに置き換えられるように
  clients.claim();
});

self.addEventListener("fetch", (event) => {
  // 常にネットワークから取得（キャッシュは使用しない）
  event.respondWith(fetch(event.request));
});
