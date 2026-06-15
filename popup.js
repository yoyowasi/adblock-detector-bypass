// popup.js
// 팝업 UI 상태 관리 및 유저 제어 로직

document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('bypass-toggle');
  const statusText = document.getElementById('status-text');
  const pulseDot = document.querySelector('.logo-pulse');
  
  const domainToggle = document.getElementById('domain-toggle');
  const currentDomainValue = document.getElementById('current-domain');

  // 1. 글로벌 보호 활성화 상태 불러오기 (기본값: true)
  chrome.storage.local.get({ bypassEnabled: true }, (result) => {
    toggle.checked = result.bypassEnabled;
    updateStatusUI(result.bypassEnabled);
  });

  // 글로벌 토글 스위치 이벤트 핸들러
  toggle.addEventListener('change', () => {
    const isEnabled = toggle.checked;
    chrome.storage.local.set({ bypassEnabled: isEnabled }, () => {
      updateStatusUI(isEnabled);
    });
  });

  // 글로벌 상태값에 따른 UI 스타일 변경
  function updateStatusUI(isEnabled) {
    if (isEnabled) {
      statusText.textContent = '활성화됨';
      statusText.className = 'status-value active';
      pulseDot.style.backgroundColor = '#10B981';
      pulseDot.style.boxShadow = '0 0 8px rgba(16, 185, 129, 0.3)';
      pulseDot.style.display = 'block';
    } else {
      statusText.textContent = '비활성화됨';
      statusText.className = 'status-value disabled';
      pulseDot.style.backgroundColor = '#6B7280';
      pulseDot.style.boxShadow = 'none';
      pulseDot.style.display = 'block';
    }
  }

  // 2. 현재 활성화된 탭의 도메인 가져오기 및 예외 토글 설정
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs && tabs[0] && tabs[0].url) {
      try {
        const url = new URL(tabs[0].url);
        // http, https 프로토콜만 예외 설정 지원
        if (url.protocol.startsWith('http')) {
          const domain = url.hostname;
          currentDomainValue.textContent = domain;

          // 저장소에서 제외된 도메인 목록 가져오기
          chrome.storage.local.get({ disabledDomains: [] }, (result) => {
            const disabledDomains = result.disabledDomains;
            const isExcluded = disabledDomains.includes(domain);
            domainToggle.checked = isExcluded;
          });

          // 도메인 예외 토글 이벤트 핸들러
          domainToggle.addEventListener('change', () => {
            const exclude = domainToggle.checked;
            chrome.storage.local.get({ disabledDomains: [] }, (result) => {
              let disabledDomains = result.disabledDomains;
              if (exclude) {
                if (!disabledDomains.includes(domain)) {
                  disabledDomains.push(domain);
                }
              } else {
                disabledDomains = disabledDomains.filter(d => d !== domain);
              }
              chrome.storage.local.set({ disabledDomains: disabledDomains });
            });
          });
        } else {
          disableDomainToggleSection();
        }
      } catch (e) {
        disableDomainToggleSection();
      }
    } else {
      disableDomainToggleSection();
    }
  });

  function disableDomainToggleSection() {
    const domainContainer = document.querySelector('.domain-container');
    if (domainContainer) {
      domainContainer.style.opacity = '0.5';
      domainContainer.style.pointerEvents = 'none';
    }
    currentDomainValue.textContent = '지원되지 않는 페이지';
  }
});
