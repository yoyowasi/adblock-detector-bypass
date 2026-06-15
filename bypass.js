// bypass.js
// 이 스크립트는 웹페이지의 실제 메인 컨텍스트(MAIN World)에서 최우선 순위로 실행됩니다.
(function() {
  'use strict';

  // 원래 브라우저 API들을 백업해 두는 맵 (상호 의존성 및 롤백을 위해 최상단에 정의)
  var backup = {
    defineProperty: Object.defineProperty,
    cmpEntrypoints: {},
    descriptors: {},
    getBoundingClientRect: null,
    getComputedStyle: null,
    xhrOpen: null,
    xhrSend: null,
    fetch: null,
    cookieSet: null,
    createElement: null
  };

  // ==========================================
  // 0. Object.defineProperty 오버라이딩 (Google CMP 난독화 진입점 무력화)
  // ==========================================
  try {
    var origDefineProperty = backup.defineProperty;
    Object.defineProperty = function(obj, prop, descriptor) {
      if (obj === window && typeof prop === 'string' && /^__[a-zA-Z0-9]{12}__$/.test(prop)) {
        console.log('[AdBlock Bypasser] Intercepted Google CMP entrypoint definition: ' + prop);
        if (descriptor) {
          // 제외 도메인 롤백을 위해 원본 정의 백업
          backup.cmpEntrypoints[prop] = {
            value: descriptor.value,
            get: descriptor.get
          };

          if (typeof descriptor.value === 'function') {
            descriptor.value = function() {};
          } else if (typeof descriptor.get === 'function') {
            descriptor.get = function() { return function() {}; };
          }
        }
      }
      return origDefineProperty.apply(this, arguments);
    };
  } catch (e) {}

  console.log('[AdBlock Bypasser] Core script successfully injected.');

  // ==========================================
  // 1. 흔히 사용되는 글로벌 광고 차단 감지 변수 모킹
  // ==========================================
  try {
    const defineConstant = (obj, prop, val) => {
      try {
        Object.defineProperty(obj, prop, {
          get: () => val,
          set: () => {},
          configurable: true
        });
      } catch (e) {
        try { obj[prop] = val; } catch (err) {}
      }
    };

    defineConstant(window, 'canRunAds', true);
    defineConstant(window, 'adblock', false);
    defineConstant(window, 'adblocker', false);
    defineConstant(window, 'isAdblockActive', false);
    defineConstant(window, 'adBlockEnabled', false);
    defineConstant(window, 'sniffAdBlock', false);
    defineConstant(window, 'google_ad_client', 'ca-pub-1234567890123456');
    defineConstant(window, 'google_ad_status', 'done');
    defineConstant(window, 'google_ad_width', 300);
    defineConstant(window, 'google_ad_height', 250);
    defineConstant(window, 'google_ad_rules', []);
    defineConstant(window, 'google_ad_modifications', []);
    defineConstant(window, 'google_ad_slots', []);

    // Google Funding Choices (광고 차단 회복) 전역 객체 모킹
    defineConstant(window, 'googlefc', {
      controlledFlow: {
        controlledFlowActive: false,
        isAdblockActive: function() { return false; },
        getAdblockState: function() { return 0; },
        setAdblockState: function() {},
        hasConsented: function() { return true; },
        registerCallback: function() {}
      },
      callback: []
    });
  } catch (e) {}

  // ==========================================
  // 2. FuckAdBlock / BlockAdBlock 라이브러리 우회
  // ==========================================
  function createBypassFabInstance() {
    return {
      on: function(event, callback) {
        if ((event === 'notDetected' || event === false) && typeof callback === 'function') {
          setTimeout(callback, 10);
        }
        return this;
      },
      onDetected: function() { return this; },
      onNotDetected: function(callback) {
        if (typeof callback === 'function') setTimeout(callback, 10);
        return this;
      },
      check: function() { return this; },
      setOption: function() { return this; },
      options: {},
      vars: { checked: true, bypass: true, detected: false }
    };
  }

  class FakeFuckAdBlock {
    constructor() { Object.assign(this, createBypassFabInstance()); }
  }

  try {
    Object.defineProperty(window, 'FuckAdBlock', {
      get: () => FakeFuckAdBlock, set: () => {}, configurable: true
    });
    Object.defineProperty(window, 'BlockAdBlock', {
      get: () => FakeFuckAdBlock, set: () => {}, configurable: true
    });
    window.fuckAdBlock = createBypassFabInstance();
    window.blockAdBlock = createBypassFabInstance();
  } catch (e) {}

  // ==========================================
  // 3. Google AdSense (adsbygoogle) & GPT (googletag) 우회
  // ==========================================
  try {
    if (!window.adsbygoogle) {
      const adsArray = [];
      adsArray.push = function(obj) {
        Array.prototype.push.call(this, obj);
        return this.length;
      };
      window.adsbygoogle = adsArray;
    }

    if (!window.googletag) {
      const emptyFunc = () => {};
      const returnSelf = function() { return this; };
      const returnEmptyArray = () => [];

      const pubadsMock = {
        addEventListener: returnSelf,
        clear: returnSelf,
        clearTargeting: returnSelf,
        collapseEmptyDivs: returnSelf,
        definePassback: returnSelf,
        disableInitialLoad: returnSelf,
        display: returnSelf,
        enableAsyncRendering: returnSelf,
        enableLazyLoad: returnSelf,
        enableSingleRequest: returnSelf,
        enableSyncRendering: returnSelf,
        get: () => null,
        getAttributeKeys: returnEmptyArray,
        getTargeting: returnEmptyArray,
        getTargetingKeys: returnEmptyArray,
        getSlots: returnEmptyArray,
        set: returnSelf,
        setCategoryExclusion: returnSelf,
        setCentering: returnSelf,
        setCookieOptions: returnSelf,
        setForceSafeFrame: returnSelf,
        setLocation: returnSelf,
        setPublisherProvidedId: returnSelf,
        setRequestNonPersonalizedAds: returnSelf,
        setSafeFrameConfig: returnSelf,
        setTargeting: returnSelf,
        refresh: returnSelf,
        updateCorrelator: returnSelf
      };

      const googletagMock = {
        cmd: [],
        apiReady: true,
        pubads: () => pubadsMock,
        defineSlot: function() {
          return {
            addService: returnSelf,
            setTargeting: returnSelf,
            setCollapseEmptyDiv: returnSelf,
            setAttribute: returnSelf,
            clearTargeting: returnSelf,
            get: () => null
          };
        },
        defineOutOfPageSlot: function() {
          return {
            addService: returnSelf,
            setTargeting: returnSelf
          };
        },
        display: emptyFunc,
        enableServices: emptyFunc,
        destroySlots: emptyFunc,
        companionAds: () => ({ setRefreshUnfilledSlots: returnSelf }),
        sizeMapping: () => ({ addSize: returnSelf, build: returnSelf })
      };

      // cmd.push가 실행되면 비동기로 실행시켜줌
      googletagMock.cmd.push = function(fn) {
        if (typeof fn === 'function') {
          try { fn(); } catch (e) { console.error('[AdBlock Bypasser] Error in googletag.cmd.push:', e); }
        }
        return 1;
      };

      Object.defineProperty(window, 'googletag', {
        get: () => googletagMock,
        set: () => {},
        configurable: true
      });
    }
  } catch (e) {}

  // ==========================================
  // 4. DOM 감지 우회 (Element 크기 속성 프로토타입 재정의 및 스타일 조작)
  // ==========================================
  // 광고 감지에 사용되는 일반적인 클래스명 패턴
  var adPattern = /(ad-banner|adsbox|ad-client|ad-wrapper|banner-ad|pub_300x250|ad_box|sponsor-ad|advertising|ad-slot|ad-container|ad_unit|ad-panel|google-ad|gpt-ad)/i;

  function isAdElement(el) {
    if (!el) return false;
    try {
      var id = el.id || '';
      var cn = typeof el.className === 'string' ? el.className : '';
      if (adPattern.test(id) || adPattern.test(cn)) return true;
      if (el.attributes) {
        for (var i = 0; i < el.attributes.length; i++) {
          var name = el.attributes[i].name;
          if (name.indexOf('data-ad') === 0 || name.indexOf('sponsor') !== -1) return true;
        }
      }
      if (el.parentElement && el.parentElement !== document.body) {
        return isAdElement(el.parentElement);
      }
    } catch (e) {}
    return false;
  }

  // 안전하게 프로토타입 체인에서 descriptor를 찾는 함수
  function safeFindDescriptor(startProto, prop) {
    try {
      var p = startProto;
      while (p) {
        var desc = Object.getOwnPropertyDescriptor(p, prop);
        if (desc && typeof desc.get === 'function') return { desc: desc, proto: p };
        p = Object.getPrototypeOf(p);
      }
    } catch (e) {}
    return null;
  }

  // 원래 브라우저 API들을 백업해 두는 맵 (이미 최상단에 정의되어 있으므로 여기서는 선언 생략)

  // 크기 속성 오버라이드를 안전하게 수행하는 함수
  function overrideSizeProp(prop, fakeVal) {
    try {
      var found = safeFindDescriptor(HTMLElement.prototype, prop);
      if (!found) return;
      var originalGet = found.desc.get;
      var targetProto = found.proto;

      // 롤백을 위해 원래 descriptor 백업
      if (!backup.descriptors[prop]) {
        backup.descriptors[prop] = { proto: targetProto, desc: found.desc };
      }

      Object.defineProperty(targetProto, prop, {
        get: function() {
          var val = originalGet.call(this);
          if (val === 0 && isAdElement(this)) return fakeVal;
          return val;
        },
        configurable: true
      });
    } catch (e) {}
  }

  overrideSizeProp('offsetHeight', 250);
  overrideSizeProp('offsetWidth', 300);
  overrideSizeProp('clientHeight', 250);
  overrideSizeProp('clientWidth', 300);

  // getBoundingClientRect 오버라이딩
  try {
    var origGetBCR = HTMLElement.prototype.getBoundingClientRect;
    backup.getBoundingClientRect = origGetBCR;
    HTMLElement.prototype.getBoundingClientRect = function() {
      var rect = origGetBCR.apply(this, arguments);
      if (rect.width === 0 && rect.height === 0 && isAdElement(this)) {
        return {
          x: rect.x,
          y: rect.y,
          top: rect.top,
          bottom: rect.top + 250,
          left: rect.left,
          right: rect.left + 300,
          width: 300,
          height: 250,
          toJSON: function() { return this; }
        };
      }
      return rect;
    };
  } catch (e) {}

  // getComputedStyle 오버라이딩
  try {
    var origGetComputedStyle = window.getComputedStyle;
    backup.getComputedStyle = origGetComputedStyle;
    window.getComputedStyle = function(el, pseudoElt) {
      var style = origGetComputedStyle.call(window, el, pseudoElt);
      if (isAdElement(el)) {
        return new Proxy(style, {
          get: function(target, prop) {
            if (prop === 'display') {
              var val = target.getPropertyValue ? target.getPropertyValue(prop) : target[prop];
              if (val === 'none') return 'block';
            }
            if (prop === 'visibility') {
              var val = target.getPropertyValue ? target.getPropertyValue(prop) : target[prop];
              if (val === 'hidden') return 'visible';
            }
            if (prop === 'opacity') {
              var val = target.getPropertyValue ? target.getPropertyValue(prop) : target[prop];
              if (val === '0') return '1';
            }
            var value = target[prop];
            return typeof value === 'function' ? value.bind(target) : value;
          }
        });
      }
      return style;
    };
  } catch (e) {}

  // 광고 및 차단 관련 URL을 식별하고 Mock Response를 생성하는 통합 유틸리티
  var adUrlPattern = /(pagead2\.googlesyndication\.com|googlesyndication\.com\/pagead\/js\/adsbygoogle\.js|doubleclick\.net|securepubads\.g\.doubleclick\.net|amazon-adsystem\.com|adnxs\.com|adservice\.google|taboola\.com|outbrain\.com|criteo\.com|adroll\.com|prebid\.js|adframe|adblock|analytics|[\/\?]ads?\.js|[\/\?]adframe|[\/\?]adblock|[\/](api\/a_check|api\/ad_check|api\/adblock-check)|[\/\?]a_check|fundingchoicesmessages\.google\.com)/i;

  function shouldMockUrl(url) {
    if (!url) return false;
    var urlStr = String(url);
    return adUrlPattern.test(urlStr);
  }

  function getMockResponseContent(url) {
    var urlStr = String(url);
    if (urlStr.indexOf('adsbygoogle') !== -1 || urlStr.indexOf('googletag') !== -1 || urlStr.indexOf('gpt.js') !== -1 || urlStr.indexOf('prebid') !== -1 || urlStr.endsWith('.js') || urlStr.indexOf('.js?') !== -1) {
      return '/* mocked js */\nwindow.adsbygoogle = window.adsbygoogle || [];\nif(window.googletag) window.googletag.apiReady = true;';
    }
    if (urlStr.indexOf('a_check') !== -1 || urlStr.indexOf('ad_check') !== -1 || urlStr.indexOf('adblock-check') !== -1) {
      return JSON.stringify({ a: 0, status: "success", blocked: false, adblock: false });
    }
    return '';
  }

  // ==========================================
  // 5. 비정상적인 전역 에러로 감지하는 기법 방지
  // ==========================================
  try {
    window.addEventListener('error', function(e) {
      if (e.target && (e.target.src || e.target.href)) {
        var url = e.target.src || e.target.href;
        if (shouldMockUrl(url)) {
          e.preventDefault();
          e.stopPropagation();
        }
      }
    }, true);
  } catch (e) {}

  // ==========================================
  // 6. Network (XHR/Fetch) Level 광고 차단 감지 우회
  // ==========================================
  try {
    var origOpen = XMLHttpRequest.prototype.open;
    var origSend = XMLHttpRequest.prototype.send;
    backup.xhrOpen = origOpen;
    backup.xhrSend = origSend;

    XMLHttpRequest.prototype.open = function(method, url) {
      try { this._bypassUrl = String(url); } catch (e) { this._bypassUrl = ''; }
      return origOpen.apply(this, arguments);
    };

    XMLHttpRequest.prototype.send = function(body) {
      try {
        if (this._bypassUrl && shouldMockUrl(this._bypassUrl)) {
          var mock = getMockResponseContent(this._bypassUrl);
          Object.defineProperty(this, 'readyState', { value: 4, configurable: true });
          Object.defineProperty(this, 'status', { value: 200, configurable: true });
          Object.defineProperty(this, 'statusText', { value: 'OK', configurable: true });
          Object.defineProperty(this, 'responseText', { value: mock, configurable: true });
          Object.defineProperty(this, 'response', { value: mock, configurable: true });
          var self = this;
          setTimeout(function() {
            try {
              var ev = new Event('readystatechange');
              self.dispatchEvent(ev);
              if (typeof self.onreadystatechange === 'function') self.onreadystatechange(ev);
              var loadEv = new Event('load');
              self.dispatchEvent(loadEv);
              if (typeof self.onload === 'function') self.onload(loadEv);
            } catch (e) {}
          }, 1);
          return;
        }
      } catch (e) {}
      return origSend.apply(this, arguments);
    };

    var origFetch = window.fetch;
    if (typeof origFetch === 'function') {
      backup.fetch = origFetch;
      window.fetch = function(input, init) {
        try {
          var url = typeof input === 'string' ? input : (input && input.url ? input.url : '');
          if (shouldMockUrl(url)) {
            var mock = getMockResponseContent(url);
            var mime = url.indexOf('.js') !== -1 ? 'application/javascript' : 'application/json';
            return Promise.resolve(new Response(mock, {
              status: 200, statusText: 'OK',
              headers: { 'Content-Type': mime }
            }));
          }
        } catch (e) {}
        return origFetch.apply(this, arguments);
      };
    }
    console.log('[AdBlock Bypasser] Network hooks installed.');
  } catch (e) {}

  // ==========================================
  // 7. Cookie Level 광고 차단 감지 상태 조작
  // ==========================================
  try {
    var cookieFound = safeFindDescriptor(document, 'cookie');
    if (cookieFound && cookieFound.desc.set) {
      var origCookieSet = cookieFound.desc.set;
      var origCookieGet = cookieFound.desc.get;
      backup.cookieSet = origCookieSet;
      Object.defineProperty(cookieFound.proto, 'cookie', {
        set: function(val) {
          if (typeof val === 'string' && val.indexOf('ab=1') !== -1) {
            val = val.replace('ab=1', 'ab=0');
            console.log('[AdBlock Bypasser] Cookie ab=1 -> ab=0');
          }
          return origCookieSet.call(this, val);
        },
        get: origCookieGet,
        configurable: true
      });
    }
  } catch (e) {}

  // ==========================================
  // 8. jQuery.ajax 가로채기 (크로스도메인 스크립트 및 a_check API 대응)
  // ==========================================
  try {
    var hookJQueryAjax = function(jq) {
      try {
        if (!jq || !jq.ajax || jq.ajax._bypassed) return;
        var origAjax = jq.ajax;
        jq.ajax = function(options) {
          try {
            var url = (options && options.url) ? String(options.url) : '';

            // adsbygoogle.js 혹은 기타 Mock 대상 요청 가로채기
            if (shouldMockUrl(url)) {
              console.log('[AdBlock Bypasser] jQuery.ajax intercepted: ' + url);
              var d = jq.Deferred();
              var mock = getMockResponseContent(url);
              setTimeout(function() { d.resolve(mock, 'success', { responseText: mock }); }, 1);
              return d.promise();
            }

            // a_check API 인자값 강제 치환
            if (url.indexOf('/api/a_check') !== -1) {
              options.url = url.replace(/([\?&])a=[^&]*/, '$1a=0');
              if (options.url.indexOf('a=0') === -1) {
                options.url += (options.url.indexOf('?') !== -1 ? '&' : '?') + 'a=0';
              }
              if (options.data) {
                if (typeof options.data === 'string') {
                  options.data = options.data.replace(/([\?&])a=[^&]*/, '$1a=0');
                } else if (typeof options.data === 'object') {
                  options.data.a = 0;
                }
              }
            }
          } catch (e) {}
          return origAjax.apply(this, arguments);
        };
        jq.ajax._bypassed = true;
        console.log('[AdBlock Bypasser] jQuery.ajax hook applied.');
      } catch (e) {}
    };

    // jQuery가 이미 로드되어 있으면 바로 적용
    var existingJQ = window.jQuery;
    var existingDollar = window.$;
    if (existingJQ) hookJQueryAjax(existingJQ);
    if (existingDollar && existingDollar !== existingJQ) hookJQueryAjax(existingDollar);

    // jQuery가 나중에 로드되는 경우 감지
    Object.defineProperty(window, 'jQuery', {
      get: function() { return existingJQ; },
      set: function(v) { existingJQ = v; if (v) hookJQueryAjax(v); },
      configurable: true
    });
    Object.defineProperty(window, '$', {
      get: function() { return existingDollar; },
      set: function(v) { existingDollar = v; if (v) hookJQueryAjax(v); },
      configurable: true
    });
  } catch (e) {}

  // ==========================================
  // 9. document.createElement('script') 오버라이딩 (차단된 스크립트 실행 강제 시뮬레이션 및 data URI 리다이렉트)
  // ==========================================
  try {
    var origCreateElement = document.createElement;
    backup.createElement = origCreateElement;
    document.createElement = function(tagName) {
      var el = origCreateElement.apply(this, arguments);
      if (tagName && tagName.toLowerCase() === 'script') {
        Object.defineProperty(el, 'src', {
          set: function(val) {
            var targetVal = val;
            if (shouldMockUrl(val)) {
              // 외부 차단되는 요청을 원천 차단하고 더미 data URI로 치환
              targetVal = 'data:application/javascript;base64,LyoqLw==';
            }
            this.setAttribute('src', targetVal);
          },
          get: function() {
            return this.getAttribute('src') || '';
          },
          configurable: true
        });
      }
      return el;
    };
  } catch (e) {}

  // ==========================================
  // 10. 서버 세션 상태 리셋 (AAGAG 전용)
  // ==========================================
  try {
    if (window.location.hostname.indexOf('aagag.com') !== -1) {
      var doReset = function() {
        try {
          var img = new Image();
          img.src = 'https://aagag.com/api/a_check?a=0&_t=' + Date.now();
          console.log('[AdBlock Bypasser] Server session reset triggered.');
        } catch (e) {}
      };
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', doReset);
      } else {
        doReset();
      }
    }
  } catch (e) {}

  // ==========================================
  // 11. API 복원(Rollback) 기능 구현
  // ==========================================
  function restoreAllOriginals() {
    console.log('[AdBlock Bypasser] Rolling back all overrides.');
    try {
      // 0. Object.defineProperty 복구 및 이미 덮어씌워진 Google CMP 진입점 원본 복구
      if (backup.defineProperty) {
        Object.defineProperty = backup.defineProperty;
      }
      if (backup.cmpEntrypoints) {
        for (var prop in backup.cmpEntrypoints) {
          if (backup.cmpEntrypoints.hasOwnProperty(prop)) {
            var entry = backup.cmpEntrypoints[prop];
            try {
              var desc = { configurable: true, enumerable: true };
              if (entry.value !== undefined) {
                desc.value = entry.value;
                desc.writable = true;
              } else if (entry.get !== undefined) {
                desc.get = entry.get;
              }
              Object.defineProperty(window, prop, desc);
              console.log('[AdBlock Bypasser] Restored Google CMP entrypoint: ' + prop);
            } catch (err) {
              console.error('[AdBlock Bypasser] Failed to restore CMP entrypoint ' + prop + ':', err);
            }
          }
        }
      }
      // 1. DOM 크기 속성 복구
      for (var prop in backup.descriptors) {
        if (backup.descriptors.hasOwnProperty(prop)) {
          var item = backup.descriptors[prop];
          Object.defineProperty(item.proto, prop, item.desc);
        }
      }
      // 2. getBoundingClientRect 복구
      if (backup.getBoundingClientRect) {
        HTMLElement.prototype.getBoundingClientRect = backup.getBoundingClientRect;
      }
      // 3. getComputedStyle 복구
      if (backup.getComputedStyle) {
        window.getComputedStyle = backup.getComputedStyle;
      }
      // 4. XHR / Fetch 복구
      if (backup.xhrOpen) XMLHttpRequest.prototype.open = backup.xhrOpen;
      if (backup.xhrSend) XMLHttpRequest.prototype.send = backup.xhrSend;
      if (backup.fetch) window.fetch = backup.fetch;
      // 5. cookie 복구
      if (backup.cookieSet) {
        var cookieFound = safeFindDescriptor(document, 'cookie');
        if (cookieFound) {
          Object.defineProperty(cookieFound.proto, 'cookie', {
            set: backup.cookieSet,
            get: cookieFound.desc.get,
            configurable: true
          });
        }
      }
      // 6. createElement 복구
      if (backup.createElement) document.createElement = backup.createElement;
    } catch (e) {
      console.error('[AdBlock Bypasser] Error during rollback:', e);
    }
  }

  // Isolated World로부터 롤백 메시지 감지
  window.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'ADBLOCK_BYPASS_DISABLE') {
      restoreAllOriginals();
    }
  });
})();
