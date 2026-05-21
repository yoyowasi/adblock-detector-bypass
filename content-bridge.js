// content-bridge.js
// Chrome Extension의 Isolated World에서 실행되어 MAIN World에 bypass.js를 안전하게 주입합니다.

(async () => {
  // 우선 설정 정보 가져오기 (기본값은 활성화 상태인 true)
  const result = await chrome.storage.local.get({ bypassEnabled: true });
  
  if (!result.bypassEnabled) {
    return; // 비활성화 상태이면 스크립트를 주입하지 않음
  }

  try {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('bypass.js');
    script.onload = function() {
      this.remove();
    };
    (document.head || document.documentElement).appendChild(script);
  } catch (e) {
    console.error('[AdBlock Bypasser] Failed to inject bypass script:', e);
  }
})();
