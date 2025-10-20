$(document).ready(function () {

    $(".gnb>li>a").on("click", function (e) {
        console.log(this.hash);
        e.preventDefault();
        if (this.hash !== "") {
            let hash = this.hash;
            $("html,body").animate({
                scrollTop: $(hash).offset().top
            }, 800, function(){
                // after scroll, apply active to clicked link
                setActiveByHash(hash);
                history.replaceState(null, '', hash);
            });
        }
    });

    $(window).scroll(function (){
        if ($(this).scrollTop() < 700) {
            $("#btn_top").hide();
        } else if ($(this).scrollTop() < 800) {
            $("#btn_top").fadeIn(500);
        }
    });

    $(window).resize(function () {
        resizeable();
    });

    function resizeable() {
        if ($(window).width() < 768) {
        } else if ($(window).width() < 1200) {
        } else {
        }
    }
    resizeable();

    $("#btn_top").on("click", function () {
        $("html,body").animate({ scrollTop: 0 }, 500);
    });

    // ===== SKILL BAR =====
    function cacheSkillTargets(){
      $('#skill .skill_bar').each(function(){
        const $bar = $(this);
        if ($bar.data('target') != null) return;
        const fromAttr = parseInt($bar.attr('data-percent'), 10);
        let t = Number.isFinite(fromAttr) ? fromAttr :
                (parseInt(String($bar.text()).replace(/\D/g,''), 10) || 0);
        t = Math.max(0, Math.min(100, t));
        $bar.data('target', t);
      });
    }

    function resetSkillSection(){
      $('#skill .skill_bar').each(function(){
        const $bar = $(this);
        const timer = $bar.data('timer');
        if (timer) { clearInterval(timer); $bar.removeData('timer'); }
        $bar.removeData('animated')
            .stop(true,true)
            .css('width','0%')
            .text('0%');
      });
    }

    function animateSkillSection(){
      $('#skill .skill_bar').each(function(i){
        const $bar = $(this);
        if ($bar.data('animated')) return;
        const target = $bar.data('target') ?? 0;
        $bar.data('animated', true);

        $bar.stop(true,true).delay(i*120).animate({ width: target + '%' }, 900);

        let current = 0;
        const stepMs = 12, durationMs = 900;
        const steps = Math.max(1, Math.round(durationMs / stepMs));
        const inc = target / steps;
        const timer = setInterval(function(){
          current += inc;
          if (current >= target){
            current = target;
            clearInterval(timer);
            $bar.removeData('timer');
          }
          $bar.text(Math.round(current) + '%');
        }, stepMs);
        $bar.data('timer', timer);
      });
    }

    (function observeSkill(){
      const el = document.querySelector('#skill');
      if (!el) return;
      function isVisibleEnough(ratioNeeded){
        const rect = el.getBoundingClientRect();
        const vh = window.innerHeight || document.documentElement.clientHeight;
        if (rect.height <= 0 || vh <= 0) return false;
        const visibleHeight = Math.min(rect.bottom, vh) - Math.max(rect.top, 0);
        const ratio = Math.max(0, Math.min(1, visibleHeight / rect.height));
        return ratio >= (ratioNeeded || 0.35);
      }
      $(function(){ cacheSkillTargets(); resetSkillSection(); });
      if ('IntersectionObserver' in window){
        const io = new IntersectionObserver((entries)=>{
          entries.forEach((ent)=>{
            if (ent.isIntersecting){
              animateSkillSection();
            } else if (ent.intersectionRatio === 0) {
              const rect = ent.boundingClientRect;
              const vh = window.innerHeight || document.documentElement.clientHeight;
              const fullyBelow = rect.top >= vh;
              const fullyAbove = rect.bottom <= 0;
              if (fullyAbove || fullyBelow){
                resetSkillSection();
              }
            }
          });
        }, {
          threshold: [0, 0.35, 0.9],
          rootMargin: '0px 0px -10% 0px'
        });
        io.observe(el);
      } else {
        let ticking = false;
        const onScroll = () => {
          if (!ticking){
            ticking = true;
            requestAnimationFrame(()=>{
              if (isVisibleEnough(0.35)) animateSkillSection();
              else resetSkillSection();
              ticking = false;
            });
          }
        };
        $(document).on('scroll', onScroll);
        $(window).on('resize', onScroll);
        onScroll();
      }
      $(window).on('load', function(){
        requestAnimationFrame(()=>requestAnimationFrame(()=>{
          if (isVisibleEnough(0.2)) animateSkillSection();
        }));
      });
    })();

    // ===== GNB active =====
    function cloneHoverToActiveForGnb() {
      const out = document.createElement('style');
      out.setAttribute('data-gnb-clone', 'true');
      document.head.appendChild(out);
      const sheet = out.sheet;
      const needPrefix = '.gnb';
      const repl = (sel) => sel.replace(/:hover/g, '.active');
      for (const s of Array.from(document.styleSheets)) {
        let rules; try { rules = s.cssRules; } catch { continue; }
        if (!rules) continue;
        for (const r of Array.from(rules)) {
          if (r.type !== CSSRule.STYLE_RULE || !r.selectorText) continue;
          if (r.selectorText.includes(':hover') && r.selectorText.includes(needPrefix)) {
            const sels = r.selectorText.split(',').map(t => t.trim());
            const targetSels = sels
              .filter(t => t.includes(':hover') && t.includes(needPrefix))
              .map(repl);
            if (targetSels.length) {
              try { sheet.insertRule(`${targetSels.join(', ')} { ${r.style.cssText} }`, sheet.cssRules.length); } catch {}
            }
          }
        }
      }
    }

    function setActiveByHash(hash) {
      const $lis = $('.gnb > li');
      $lis.removeClass('active')
          .has(`a[href="${hash}"]`)
          .addClass('active');
    }

    $(function () {
      cloneHoverToActiveForGnb();
      $(".gnb>li>a").on("click", function (e) {
        e.preventDefault();
        if (this.hash !== "") {
          const hash = this.hash;
          $("html,body").animate({ scrollTop: $(hash).offset().top }, 800, function () {
            setActiveByHash(hash);
            history.replaceState(null, '', hash);
          });
        }
      });

      // ScrollSpy
      (function(){
        const $sections = $('section[id]');
        if (!$sections.length) return;
        const $win = $(window);
        let ticking = false;
        function computeAndActivate(){
          const mid = $win.scrollTop() + ($win.height() / 2);
          let bestId = null, bestDist = Infinity;
          $sections.each(function(){
            const $s = $(this);
            const top = $s.offset().top;
            const h = $s.outerHeight() || 0;
            const center = top + h/2;
            const d = Math.abs(center - mid);
            if (d < bestDist) { bestDist = d; bestId = this.id; }
          });
          if (bestId) setActiveByHash('#' + bestId);
          ticking = false;
        }
        function onScroll(){
          if (!ticking){
            ticking = true;
            requestAnimationFrame(computeAndActivate);
          }
        }
        $(document).on('scroll', onScroll);
        $(window).on('resize', onScroll);
        onScroll();
      })();

      if (location.hash) setActiveByHash(location.hash);
      else {
        const first = $('section[id]').first().attr('id');
        if (first) setActiveByHash('#'+first);
      }
    });





/* ===== Milky Way v3 – Sparkle & Glint (no dust) ===== */
(function(){
  // 캔버스 확보(없으면 생성)
  let cvs = document.getElementById('milkyway');
  if (!cvs) {
    cvs = document.createElement('canvas');
    cvs.id = 'milkyway';
    document.body.prepend(cvs);
  }
  const ctx = cvs.getContext('2d', { alpha: true });

  // ===== CONFIG (먼지 제거 + 반짝임 강화) =====
  const DPR = Math.min(2, window.devicePixelRatio || 1);
  const TOTAL          = 230;     // 전체 수량 (작게 유지 → 먼지 방지)
  const RATIO_GLINT    = 0.26;    // ✦ 스파크(밝은 별) 비율
  const RATIO_MEDIUM   = 0.50;    // 중간 별 비율 (나머지는 작은 별)
  const TW_SIN_MIN     = 0.15;    // 기본 사인 트윙클 하한
  const TW_SIN_MAX     = 0.45;    // 기본 사인 트윙클 상한(작게: dust 방지)
  const BAND_TILT_DEG  = -20;     // 은하수 약한 기울기
  const BAND_WIDTH     = 0.30;    // 띠 폭
  const BAND_STRENGTH  = 0.22;    // 가중치(0=완전 균일)
  const COLOR_HALO     = [210,230,255]; // 쿨 블루 헤일로
  const Z_GLINT_ROT    = [ -0.25, 0.25 ]; // ✦ 회전속도 범위(rad/s)

  // Poisson 최소간격(blue-noise)
  const MIN_DIST_BASE   = 12;
  const MIN_DIST_SMALL  = 10;
  const MIN_DIST_MED    = 14;
  const MIN_DIST_GLINT  = 18;

  let W=0, H=0, stars=[], t0=performance.now();

  function resize(){
    const w = window.innerWidth, h = window.innerHeight;
    cvs.width  = Math.round(w * DPR);
    cvs.height = Math.round(h * DPR);
    cvs.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:2';
    ctx.setTransform(DPR,0,0,DPR,0,0);
    W=w; H=h;
    initStars();
  }

  function bandWeight(x,y){
    const t = BAND_TILT_DEG*Math.PI/180, cx=W*0.5, cy=H*0.5;
    const xr=(x-cx)*Math.cos(t) - (y-cy)*Math.sin(t);
    const yr=(x-cx)*Math.sin(t) + (y-cy)*Math.cos(t);
    const sigma=(H*BAND_WIDTH)/2;
    const g=Math.exp(-(yr*yr)/(2*sigma*sigma));
    return (1-BAND_STRENGTH) + BAND_STRENGTH*g;
  }

  // 가우시안 펄스: 가끔 강하게 "톡!" 하고 반짝
  function pulse01(frac, center, width){
    // frac ∈ [0,1) 주기 좌표, center=피크 위치(0~1), width=폭
    const x = (frac-center)/width;
    return Math.exp(-x*x*10); // 폭에 따라 날카롭게
  }

  // Poisson disk 샘플링
  function initStars(){
    stars.length = 0;

    const cell = MIN_DIST_BASE / Math.SQRT2;
    const cols = Math.ceil(W/cell), rows = Math.ceil(H/cell);
    const grid = new Array(cols*rows).fill(-1), pts=[];

    function valid(x,y,minD){
      const gx=Math.floor(x/cell), gy=Math.floor(y/cell);
      for(let i=-2;i<=2;i++) for(let j=-2;j<=2;j++){
        const nx=gx+i, ny=gy+j;
        if(nx<0||ny<0||nx>=cols||ny>=rows) continue;
        const k=grid[ny*cols+nx]; if(k<0) continue;
        const p=pts[k], dx=p.x-x, dy=p.y-y;
        if(dx*dx+dy*dy < minD*minD) return false;
      }
      return true;
    }

    const nGlint  = Math.round(TOTAL * RATIO_GLINT);
    const nMedium = Math.round(TOTAL * RATIO_MEDIUM);
    const nSmall  = TOTAL - nGlint - nMedium;

    function spawn(nTarget, type){
      let count = stars.filter(s=>s.type===type).length, guard=0;
      while(count < nTarget && guard++ < nTarget*120){
        const x=Math.random()*W, y=Math.random()*H;
        if(Math.random() > bandWeight(x,y)) continue;

        const minD = type==='glint'? MIN_DIST_GLINT :
                     type==='medium'? MIN_DIST_MED : MIN_DIST_SMALL;
        if(!valid(x,y,minD)) continue;

        // 크기(작은 별도 너무 작지 않게 → 먼지 방지)
        const r =
          type==='glint' ? (Math.random()*1.8 + 1.2) :
          type==='medium'? (Math.random()*1.2 + 0.7) :
                           (Math.random()*0.9 + 0.6);

        // 트윙클(사인) + 가우시안 버스트
        const sinFreq = (Math.random()*1.2 + 0.6); // 0.6~1.8 Hz
        const sinPh   = Math.random()*Math.PI*2;
        const burstPeriod = Math.random()*7 + 5;    // 5~12s
        const burstPhase  = Math.random();          // 0~1
        const burstWidth  = Math.random()*0.07 + 0.06; // 0.06~0.13
        const rotSpeed    = (Math.random()*(Z_GLINT_ROT[1]-Z_GLINT_ROT[0])+Z_GLINT_ROT[0]);

        const s = {
          x,y,r,type,
          sinFreq, sinPh,
          burstPeriod, burstPhase, burstWidth,
          rot: Math.random()*Math.PI*2, rotSpeed
        };

        const idx=pts.push({x,y})-1;
        grid[Math.floor(y/cell)*cols + Math.floor(x/cell)] = idx;
        stars.push(s); count++;
      }
    }

    spawn(nGlint,  'glint');
    spawn(nMedium, 'medium');
    spawn(nSmall,  'small');
  }

  // ✦ 다이아 경로
  function diamond(c, w, h){
    c.beginPath();
    c.moveTo(0,-h); c.lineTo(w,0); c.lineTo(0,h); c.lineTo(-w,0); c.closePath();
  }

  function draw(ms){
    const t = (ms - t0)/1000;
    ctx.clearRect(0,0,W,H);
    ctx.globalCompositeOperation = 'lighter';

    for(const s of stars){
      // 기본 트윙클(작게) + 가우시안 버스트(가끔 크게)
      const sinTerm = (TW_SIN_MIN + (TW_SIN_MAX - TW_SIN_MIN) *
                      (0.5 + 0.5*Math.sin(2*Math.PI*s.sinFreq*t + s.sinPh)));
      const frac = (t/s.burstPeriod + s.burstPhase) % 1;      // 0..1
      const burst = pulse01(frac, 0.08, s.burstWidth);        // 짧은 피크
      const a = Math.min(1.6, sinTerm + burst*0.9);           // 최종 밝기

      // 헤일로 (작은 별엔 아주 얇게)
      const haloR = s.r * (s.type==='glint'? 3.2 : s.type==='medium'? 2.4 : 1.8);
      const [hr,hg,hb] = COLOR_HALO;
      const g = ctx.createRadialGradient(s.x,s.y,0,s.x,s.y,haloR);
      g.addColorStop(0,   `rgba(${hr},${hg},${hb},${Math.min(1, a*0.85)})`);
      g.addColorStop(1.0, `rgba(${hr},${hg},${hb},0)`);
      ctx.fillStyle = g; ctx.globalAlpha = 1;
      ctx.beginPath(); ctx.arc(s.x,s.y,haloR,0,Math.PI*2); ctx.fill();

      // 코어(또렷)
      ctx.globalAlpha = Math.min(1, a);
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(s.x,s.y,s.r*0.75,0,Math.PI*2); ctx.fill();

      // ✦ 스파크: 밝은 별만 아주 얇게, 밝기에 따라 길이/투명도 가변
      if (s.type === 'glint'){
        const len = s.r * (3.8 + a*1.2);
        const th  = s.r * 0.9;
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.rot + s.rotSpeed * t);
        ctx.globalAlpha = Math.min(0.6, 0.35 + a*0.25);

        // 가로 빛
        const g1 = ctx.createLinearGradient(-len,0,len,0);
        g1.addColorStop(0,'rgba(255,255,255,0)');
        g1.addColorStop(0.8,'rgba(255,255,255,1)');
        g1.addColorStop(1,'rgba(255,255,255,0)');
        ctx.fillStyle = g1; diamond(ctx, len, th); ctx.fill();

        // 세로 빛 (90도 회전)
        ctx.rotate(Math.PI/2);
        const g2 = ctx.createLinearGradient(-len,0,len,0);
        g2.addColorStop(0,'rgba(255,255,255,0)');
        g2.addColorStop(0.5,'rgba(255,255,255,1)');
        g2.addColorStop(1,'rgba(255,255,255,0)');
        ctx.fillStyle = g2; diamond(ctx, len, th); ctx.fill();

        ctx.restore();
      }
    }

    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize, { passive:true });
  resize();
  requestAnimationFrame(draw);
})();





  
 







    

}); // end of $(document).ready







