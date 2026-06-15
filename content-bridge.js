// content-bridge.js
// Chrome Extension의 Isolated World에서 실행되어 설정을 확인하고 필요시 MAIN World에 롤백 메시지를 보냅니다.

(function() {
  // 백그라운드 스토리지 설정을 비동기적으로 확인한 뒤, 꺼져 있거나 현재 도메인이 제외된 경우 메인 월드에 롤백 신호를 보냅니다.
  chrome.storage.local.get({ bypassEnabled: true, disabledDomains: [] }, function(result) {
    const currentDomain = window.location.hostname;
    const isExcluded = result.disabledDomains && result.disabledDomains.includes(currentDomain);
    
    if (!result.bypassEnabled || isExcluded) {
      window.postMessage({ type: 'ADBLOCK_BYPASS_DISABLE' }, '*');
    }
  });
})();
