# AdBlock Detector Bypasser

웹사이트의 **광고 차단 감지(Anti-Adblock)** 스크립트를 우회하는 Chrome 확장 프로그램입니다.

AdGuard, uBlock Origin 등 광고 차단기를 사용할 때 "광고 차단을 해제해 주세요" 같은 팝업이 뜨거나 콘텐츠가 제한되는 사이트에서, 해당 감지 로직을 무력화하여 정상적으로 페이지를 이용할 수 있게 해줍니다.

---

## 주요 기능

| 우회 기법 | 설명 |
|---|---|
| **글로벌 변수 모킹** | `canRunAds`, `adblock` 등 감지용 전역 변수를 선제적으로 조작 |
| **FuckAdBlock / BlockAdBlock 우회** | 널리 사용되는 감지 라이브러리의 클래스와 인스턴스를 가짜로 대체 |
| **Google AdSense 에뮬레이션** | `adsbygoogle` 배열을 미리 정의하여 로드 실패 감지를 방지 |
| **DOM 크기 속성 오버라이드** | 광고 요소의 `offsetHeight`/`clientWidth` 등을 조작하여 "보이는 것처럼" 위장 |
| **XHR / Fetch 가로채기** | `adsbygoogle.js` 네트워크 요청을 인터셉트하여 가짜 성공 응답 반환 |
| **jQuery.ajax 후킹** | jQuery 기반 사이트의 크로스도메인 스크립트 요청까지 대응 |
| **쿠키 변조 방지** | `ab=1` (차단 감지됨) 쿠키 설정을 실시간 감시하여 `ab=0`으로 강제 변환 |
| **서버 세션 리셋** | 이전 감지 이력이 남은 서버 세션을 자동으로 초기화 |

---

## 설치 방법

### 개발자 모드 설치 (권장)

1. 이 저장소를 클론합니다:
   ```bash
   git clone https://github.com/YOUR_USERNAME/adblock-detector-bypass.git
   ```

2. Chrome 브라우저에서 `chrome://extensions/` 페이지를 엽니다.

3. 우측 상단의 **개발자 모드**를 활성화합니다.

4. **"압축 해제된 확장 프로그램을 로드합니다"** 버튼을 클릭합니다.

5. 클론한 `adblock-detector-bypass` 폴더를 선택합니다.

6. 설치 완료!

---

## 프로젝트 구조

```
adblock-detector-bypass/
├── manifest.json        # Chrome Extension Manifest V3 설정
├── background.js        # Service Worker (백그라운드 스크립트)
├── content-bridge.js    # Content Script → MAIN World 브릿지
├── bypass.js            # 핵심 우회 로직 (MAIN World에서 실행)
├── popup.html           # 확장 프로그램 팝업 UI
├── popup.css            # 팝업 스타일
├── popup.js             # 팝업 로직
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

---

## 동작 원리

```
페이지 로드 시작
    │
    ▼
content-bridge.js (ISOLATED World, document_start)
    │
    │  <script> 태그를 동적 생성하여 bypass.js를 MAIN World에 주입
    ▼
bypass.js (MAIN World)
    │
    ├─ 1. 글로벌 감지 변수 선점 (canRunAds = true, adblock = false ...)
    ├─ 2. FuckAdBlock / BlockAdBlock 라이브러리 무력화
    ├─ 3. adsbygoogle 배열 사전 정의
    ├─ 4. HTMLElement 크기 속성 getter 오버라이드
    ├─ 5. 광고 스크립트 에러 이벤트 차단
    ├─ 6. XHR / Fetch 네트워크 요청 인터셉트
    ├─ 7. document.cookie setter 하이재킹
    ├─ 8. jQuery.ajax 함수 후킹
    └─ 9. 서버 세션 리셋 요청 발송
    │
    ▼
사이트의 감지 스크립트 실행 → "광고 차단 없음" 으로 판정
```

---

## 테스트된 사이트

| 사이트 | 감지 방식 | 우회 상태 |
|---|---|---|
| AAGAG (aagag.com) | jQuery AJAX + Cookie + 서버 세션 | 우회 성공 |

> 다른 사이트에서의 테스트 결과도 Issue로 공유해 주시면 감사하겠습니다.

---

## 기술 스택

- **Chrome Extension Manifest V3**
- **Vanilla JavaScript** (의존성 없음)
- MAIN World 스크립트 주입 패턴

---

## 주의사항

- 이 확장 프로그램은 **교육 및 연구 목적**으로 제작되었습니다.
- 웹사이트 운영자의 수익 모델을 존중해 주세요.
- 일부 사이트에서는 서버 사이드 감지를 사용하여 완전한 우회가 불가능할 수 있습니다.
- 사이트의 감지 스크립트 업데이트에 따라 우회가 풀릴 수 있습니다.

---

## 라이선스

MIT License — 자유롭게 사용, 수정, 배포할 수 있습니다.

---

## 기여

1. 이 저장소를 Fork 합니다.
2. 새 브랜치를 생성합니다: `git checkout -b feature/awesome-bypass`
3. 변경사항을 커밋합니다: `git commit -m "Add awesome bypass"`
4. 브랜치를 Push 합니다: `git push origin feature/awesome-bypass`
5. Pull Request를 생성합니다.

**버그 제보 및 우회 실패 사이트 신고**는 [Issues](../../issues) 탭에서 부탁드립니다.
