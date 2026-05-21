// bypass.js
// 이 스크립트는 웹페이지의 실제 메인 컨텍스트(MAIN World)에서 최우선 순위로 실행됩니다.
(function() {
  'use strict';

  console.log('[AdBlock Bypasser] Core script successfully injected.');

  // ==========================================
  // 1. 흔히 사용되는 글로벌 광고 차단 감지 변수 모킹
  // ==========================================
  try {
    window.canRunAds = true;
    window.adblock = false;
    window.adblocker = false;
    window.isAdblockActive = false;
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
  // 3. Google AdSense (adsbygoogle) 우회
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
  } catch (e) {}

  // ==========================================
  // 4. DOM 감지 우회 (Element 크기 속성 프로토타입 재정의)
  // ==========================================
  // 광고 감지에 사용되는 일반적인 클래스명 패턴
  var adPattern = /(ad-banner|adsbox|ad-client|ad-wrapper|banner-ad|pub_300x250|ad_box|sponsor-ad|advertising)/i;

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

  // 크기 속성 오버라이드를 안전하게 수행하는 함수
  function overrideSizeProp(prop, fakeVal) {
    try {
      var found = safeFindDescriptor(HTMLElement.prototype, prop);
      if (!found) return;
      var originalGet = found.desc.get;
      var targetProto = found.proto;
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

  // ==========================================
  // 5. 비정상적인 전역 에러로 감지하는 기법 방지
  // ==========================================
  try {
    window.addEventListener('error', function(e) {
      if (e.target && (e.target.src || e.target.href)) {
        var url = e.target.src || e.target.href;
        if (url.indexOf('ads') !== -1 || url.indexOf('adblock') !== -1 || url.indexOf('analytics') !== -1) {
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

    XMLHttpRequest.prototype.open = function(method, url) {
      try { this._bypassUrl = String(url); } catch (e) { this._bypassUrl = ''; }
      return origOpen.apply(this, arguments);
    };

    XMLHttpRequest.prototype.send = function(body) {
      try {
        if (this._bypassUrl && this._bypassUrl.indexOf('pagead2.googlesyndication.com/pagead/js/adsbygoogle.js') !== -1) {
          var mock = '/* adsbygoogle mock */\nwindow.adsbygoogle = window.adsbygoogle || [];';
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
      window.fetch = function(input) {
        try {
          var url = typeof input === 'string' ? input : (input && input.url ? input.url : '');
          if (url.indexOf('pagead2.googlesyndication.com/pagead/js/adsbygoogle.js') !== -1) {
            var mock = '/* adsbygoogle mock */\nwindow.adsbygoogle = window.adsbygoogle || [];';
            return Promise.resolve(new Response(mock, {
              status: 200, statusText: 'OK',
              headers: { 'Content-Type': 'application/javascript' }
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

            // adsbygoogle.js 요청 가로채기
            if (url.indexOf('pagead2.googlesyndication.com/pagead/js/adsbygoogle.js') !== -1) {
              console.log('[AdBlock Bypasser] jQuery.ajax intercepted: adsbygoogle.js');
              var d = jq.Deferred();
              var mock = '/* adsbygoogle mock */\nwindow.adsbygoogle = window.adsbygoogle || [];';
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
  // 9. 서버 세션 상태 리셋 (AAGAG 전용)
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

})();
