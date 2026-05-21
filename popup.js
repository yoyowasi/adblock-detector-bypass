// popup.js
// 팝업 UI 상태 관리 및 유저 제어 로직

document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('bypass-toggle');
  const statusText = document.getElementById('status-text');
  const pulseDot = document.querySelector('.logo-pulse');

  // 저장소에서 현재 상태 불러오기 (기본값: true)
  chrome.storage.local.get({ bypassEnabled: true }, (result) => {
    toggle.checked = result.bypassEnabled;
    updateStatusUI(result.bypassEnabled);
  });

  // 토글 스위치 이벤트 핸들러
  toggle.addEventListener('change', () => {
    const isEnabled = toggle.checked;
    chrome.storage.local.set({ bypassEnabled: isEnabled }, () => {
      updateStatusUI(isEnabled);
    });
  });

  // 상태값에 따른 UI 스타일 변경
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
      pulseDot.style.display = 'block'; // 비활성화 상태에서도 표시되되 색상만 그레이로 변경
    }
  }
});
