// --- ローカルストレージ版 飲み会状況通知 ---

const GSHEET_API_URL = "https://script.google.com/macros/s/AKfycbwoyBpiFj7yabHCu2803CUlAwdMatitcQvvRdZfhf-WKHTeVDuS3KESyPXbZHnsQIM0Ig/exec";
// 状況・履歴の保存キー
const STATUS_KEY = "nomikaiStatus";
const HISTORY_KEY = "nomikaiStatusHistory";

/**
 * ステータスをGoogleスプレッドシートに送信
 */
async function updateStatus(status) {
  const nickname = document.getElementById("nicknameInput")?.value?.trim() || "匿名";
  const now = new Date();
  const role = document.getElementById("roleSelect")?.value || "participant";
  let mapUrl = "";
  if (role === "participant") {
    mapUrl = document.getElementById("participantMapUrl")?.value?.trim() || "";
  } else if (role === "driver") {
    mapUrl = document.getElementById("driverMapUrl")?.value?.trim() || "";
  }
  const entry = {
    status: status,
    nickname: nickname,
    updatedAt: now.toLocaleString("ja-JP"),
    timestamp: now.getTime(),
    role: role,
    mapUrl: mapUrl
  };
  // GoogleスプレッドシートにPOST
  try {
    const res = await fetch(GSHEET_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nickname: nickname,
        role: role,
        status: status,
        mapUrl: mapUrl
      })
    });
    if (!res.ok) {
      alert("Googleスプレッドシートへの送信に失敗しました");
    }
  } catch (e) {
    // 完全なネットワークエラー時のみ警告
    alert("Googleスプレッドシートへの送信に失敗しました（ネットワークエラー）");
  }
  // ローカルにも保存（オフライン用）
  localStorage.setItem(STATUS_KEY, JSON.stringify(entry));
  const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  history.push(entry);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  renderStatus();
  renderHistory();
}

// 状況ごとに色分け
function setStatusColor(status) {
  const statusElem = document.getElementById("currentStatus");
  let color = "", bg = "";
  if (!status) {
    statusElem.style.background = "";
    statusElem.style.color = "";
    return;
  }
  if (status.includes("迎えに来てOK")) {
    bg = "#e3f7d3"; color = "#217a00";
  } else if (status.includes("もうすぐ終わりそう")) {
    bg = "#fff7d6"; color = "#b48a00";
  } else if (status.includes("まだかかりそう")) {
    bg = "#f0f0f0"; color = "#555";
  } else if (status.includes("飲みすぎた")) {
    bg = "#ffe0e0"; color = "#b80000";
  } else if (status.includes("迎えに行きます")) {
    bg = "#d0e8ff"; color = "#0057b7";
  } else if (status.includes("もう少しで着きます")) {
    bg = "#c7ffd6"; color = "#008c4a";
  } else if (status.includes("了解")) {
    bg = "#f0f0f0"; color = "#555";
  } else {
    bg = ""; color = "";
  }
  statusElem.style.background = bg;
  statusElem.style.color = color;
}

// 地図リンク表示
function renderMapLink(status, mapUrl) {
  const area = document.getElementById("mapLinkArea");
  if (!area) return;
  // 地図URLがあれば優先して表示
  if (mapUrl && mapUrl.startsWith("http")) {
    area.innerHTML = `<a href="${mapUrl}" target="_blank" style="color:#0057b7;text-decoration:underline;">地図を開く（Googleマップ）</a>`;
    return;
  }
  // 送迎者到着時のみ地図リンク表示（URL未指定時はGoogleマップトップ）
  if (status && (status.includes("迎えに行きます") || status.includes("もう少しで着きます"))) {
    area.innerHTML = `<a href="https://www.google.co.jp/maps" target="_blank" style="color:#0057b7;text-decoration:underline;">地図を開く（Googleマップ）</a>`;
  } else {
    area.innerHTML = "";
  }
}

/**
 * Googleスプレッドシートから最新状況を取得して表示
 */
