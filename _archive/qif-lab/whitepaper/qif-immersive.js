/* ============================================================
   QIF Immersive 3D UI/UX — Scroll Engine, Dictation, Effects

   SECURITY:
   - Zero innerHTML usage — all DOM via createElement/textContent
   - Zero eval() — no dynamic code execution
   - Text extraction via textContent only (inherently safe)
   - Respects prefers-reduced-motion throughout
   ============================================================ */

(function () {
  'use strict';

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ----------------------------------------------------------
     Utility: Create DOM element safely (no innerHTML)
     ---------------------------------------------------------- */
  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (key) {
        if (key === 'textContent') {
          node.textContent = attrs[key];
        } else if (key === 'className') {
          node.className = attrs[key];
        } else if (key.indexOf('on') === 0) {
          node.addEventListener(key.slice(2).toLowerCase(), attrs[key]);
        } else {
          node.setAttribute(key, attrs[key]);
        }
      });
    }
    if (children) {
      children.forEach(function (child) {
        if (typeof child === 'string') {
          node.appendChild(document.createTextNode(child));
        } else if (child) {
          node.appendChild(child);
        }
      });
    }
    return node;
  }

  /* ----------------------------------------------------------
     Effect 1: Hourglass Perspective (Edge Pan)
     Content at top/bottom of viewport gently fans outward
     along rotateX — like pages curling away. Center stays flat.
     ---------------------------------------------------------- */
  function initCurvedMonitor() {
    if (reducedMotion) return;

    var content = document.querySelector('main.content');
    if (!content) return;

    // Collect all direct child blocks that should be affected
    var blocks = content.querySelectorAll(':scope > section, :scope > .quarto-title-block, :scope > #TOC');
    if (!blocks.length) return;

    var ticking = false;
    var vh = window.innerHeight;

    window.addEventListener('resize', function () { vh = window.innerHeight; });

    window.addEventListener('scroll', function () {
      if (!ticking) {
        requestAnimationFrame(function () {
          for (var i = 0; i < blocks.length; i++) {
            var rect = blocks[i].getBoundingClientRect();
            // Center of this block relative to viewport center
            var blockCenter = rect.top + rect.height * 0.5;
            // Normalised: 0 = viewport center, ±1 = viewport edge
            var offset = (blockCenter - vh * 0.5) / (vh * 0.5);
            // Clamp to ±1.2 (allow slight overshoot for blocks partly off-screen)
            offset = Math.max(-1.2, Math.min(1.2, offset));

            // rotateX: positive = top edge tilts away, negative = bottom edge tilts away
            // Quadratic ease — gentle near center, stronger at edges
            var rotateX = offset * Math.abs(offset) * 2.5; // max ±3deg at edges

            // Subtle scale-down at extremes for depth
            var scale = 1 - Math.abs(offset) * 0.015; // min 0.982

            // Slight translateZ push-back at edges
            var tz = -Math.abs(offset) * 12; // max -14px

            blocks[i].style.transform =
              'rotateX(' + rotateX + 'deg) scale(' + scale + ') translateZ(' + tz + 'px)';
          }
          ticking = false;
        });
        ticking = true;
      }
    });
  }

  /* ----------------------------------------------------------
     Effect 4 (addendum): Aurora Hue Shift on Scroll
     ---------------------------------------------------------- */
  function initAuroraScroll() {
    if (reducedMotion) return;

    var ticking = false;
    window.addEventListener('scroll', function () {
      if (!ticking) {
        requestAnimationFrame(function () {
          var scrollY = window.scrollY;
          var docHeight = document.documentElement.scrollHeight - window.innerHeight;
          var progress = docHeight > 0 ? scrollY / docHeight : 0;

          // Shift hue based on scroll: 0deg at top, 30deg at bottom
          var hueShift = progress * 30;
          document.body.style.filter = 'hue-rotate(' + hueShift + 'deg)';

          ticking = false;
        });
        ticking = true;
      }
    });
  }

  /* ----------------------------------------------------------
     Effect 5: Inject Particle DOM Elements (CSS handles animation)
     ---------------------------------------------------------- */
  function initParticles() {
    if (reducedMotion) return;

    var container = el('div', { className: 'qif-particles' });
    for (var i = 0; i < 15; i++) {
      container.appendChild(el('div', { className: 'qif-particle' }));
    }
    document.body.appendChild(container);
  }

  /* ----------------------------------------------------------
     Effect 9: Inject Noise/Grain SVG Overlay
     ---------------------------------------------------------- */
  function initNoiseOverlay() {
    var svgNS = 'http://www.w3.org/2000/svg';

    var svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.setAttribute('class', 'qif-noise-overlay');

    var filter = document.createElementNS(svgNS, 'filter');
    filter.setAttribute('id', 'qif-noise-filter');

    var turbulence = document.createElementNS(svgNS, 'feTurbulence');
    turbulence.setAttribute('type', 'fractalNoise');
    turbulence.setAttribute('baseFrequency', '0.65');
    turbulence.setAttribute('numOctaves', '3');
    turbulence.setAttribute('stitchTiles', 'stitch');
    filter.appendChild(turbulence);

    svg.appendChild(filter);

    var rect = document.createElementNS(svgNS, 'rect');
    rect.setAttribute('width', '100%');
    rect.setAttribute('height', '100%');
    rect.setAttribute('filter', 'url(#qif-noise-filter)');
    svg.appendChild(rect);

    document.body.appendChild(svg);
  }

  /* ----------------------------------------------------------
     Effect 7: Scroll-Triggered Section Reveals
     ---------------------------------------------------------- */
  function initSectionReveals() {
    if (reducedMotion) {
      // Show everything immediately
      document.querySelectorAll('section').forEach(function (s) {
        s.classList.add('qif-visible');
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('qif-visible');
          }
        });
      },
      { threshold: 0.2 }
    );

    document.querySelectorAll('section').forEach(function (section) {
      observer.observe(section);
    });
  }

  /* ----------------------------------------------------------
     Phase 3: Auto-Dictation (Web Speech API)
     ---------------------------------------------------------- */
  var dictation = {
    enabled: false,
    currentSection: null,
    utterance: null,
    synth: window.speechSynthesis || null,
    rate: 1.0,
    pitch: 1.0,
    voiceName: null,
    settingsVisible: false
  };

  // Preferred voices in order
  var preferredVoices = [
    'Google UK English Female',
    'Samantha',
    'Daniel',
    'Google US English',
    'Alex'
  ];

  function getPreferredVoice() {
    if (!dictation.synth) return null;

    var voices = dictation.synth.getVoices();
    if (!voices.length) return null;

    // If user selected a voice
    if (dictation.voiceName) {
      var selected = voices.find(function (v) { return v.name === dictation.voiceName; });
      if (selected) return selected;
    }

    // Try preferred voices
    for (var i = 0; i < preferredVoices.length; i++) {
      var match = voices.find(function (v) {
        return v.name.indexOf(preferredVoices[i]) !== -1;
      });
      if (match) return match;
    }

    // Prefer local voices for privacy
    var localVoice = voices.find(function (v) { return v.localService; });
    return localVoice || voices[0];
  }

  function extractReadableText(section) {
    // Clone to avoid modifying DOM
    var clone = section.cloneNode(true);

    // Remove code blocks, tables, figure captions, LaTeX
    var removeSelectors = [
      '.sourceCode', 'pre', 'code', 'table', 'figcaption',
      '.math', '.MathJax', '.katex', 'svg', '.cell-code',
      '.callout-note .callout-header', 'script', 'style'
    ];
    removeSelectors.forEach(function (sel) {
      clone.querySelectorAll(sel).forEach(function (el) { el.remove(); });
    });

    // Get text, collapse whitespace
    var text = clone.textContent || '';
    text = text.replace(/\s+/g, ' ').trim();

    return text;
  }

  function speakSection(section) {
    if (!dictation.synth || !dictation.enabled) return;

    // Cancel previous
    dictation.synth.cancel();

    // Remove reading class from previous
    if (dictation.currentSection) {
      dictation.currentSection.classList.remove('qif-reading');
    }

    dictation.currentSection = section;
    section.classList.add('qif-reading');

    var text = extractReadableText(section);
    if (!text || text.length < 10) return;

    var utt = new SpeechSynthesisUtterance(text);
    utt.rate = dictation.rate;
    utt.pitch = dictation.pitch;

    var voice = getPreferredVoice();
    if (voice) {
      utt.voice = voice;
      // Prefer local for privacy
      if (voice.localService === false) {
        utt.voice = voice; // still use it, but the UI discloses this
      }
    }

    utt.onend = function () {
      if (section === dictation.currentSection) {
        section.classList.remove('qif-reading');
      }
    };

    dictation.utterance = utt;
    dictation.synth.speak(utt);
  }

  function initDictationObserver() {
    var observer = new IntersectionObserver(
      function (entries) {
        if (!dictation.enabled) return;

        // Find the entry most centered in viewport
        var best = null;
        var bestRatio = 0;
        entries.forEach(function (entry) {
          if (entry.isIntersecting && entry.intersectionRatio > bestRatio) {
            best = entry.target;
            bestRatio = entry.intersectionRatio;
          }
        });

        if (best && best !== dictation.currentSection) {
          speakSection(best);
        }
      },
      {
        threshold: [0.2, 0.5, 0.8],
        rootMargin: '-30% 0px -30% 0px' // Center of viewport
      }
    );

    document.querySelectorAll('section').forEach(function (section) {
      observer.observe(section);
    });
  }

  function toggleDictation() {
    dictation.enabled = !dictation.enabled;

    // Update button
    var btn = document.querySelector('.qif-dictation-toggle');
    if (btn) {
      btn.textContent = dictation.enabled ? '\uD83D\uDD0A' : '\uD83D\uDD07';
      btn.classList.toggle('active', dictation.enabled);
    }

    // Persist
    try { localStorage.setItem('qif-dictation', dictation.enabled ? '1' : '0'); } catch (e) { /* noop */ }

    if (!dictation.enabled) {
      if (dictation.synth) dictation.synth.cancel();
      if (dictation.currentSection) {
        dictation.currentSection.classList.remove('qif-reading');
        dictation.currentSection = null;
      }
    }
  }

  function toggleSettings() {
    dictation.settingsVisible = !dictation.settingsVisible;
    var panel = document.querySelector('.qif-dictation-settings');
    if (panel) {
      panel.classList.toggle('visible', dictation.settingsVisible);
    }
  }

  function buildDictationUI() {
    if (!window.speechSynthesis) return;

    // Toggle button
    var isOn = false;
    try { isOn = localStorage.getItem('qif-dictation') === '1'; } catch (e) { /* noop */ }

    var btn = el('button', {
      className: 'qif-dictation-toggle' + (isOn ? ' active' : ''),
      textContent: isOn ? '\uD83D\uDD0A' : '\uD83D\uDD07',
      title: 'Toggle Dictation (Alt+D)',
      onClick: function () { toggleDictation(); }
    });

    // Long-press for settings
    var pressTimer = null;
    btn.addEventListener('mousedown', function () {
      pressTimer = setTimeout(function () {
        toggleSettings();
        pressTimer = null;
      }, 500);
    });
    btn.addEventListener('mouseup', function () {
      if (pressTimer) clearTimeout(pressTimer);
    });
    btn.addEventListener('mouseleave', function () {
      if (pressTimer) clearTimeout(pressTimer);
    });

    document.body.appendChild(btn);

    // Settings popover
    var rateLabel = el('label', { textContent: 'Speed' });
    var rateInput = el('input', {
      type: 'range',
      min: '0.5',
      max: '2.0',
      step: '0.1',
      value: '1.0',
      onInput: function (e) { dictation.rate = parseFloat(e.target.value); }
    });

    var pitchLabel = el('label', { textContent: 'Pitch' });
    var pitchInput = el('input', {
      type: 'range',
      min: '0.5',
      max: '2.0',
      step: '0.1',
      value: '1.0',
      onInput: function (e) { dictation.pitch = parseFloat(e.target.value); }
    });

    var voiceLabel = el('label', { textContent: 'Voice' });
    var voiceSelect = el('select', {
      onChange: function (e) { dictation.voiceName = e.target.value; }
    });

    // Populate voices (may load async)
    function populateVoices() {
      var voices = (dictation.synth && dictation.synth.getVoices()) || [];
      // Clear
      while (voiceSelect.firstChild) voiceSelect.removeChild(voiceSelect.firstChild);

      var defaultOpt = el('option', { value: '', textContent: 'Auto (best available)' });
      voiceSelect.appendChild(defaultOpt);

      voices.forEach(function (v) {
        var label = v.name + (v.localService ? ' (local)' : ' (cloud)');
        var opt = el('option', { value: v.name, textContent: label });
        voiceSelect.appendChild(opt);
      });
    }

    populateVoices();
    if (dictation.synth && dictation.synth.onvoiceschanged !== undefined) {
      dictation.synth.onvoiceschanged = populateVoices;
    }

    var privacyNote = el('div', {
      className: 'qif-privacy-note',
      textContent: 'Note: Some browsers send text to cloud services for speech synthesis. Voices marked "(local)" process on-device.'
    });

    var panel = el('div', { className: 'qif-dictation-settings' }, [
      rateLabel, rateInput,
      pitchLabel, pitchInput,
      voiceLabel, voiceSelect,
      privacyNote
    ]);

    document.body.appendChild(panel);

    // Keyboard shortcut: Alt+D
    document.addEventListener('keydown', function (e) {
      if (e.altKey && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault();
        toggleDictation();
      }
    });

    // Restore state
    if (isOn) {
      dictation.enabled = true;
    }
  }

  /* ----------------------------------------------------------
     Audio Player: Pre-generated Kokoro TTS narration
     Loads manifest.json from audio/ dir, plays per-section audio
     ---------------------------------------------------------- */
  var audioPlayer = {
    manifest: null,
    audio: null,
    currentIndex: -1,
    playing: false,
    enabled: false,
    sectionMap: {},     // section id -> manifest index
    ui: {}
  };

  function initAudioPlayer() {
    // Try to load manifest
    var basePath = '';
    // Detect base path — works for both local file and served
    var scripts = document.querySelectorAll('script');
    // Audio files are relative to the HTML
    basePath = 'audio/';

    fetch(basePath + 'manifest.json')
      .then(function (r) { return r.json(); })
      .catch(function () { return null; })
      .then(function (data) {
        if (!data || !data.sections || !data.sections.length) {
          // No audio available — don't show player
          return;
        }
        audioPlayer.manifest = data;
        audioPlayer.basePath = basePath;

        // Build section id -> index map
        data.sections.forEach(function (s, i) {
          audioPlayer.sectionMap[s.id] = i;
        });

        buildAudioUI();
        initAudioScrollObserver();
      });
  }

  function buildAudioUI() {
    // Toggle button (shows when player is hidden)
    var toggle = el('button', {
      className: 'qif-audio-toggle',
      textContent: '\uD83C\uDFA7',
      title: 'Listen to narration (Kokoro AI)',
      onClick: function () { showAudioPlayer(); }
    });

    // Player bar
    var playBtn = el('button', {
      className: 'qif-audio-btn',
      textContent: '\u25B6',
      title: 'Play / Pause',
      onClick: function () { toggleAudioPlayback(); }
    });

    var titleEl = el('div', { className: 'qif-audio-title', textContent: 'Ready to narrate' });
    var modelEl = el('div', { className: 'qif-audio-model', textContent: 'Kokoro TTS \u00B7 Open Source (Apache 2.0)' });
    var progressFill = el('div', { className: 'qif-audio-progress-fill' });
    var progressBar = el('div', { className: 'qif-audio-progress' }, [progressFill]);

    // Click on progress bar to seek
    progressBar.addEventListener('click', function (e) {
      if (!audioPlayer.audio) return;
      var rect = progressBar.getBoundingClientRect();
      var pct = (e.clientX - rect.left) / rect.width;
      audioPlayer.audio.currentTime = pct * audioPlayer.audio.duration;
    });

    var infoEl = el('div', { className: 'qif-audio-info' }, [titleEl, modelEl, progressBar]);

    var closeBtn = el('button', {
      className: 'qif-audio-btn',
      textContent: '\u2715',
      title: 'Close player',
      onClick: function () { hideAudioPlayer(); }
    });

    var player = el('div', { className: 'qif-audio-player hidden' }, [playBtn, infoEl, closeBtn]);

    document.body.appendChild(toggle);
    document.body.appendChild(player);

    audioPlayer.ui = {
      toggle: toggle,
      player: player,
      playBtn: playBtn,
      title: titleEl,
      progressFill: progressFill
    };
  }

  function showAudioPlayer() {
    audioPlayer.enabled = true;
    audioPlayer.ui.toggle.style.display = 'none';
    audioPlayer.ui.player.classList.remove('hidden');
  }

  function hideAudioPlayer() {
    audioPlayer.enabled = false;
    if (audioPlayer.audio) {
      audioPlayer.audio.pause();
      audioPlayer.playing = false;
    }
    audioPlayer.ui.player.classList.add('hidden');
    audioPlayer.ui.toggle.style.display = '';
    audioPlayer.ui.toggle.classList.remove('active');
    audioPlayer.ui.playBtn.textContent = '\u25B6';
    audioPlayer.ui.playBtn.classList.remove('playing');
  }

  function playSection(index) {
    if (!audioPlayer.manifest) return;
    var sections = audioPlayer.manifest.sections;
    if (index < 0 || index >= sections.length) return;

    var section = sections[index];
    audioPlayer.currentIndex = index;

    // Stop current
    if (audioPlayer.audio) {
      audioPlayer.audio.pause();
      audioPlayer.audio.removeEventListener('timeupdate', updateProgress);
      audioPlayer.audio.removeEventListener('ended', onAudioEnded);
    }

    audioPlayer.ui.title.textContent = section.title;

    var audio = new Audio(audioPlayer.basePath + section.file);
    audioPlayer.audio = audio;

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('ended', onAudioEnded);

    audio.play().then(function () {
      audioPlayer.playing = true;
      audioPlayer.ui.playBtn.textContent = '\u275A\u275A';
      audioPlayer.ui.playBtn.classList.add('playing');

      // Highlight the section in the document
      var docSection = document.getElementById(section.id);
      if (docSection) {
        // Remove previous highlights
        document.querySelectorAll('section.qif-reading').forEach(function (s) {
          s.classList.remove('qif-reading');
        });
        docSection.classList.add('qif-reading');
      }
    }).catch(function () {
      // Autoplay blocked — user needs to click
      audioPlayer.ui.title.textContent = 'Click play: ' + section.title;
    });
  }

  function toggleAudioPlayback() {
    if (!audioPlayer.audio || audioPlayer.currentIndex === -1) {
      // Start from first section or current scroll position
      var idx = findCurrentScrollSection();
      playSection(idx >= 0 ? idx : 0);
      return;
    }

    if (audioPlayer.playing) {
      audioPlayer.audio.pause();
      audioPlayer.playing = false;
      audioPlayer.ui.playBtn.textContent = '\u25B6';
      audioPlayer.ui.playBtn.classList.remove('playing');
    } else {
      audioPlayer.audio.play();
      audioPlayer.playing = true;
      audioPlayer.ui.playBtn.textContent = '\u275A\u275A';
      audioPlayer.ui.playBtn.classList.add('playing');
    }
  }

  function updateProgress() {
    if (!audioPlayer.audio || !audioPlayer.audio.duration) return;
    var pct = (audioPlayer.audio.currentTime / audioPlayer.audio.duration) * 100;
    audioPlayer.ui.progressFill.style.width = pct + '%';
  }

  function onAudioEnded() {
    // Auto-advance to next section
    var next = audioPlayer.currentIndex + 1;
    if (audioPlayer.manifest && next < audioPlayer.manifest.sections.length) {
      playSection(next);
      // Scroll to that section
      var sectionId = audioPlayer.manifest.sections[next].id;
      var docSection = document.getElementById(sectionId);
      if (docSection) {
        docSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else {
      // End of whitepaper
      audioPlayer.playing = false;
      audioPlayer.ui.playBtn.textContent = '\u25B6';
      audioPlayer.ui.playBtn.classList.remove('playing');
      audioPlayer.ui.title.textContent = 'Narration complete';
      audioPlayer.ui.progressFill.style.width = '100%';
      document.querySelectorAll('section.qif-reading').forEach(function (s) {
        s.classList.remove('qif-reading');
      });
    }
  }

  function findCurrentScrollSection() {
    if (!audioPlayer.manifest) return -1;
    var vh = window.innerHeight;
    var best = -1;
    var bestDist = Infinity;

    audioPlayer.manifest.sections.forEach(function (s, i) {
      var docSection = document.getElementById(s.id);
      if (!docSection) return;
      var rect = docSection.getBoundingClientRect();
      var center = rect.top + rect.height * 0.5;
      var dist = Math.abs(center - vh * 0.5);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    });
    return best;
  }

  function initAudioScrollObserver() {
    // When user scrolls to a new section and audio is playing, auto-switch
    var observer = new IntersectionObserver(
      function (entries) {
        if (!audioPlayer.enabled || !audioPlayer.playing) return;

        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var sectionId = entry.target.id;
          var idx = audioPlayer.sectionMap[sectionId];
          if (idx !== undefined && idx !== audioPlayer.currentIndex) {
            playSection(idx);
          }
        });
      },
      {
        threshold: 0.4,
        rootMargin: '-20% 0px -20% 0px'
      }
    );

    audioPlayer.manifest.sections.forEach(function (s) {
      var docSection = document.getElementById(s.id);
      if (docSection) observer.observe(docSection);
    });
  }

  /* ----------------------------------------------------------
     Collapsible Callouts
     Click header to expand/collapse. Starts collapsed.
     ---------------------------------------------------------- */
  function initCollapsibleCallouts() {
    var callouts = document.querySelectorAll('.callout');
    callouts.forEach(function (callout) {
      var header = callout.querySelector('.callout-header');
      var body = callout.querySelector('.callout-body-container');
      if (!header || !body) return;

      callout.classList.add('qif-collapsible');
      callout.classList.add('qif-collapsed'); // start collapsed

      // Add hint label
      var hint = el('span', { className: 'qif-collapse-hint', textContent: 'click to expand' });
      var arrow = el('span', { className: 'qif-collapse-arrow', textContent: '\u25BC' });
      header.appendChild(hint);
      header.appendChild(arrow);

      // Measure real height for smooth animation
      var fullHeight = body.scrollHeight;

      header.addEventListener('click', function (e) {
        e.stopPropagation();
        var isCollapsed = callout.classList.toggle('qif-collapsed');
        hint.textContent = isCollapsed ? 'click to expand' : 'click to collapse';

        if (!isCollapsed) {
          // Expanding — set explicit max-height for smooth transition
          body.style.maxHeight = body.scrollHeight + 'px';
          // After transition, remove constraint so content can reflow
          setTimeout(function () {
            if (!callout.classList.contains('qif-collapsed')) {
              body.style.maxHeight = 'none';
            }
          }, 400);
        } else {
          // Collapsing — set current height first so transition has a start value
          body.style.maxHeight = body.scrollHeight + 'px';
          // Force reflow then collapse
          body.offsetHeight; // trigger reflow
          body.style.maxHeight = '0';
        }
      });
    });
  }

  /* ----------------------------------------------------------
     Init: Wire everything up on DOMContentLoaded
     ---------------------------------------------------------- */
  function init() {
    initCurvedMonitor();
    initAuroraScroll();
    initParticles();
    initNoiseOverlay();
    initSectionReveals();
    initCollapsibleCallouts();
    initAudioPlayer();
    buildDictationUI();
    initDictationObserver();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