/* =========================
   ABOUT – fixed overlay lock (no min-height) + boundary guard
   ========================= */
(function () {
  const pinWrap  = document.querySelector('#about .pin-wrap');
  const sticky   = document.querySelector('#about .pin-inner');
  const swiperEl = document.querySelector('#about .aboutSwiper');
  if (!pinWrap || !sticky || !swiperEl) return;

  try { pinWrap.style.removeProperty('min-height'); } catch(e){}

  /* Swiper */
  const swiper = new Swiper('#about .aboutSwiper', {
    loop: false, speed: 0,
    freeMode: true, freeModeMomentum: false,
    allowTouchMove: true,
    spaceBetween: 28,
    slidesPerView: 4,
    slidesOffsetBefore: 48,
    slidesOffsetAfter: 48,
    breakpoints: {
      0:    { slidesPerView: 1.15, spaceBetween: 14 },
      768:  { slidesPerView: 2.2,  spaceBetween: 20 },
      1280: { slidesPerView: 4.0,  spaceBetween: 28 },
    },
    navigation: {
      nextEl: '#about .about-photos__nav .next',
      prevEl: '#about .about-photos__nav .prev'
    },
    observer: true, observeParents: true, observeSlideChildren: true,
    preloadImages: true, updateOnImagesReady: true, watchSlidesProgress: true
  });

  const updateAll = () => {
    swiper.update();
    swiper.updateSlidesProgress();
    swiper.updateSlidesClasses();
  };
  updateAll();
  swiper.on('imagesReady', updateAll);
  swiper.on('update', updateAll);
  swiper.on('resize', updateAll);
  window.addEventListener('resize', updateAll);

  /* 섹션 가시성/범위 체크 */
  const isAboutVisible = () => {
    const r = pinWrap.getBoundingClientRect();
    return r.bottom > 0 && r.top < window.innerHeight;
  };
  const inAboutScrollRange = () => {
    const start = pinWrap.offsetTop;
    const end   = start + pinWrap.offsetHeight;
    const y     = window.scrollY;
    return y >= start && y < end;
  };

  /* 고정/해제 상태 */
  let isFixed = false;
  let pinnedY = 0;
  let virtualT = 0; // 0~1

  function enterFixed(){
    if (isFixed) return;
    isFixed = true;
    pinnedY = window.scrollY;
    Object.assign(sticky.style, {
      position: 'fixed', top: '0', left: '0', right: '0',
      height: '100vh', zIndex: '10'
    });
  }
  function leaveFixed(){
    if (!isFixed) return;
    isFixed = false;
    Object.assign(sticky.style, {
      position: '', top: '', left: '', right: '', height: '', zIndex: ''
    });
  }

  /* 휠 처리 */
  function normWheel(e){
    let y = e.deltaY, x = e.deltaX;
    if (e.deltaMode === 1){ y *= 16; x *= 16; }
    return (Math.abs(x) > Math.abs(y)) ? x : y;
  }
  function pointerInSticky(e){
    const r = sticky.getBoundingClientRect();
    const x = e.clientX, y = e.clientY;
    return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
  }

  function onWheel(e){
    // ABOUT 가 화면에 없거나(=다른 섹션) 스티키 영역 밖 → 기본 스크롤
    if (!isAboutVisible() || !pointerInSticky(e)) { leaveFixed(); return; }

    // ABOUT 보이는 동안만 고정
    if (!isFixed) enterFixed();

    const d = normWheel(e);
    const down = d > 0;

    // 양 끝이면 고정 해제 → 다음/이전 섹션 통과
    if ((virtualT <= 0 && !down) || (virtualT >= 1 && down)) { leaveFixed(); return; }

    // 세로 스크롤 잠그기
    e.preventDefault(); e.stopPropagation();
    if (window.scrollY !== pinnedY) window.scrollTo(0, pinnedY);

    // 천천히 좌우 이동 + 끝 스냅
    const base = Math.min(0.12, Math.max(0.02, Math.abs(d) / 1200));
    let nextT = virtualT + (down ? base : -base);
    nextT = virtualT + (nextT - virtualT) * 0.6;
    if (down && nextT > 0.94) nextT = 1;
    if (!down && nextT < 0.06) nextT = 0;

    virtualT = Math.min(1, Math.max(0, nextT));

    // 내부 상태 동기화(빈공간 방지)
    swiper.setProgress(virtualT, 0);
    swiper.updateSlidesProgress();
    swiper.updateSlidesClasses();

    try { addImpulse(d); } catch {}
  }

  /* 경계 가드: 스크롤/리사이즈 때 섹션 밖이면 즉시 해제 */
  function boundaryGuard(){
    if (!isAboutVisible() || !inAboutScrollRange()) leaveFixed();
  }
  window.addEventListener('scroll', boundaryGuard, { passive:true });
  window.addEventListener('resize', boundaryGuard);

  /* 고정 중에도 혹시 드리프트 나면 복원 */
  function tick(){
    if (isFixed) {
      if (!isAboutVisible() || !inAboutScrollRange()) { leaveFixed(); }
      else if (window.scrollY !== pinnedY) { window.scrollTo(0, pinnedY); }
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  /* 바인딩 (캡처 단계) */
  ['wheel'].forEach(evt=>{
    window   .addEventListener(evt, onWheel, { passive:false, capture:true });
    pinWrap  .addEventListener(evt, onWheel, { passive:false, capture:true });
    sticky   .addEventListener(evt, onWheel, { passive:false, capture:true });
    swiperEl .addEventListener(evt, onWheel, { passive:false, capture:true });
    const wrapper = swiperEl.querySelector('.swiper-wrapper');
    if (wrapper) wrapper.addEventListener(evt, onWheel, { passive:false, capture:true });
  });

  /* Wiggle (그대로) */
  const cards = Array.from(document.querySelectorAll('#about .photo'));
  const N = cards.length;
  const posX = new Array(N).fill(0), velX = new Array(N).fill(0);
  const posR = new Array(N).fill(0), velR = new Array(N).fill(0);
  const weights = cards.map((_, i) => ((i % 2 === 0) ? 1 : -1) * (0.6 + Math.random()*0.8));
  const maxPx = 14, maxDeg = 2;
  const springX = 0.08, dragX = 0.88;
  const springR = 0.10, dragR = 0.88;

  function addImpulse(d){
    const base = Math.max(-1, Math.min(1, d / 160));
    for (let i=0;i<N;i++){
      const w = weights[i];
      velX[i] += base * w * 6;
      velR[i] += base * w * 0.6;
    }
  }
  function animate(){
    for (let i=0;i<N;i++){
      velX[i] += -posX[i]*springX; velX[i] *= dragX; posX[i] += velX[i];
      velR[i] += -posR[i]*springR; velR[i] *= dragR; posR[i] += velR[i];
      if (posX[i] >  maxPx) posX[i] =  maxPx; else if (posX[i] < -maxPx) posX[i] = -maxPx;
      if (posR[i] >  maxDeg) posR[i] =  maxDeg; else if (posR[i] < -maxDeg) posR[i] = -maxDeg;
      cards[i].style.setProperty('--sway-x',  posX[i].toFixed(2)+'px');
      cards[i].style.setProperty('--sway-rot', posR[i].toFixed(2)+'deg');
    }
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);
})();
