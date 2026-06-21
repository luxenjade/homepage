(() => {
  // --- 1. 設定項目 ---
  const API_ENDPOINT = "/api/sw";

  // --- 2. ログ送信ロジック ---
  const sendAccessLog = () => {
    // すでに送信済みかチェックするフラグ（重複送信の防止）
    if (window.hasSentAccessLog) return;

    try {
      const currentPath = window.location.pathname;
      const referrer = document.referrer || null;

      // サーバー側の url.searchParams.get() に合わせるためのクエリパラメータ構築
      const params = new URLSearchParams();
      params.append("path", currentPath);
      if (referrer) {
        params.append("ref", referrer);
      }

      const requestUrl = `${API_ENDPOINT}?${params.toString()}`;

      // サーバー側の Edge Function の `body` 読み込みエラーを防ぐため、
      // 空のJSONオブジェクトを Blob（Content-Type: application/json）としてラップ
      const dummyBody = new Blob([JSON.stringify({})], { type: "application/json" });

      // Beaconの送信
      const isEnqueued = navigator.sendBeacon(requestUrl, dummyBody);

      if (isEnqueued) {
        // 送信キューに正常に入ったらフラグを true に
        window.hasSentAccessLog = true;
      }
    } catch (error) {
      console.error("Access log transmission failed:", error);
    }
  };

  // --- 3. イベントリスナーの登録 ---

  // A. ページが完全に読み込まれたタイミングで送信を試みる
  if (document.readyState === "complete") {
    sendAccessLog();
  } else {
    window.addEventListener("load", sendAccessLog);
  }

  // B. ユーザーがページを離脱する（タブを閉じる、戻る、アプリをバックグラウンドに下げる）タイミングを検知
  // ※ `unload` や `beforeunload` は現代のブラウザでは非推奨かつ不正確なため、visibilitychange を使用します
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      sendAccessLog();
    }
  });
})();