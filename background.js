// background.js
// Chrome Extension 백그라운드 서비스 워커

chrome.runtime.onInstalled.addListener(() => {
  // 확장 프로그램이 처음 설치되거나 업데이트되었을 때 실행 상태 초기화
  chrome.storage.local.get({ bypassEnabled: true }, (result) => {
    chrome.storage.local.set({ bypassEnabled: result.bypassEnabled });
    console.log(`[AdBlock Bypasser] Installed. Bypass state initialized to: ${result.bypassEnabled}`);
  });
});