async function renderStatus() {
  let data = null;
  try {
    const res = await fetch(GSHEET_API_URL);
    data = await res.json();
  } catch (e) {
    // オフライン時はローカルを参照
    data = JSON.parse(localStorage.getItem(STATUS_KEY) || "null");
  }
  const statusElem = document.getElementById("currentStatus");
  if (data && data.status) {
    statusElem.textContent = data.status + "（更新: " + (data.timestamp ? new Date(data.timestamp).toLocaleString("ja-JP") : "") + "）";
    setStatusColor(data.status);
    renderMapLink(data.status, data.mapUrl || "");
    // 入力欄に地図URLを復元
    if (data.role === "participant" && document.getElementById("participantMapUrl")) {
      document.getElementById("participantMapUrl").value = data.mapUrl || "";
    }
    if (data.role === "driver" && document.getElementById("driverMapUrl")) {
      document.getElementById("driverMapUrl").value = data.mapUrl || "";
    }
  } else {
    statusElem.textContent = "未設定";
    setStatusColor("");
    renderMapLink("", "");
  }
}

// 履歴を取得して表示
function renderHistory() {
  let historyArea = document.getElementById("historyArea");
  if (!historyArea) {
    historyArea = document.createElement("div");
    historyArea.id = "historyArea";
    historyArea.style.marginTop = "18px";
    document.querySelector(".container").appendChild(historyArea);
  }
  const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  const list = history.map(d => {
    const name = d.nickname ? `（${d.nickname}）` : "";
    return `<div>【${d.updatedAt}】${d.status}${name}</div>`;
  });
  if (list.length > 0) {
    historyArea.innerHTML = "<b>履歴</b><br>" + list.reverse().join("");
  } else {
    historyArea.innerHTML = "";
  }
}

// 履歴クリア機能
function clearHistory() {
  if (confirm("本当に履歴を全て削除しますか？")) {
    localStorage.removeItem(HISTORY_KEY);
    renderHistory();
    alert("履歴をクリアしました。");
  }
}

document.getElementById("clearHistoryBtn").addEventListener("click", clearHistory);

// ダークモード切り替え
const darkModeBtn = document.getElementById("toggleDarkModeBtn");
function setDarkMode(enabled) {
  if (enabled) {
    document.body.classList.add("dark-mode");
    localStorage.setItem("darkMode", "1");
    darkModeBtn.textContent = "☀️";
  } else {
    document.body.classList.remove("dark-mode");
    localStorage.setItem("darkMode", "0");
    darkModeBtn.textContent = "🌙";
  }
}
darkModeBtn.addEventListener("click", () => {
  setDarkMode(!document.body.classList.contains("dark-mode"));
});
// 初期状態
if (localStorage.getItem("darkMode") === "1" ||
    (localStorage.getItem("darkMode") === null && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
  setDarkMode(true);
} else {
  setDarkMode(false);
}


function handleRoleSwitch() {
  const role = document.getElementById("roleSelect")?.value || "participant";
  const participantBtns = document.querySelector(".participant-buttons");
  const driverBtns = document.querySelector(".driver-buttons");
  const participantMapurl = document.querySelector(".participant-mapurl");
  const driverMapurl = document.querySelector(".driver-mapurl");
  if (role === "driver") {
    participantBtns.style.display = "none";
    driverBtns.style.display = "";
    if (participantMapurl) participantMapurl.style.display = "none";
    if (driverMapurl) driverMapurl.style.display = "";
  } else {
    participantBtns.style.display = "";
    driverBtns.style.display = "none";
    if (participantMapurl) participantMapurl.style.display = "";
    if (driverMapurl) driverMapurl.style.display = "none";
  }
  localStorage.setItem("nomikaiRole", role);
}

/**
 * 初期表示・定期更新
 */
window.addEventListener("DOMContentLoaded", () => {
  renderStatus();
  renderHistory();
  // 役割選択初期化
  const roleSelect = document.getElementById("roleSelect");
  if (roleSelect) {
    // 前回選択を復元
    const savedRole = localStorage.getItem("nomikaiRole") || "participant";
    roleSelect.value = savedRole;
    handleRoleSwitch();
    roleSelect.addEventListener("change", handleRoleSwitch);
  }
  // 10秒ごとに最新状況を取得
  setInterval(renderStatus, 10000);
});
