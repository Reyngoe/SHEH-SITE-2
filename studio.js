/* SHEH STUDIO — the founders' edit mode (loads only via #studio or a remembered PIN).
   Talks to the librarian Worker. All writes require X-Studio-Pin; strangers who find
   this file get nothing — the lock lives server-side. */
(function () {
  'use strict';
  var LIB = 'https://sheh-library.jcrack053.workers.dev';
  var KEY = 'shehStudioPin';
  var pin = null;
  try { pin = localStorage.getItem(KEY); } catch (e) {}

  var SECTIONS = {
    illuminations: { label: 'Illuminations (photo)', kinds: ['photo'] },
    manuscripts: { label: 'Manuscripts (writing)', kinds: ['essay', 'pdf', 'link'] },
    longtake: { label: 'The Long Take (video)', kinds: ['video'] }
  };
  var roomEl = document.querySelector('[data-sheh-room]');
  var room = roomEl ? roomEl.getAttribute('data-sheh-room') : null;

  /* ---------- styles ---------- */
  var css = ''
    + '.st-bar{position:fixed;left:50%;transform:translateX(-50%);bottom:14px;z-index:99990;display:flex;gap:.5rem;align-items:center;'
    + 'background:#0f0a06;border:1px solid #C9772E;border-radius:999px;padding:.45rem .7rem;box-shadow:0 6px 24px rgba(0,0,0,.45);}'
    + '.st-bar .st-mk{color:#C9772E;transform:rotate(45deg);display:inline-block;font-size:.7rem;margin:0 .15rem;}'
    + '.st-bar .st-name{font-family:Cinzel,serif;letter-spacing:.14em;font-size:.66rem;color:#ECDCB8;}'
    + '.st-btn{font-family:Cinzel,serif;letter-spacing:.08em;font-size:.72rem;color:#0f0a06;background:#C9772E;border:0;border-radius:999px;'
    + 'padding:.5rem .85rem;cursor:pointer;}'
    + '.st-btn.st-ghost{background:transparent;color:#C9772E;border:1px solid rgba(201,119,46,.55);}'
    + '.st-veil{position:fixed;inset:0;z-index:99991;background:rgba(10,7,4,.82);display:flex;align-items:flex-end;justify-content:center;}'
    + '@media(min-width:640px){.st-veil{align-items:center;}}'
    + '.st-sheet{width:100%;max-width:26rem;max-height:88vh;overflow:auto;background:#171008;border:1px solid rgba(201,119,46,.5);'
    + 'border-radius:14px 14px 0 0;padding:1.2rem 1.1rem 1.4rem;color:#ECDCB8;font-family:"EB Garamond",Georgia,serif;}'
    + '@media(min-width:640px){.st-sheet{border-radius:14px;}}'
    + '.st-sheet h3{font-family:Cinzel,serif;letter-spacing:.1em;font-size:.95rem;color:#C9772E;text-align:center;margin:0 0 1rem;}'
    + '.st-f{margin-bottom:.85rem;}'
    + '.st-f label{display:block;font-size:.82rem;letter-spacing:.04em;color:#c9b58c;margin-bottom:.3rem;font-style:italic;}'
    + '.st-f input,.st-f select,.st-f textarea{width:100%;box-sizing:border-box;background:#0f0a06;color:#ECDCB8;'
    + 'border:1px solid rgba(201,119,46,.45);border-radius:8px;padding:.65rem .7rem;font-family:"EB Garamond",Georgia,serif;font-size:1rem;}'
    + '.st-f textarea{min-height:11rem;line-height:1.5;}'
    + '.st-actions{display:flex;gap:.6rem;margin-top:1.1rem;}'
    + '.st-actions .st-btn{flex:1;padding:.7rem .5rem;font-size:.78rem;}'
    + '.st-err{color:#e08b6d;font-size:.9rem;margin-top:.6rem;text-align:center;min-height:1.2em;}'
    + '.st-toast{position:fixed;top:14px;left:50%;transform:translateX(-50%);z-index:99999;background:#0f0a06;color:#ECDCB8;'
    + 'border:1px solid #C9772E;border-radius:999px;padding:.55rem 1rem;font-family:"EB Garamond",Georgia,serif;font-size:.95rem;'
    + 'box-shadow:0 6px 24px rgba(0,0,0,.45);}'
    + '.st-row{display:flex;gap:.4rem;justify-content:center;align-items:center;margin-top:.55rem;}'
    + '.st-ic{font-family:"EB Garamond",Georgia,serif;font-size:.8rem;color:#ECDCB8;background:#241a0e;border:1px solid rgba(201,119,46,.5);'
    + 'border-radius:6px;padding:.3rem .55rem;cursor:pointer;line-height:1;}'
    + '.st-ic:disabled{opacity:.4;cursor:default;}';
  var styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  /* ---------- tiny ui helpers ---------- */
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  var toastT = null;
  function toast(msg) {
    var t = document.querySelector('.st-toast');
    if (!t) { t = el('div', 'st-toast'); document.body.appendChild(t); }
    t.textContent = msg;
    t.style.display = 'block';
    clearTimeout(toastT);
    toastT = setTimeout(function () { t.style.display = 'none'; }, 2600);
  }
  var veil = null;
  function closeSheet() { if (veil) { veil.remove(); veil = null; } }
  function sheet() {
    closeSheet();
    veil = el('div', 'st-veil');
    var s = el('div', 'st-sheet');
    veil.appendChild(s);
    veil.addEventListener('click', function (e) { if (e.target === veil) closeSheet(); });
    document.body.appendChild(veil);
    return s;
  }
  function field(labelText, inputEl) {
    var f = el('div', 'st-f');
    f.appendChild(el('label', null, labelText));
    f.appendChild(inputEl);
    return f;
  }
  function input(type, val, ph) {
    var i = document.createElement(type === 'textarea' ? 'textarea' : (type === 'select' ? 'select' : 'input'));
    if (i.tagName === 'INPUT') i.type = type;
    if (val != null) i.value = val;
    if (ph) i.placeholder = ph;
    return i;
  }
  function today() { return new Date().toISOString().slice(0, 10); }

  /* ---------- api ---------- */
  function api(path, body, isForm) {
    var opt = { method: 'POST', headers: { 'x-studio-pin': pin || '' } };
    if (isForm) { opt.body = body; }
    else { opt.headers['content-type'] = 'application/json'; opt.body = JSON.stringify(body); }
    return fetch(LIB + path, opt).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (!r.ok) {
          var err = new Error(j.error || ('HTTP ' + r.status));
          err.status = r.status;
          throw err;
        }
        return j;
      });
    });
  }
  function handleAuthErr(err) {
    if (err.status === 401) {
      try { localStorage.removeItem(KEY); } catch (e) {}
      pin = null;
      toast('PIN rejected — studio locked.');
      pinSheet();
      return true;
    }
    if (err.status === 429) { toast('Too many tries. Wait a few minutes.'); return true; }
    return false;
  }

  /* ---------- photo shrink (phone photos -> ~1600px jpeg) ---------- */
  function shrink(file) {
    return new Promise(function (res, rej) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        try {
          var max = 1600, w = img.naturalWidth, h = img.naturalHeight;
          var sc = Math.min(1, max / Math.max(w, h));
          var c = document.createElement('canvas');
          c.width = Math.max(1, Math.round(w * sc));
          c.height = Math.max(1, Math.round(h * sc));
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          c.toBlob(function (b) {
            URL.revokeObjectURL(url);
            if (b) res(b); else rej(new Error('Could not process that image.'));
          }, 'image/jpeg', 0.85);
        } catch (e) { URL.revokeObjectURL(url); rej(e); }
      };
      img.onerror = function () {
        URL.revokeObjectURL(url);
        rej(new Error("Couldn't read that image — try a JPEG or PNG."));
      };
      img.src = url;
    });
  }

  /* ---------- PIN gate ---------- */
  function pinSheet() {
    var s = sheet();
    s.appendChild(el('h3', null, '◆ THE STUDIO'));
    var p = input('password', '', 'Your studio PIN');
    p.autocomplete = 'off';
    s.appendChild(field('Speak, friend.', p));
    var err = el('div', 'st-err');
    var row = el('div', 'st-actions');
    var go = el('button', 'st-btn', 'Unlock');
    var no = el('button', 'st-btn st-ghost', 'Not now');
    row.appendChild(no); row.appendChild(go);
    s.appendChild(row); s.appendChild(err);
    no.addEventListener('click', closeSheet);
    go.addEventListener('click', function () {
      var v = p.value.trim();
      if (!v) { err.textContent = 'Enter the PIN.'; return; }
      go.disabled = true; go.textContent = '…';
      pin = v;
      api('/reorder', { section: 'manuscripts', ids: [] })
        .then(function () {
          try { localStorage.setItem(KEY, v); } catch (e) {}
          closeSheet(); toast('Studio unlocked.'); boot();
        })
        .catch(function (e2) {
          pin = null; go.disabled = false; go.textContent = 'Unlock';
          err.textContent = e2.status === 429 ? 'Too many tries — wait a few minutes.' : 'That PIN was refused.';
        });
    });
    p.addEventListener('keydown', function (e) { if (e.key === 'Enter') go.click(); });
    setTimeout(function () { p.focus(); }, 60);
  }

  /* ---------- ADD ---------- */
  function addSheet(presetSection) {
    var s = sheet();
    s.appendChild(el('h3', null, '◆ ADD TO THE LIBRARY'));
    var secSel = input('select');
    Object.keys(SECTIONS).forEach(function (k) {
      var o = document.createElement('option');
      o.value = k; o.textContent = SECTIONS[k].label;
      secSel.appendChild(o);
    });
    secSel.value = presetSection && SECTIONS[presetSection] ? presetSection : 'illuminations';
    s.appendChild(field('Where does it live?', secSel));

    var kindSel = input('select');
    var kindField = field('What kind?', kindSel);
    s.appendChild(kindField);

    var dyn = el('div');
    s.appendChild(dyn);

    var err = el('div', 'st-err');
    var row = el('div', 'st-actions');
    var cancel = el('button', 'st-btn st-ghost', 'Cancel');
    var save = el('button', 'st-btn', 'Add it');
    row.appendChild(cancel); row.appendChild(save);
    s.appendChild(row); s.appendChild(err);
    cancel.addEventListener('click', closeSheet);

    var f = {};
    function buildFields() {
      dyn.innerHTML = ''; f = {}; err.textContent = '';
      var kind = kindSel.value;
      if (kind === 'photo') {
        f.file = input('file'); f.file.accept = 'image/*';
        f.caption = input('text', '', 'A line under the photo (optional)');
        dyn.appendChild(field('The photo', f.file));
        dyn.appendChild(field('Caption', f.caption));
      } else if (kind === 'essay') {
        f.title = input('text', '', 'Title');
        f.body = input('textarea', '', 'Write it here. Blank line = new paragraph.');
        dyn.appendChild(field('Title', f.title));
        dyn.appendChild(field('The writing', f.body));
      } else if (kind === 'pdf') {
        f.title = input('text', '', 'Title');
        f.file = input('file'); f.file.accept = 'application/pdf';
        dyn.appendChild(field('Title', f.title));
        dyn.appendChild(field('The PDF', f.file));
      } else if (kind === 'link') {
        f.title = input('text', '', 'Title');
        f.url = input('url', '', 'https://…');
        dyn.appendChild(field('Title', f.title));
        dyn.appendChild(field('The link', f.url));
      } else if (kind === 'video') {
        f.title = input('text', '', 'Title (optional)');
        f.youtube = input('text', '', 'YouTube link or video ID');
        dyn.appendChild(field('Title', f.title));
        dyn.appendChild(field('The video', f.youtube));
      }
      f.date = input('date', today());
      dyn.appendChild(field('Date', f.date));
    }
    function buildKinds() {
      kindSel.innerHTML = '';
      var kinds = SECTIONS[secSel.value].kinds;
      kinds.forEach(function (k) {
        var o = document.createElement('option');
        o.value = k; o.textContent = { photo: 'Photo', essay: 'Written piece', pdf: 'PDF', link: 'Outside link', video: 'YouTube video' }[k];
        kindSel.appendChild(o);
      });
      kindField.style.display = kinds.length > 1 ? '' : 'none';
      buildFields();
    }
    secSel.addEventListener('change', buildKinds);
    kindSel.addEventListener('change', buildFields);
    buildKinds();

    save.addEventListener('click', function () {
      err.textContent = '';
      var section = secSel.value, kind = kindSel.value;
      var fd = new FormData();
      fd.append('section', section);
      fd.append('kind', kind);
      fd.append('date', f.date.value || today());
      var prep = Promise.resolve();
      if (kind === 'photo') {
        var pf = f.file.files && f.file.files[0];
        if (!pf) { err.textContent = 'Pick a photo first.'; return; }
        fd.append('caption', f.caption.value.trim());
        prep = shrink(pf).then(function (b) { fd.append('file', b, 'photo.jpg'); });
      } else if (kind === 'essay') {
        if (!f.title.value.trim()) { err.textContent = 'It needs a title.'; return; }
        if (!f.body.value.trim()) { err.textContent = 'It needs the writing.'; return; }
        fd.append('title', f.title.value.trim());
        fd.append('body', f.body.value);
      } else if (kind === 'pdf') {
        var df = f.file.files && f.file.files[0];
        if (!f.title.value.trim()) { err.textContent = 'It needs a title.'; return; }
        if (!df) { err.textContent = 'Pick the PDF.'; return; }
        fd.append('title', f.title.value.trim());
        fd.append('file', df, df.name || 'doc.pdf');
      } else if (kind === 'link') {
        if (!/^https?:\/\//.test(f.url.value.trim())) { err.textContent = 'That link needs to start with http.'; return; }
        fd.append('title', f.title.value.trim());
        fd.append('url', f.url.value.trim());
      } else if (kind === 'video') {
        if (!f.youtube.value.trim()) { err.textContent = 'Paste the YouTube link.'; return; }
        fd.append('title', f.title.value.trim());
        fd.append('youtube', f.youtube.value.trim());
      }
      save.disabled = true; save.textContent = '…';
      prep.then(function () { return api('/add', fd, true); })
        .then(function () { closeSheet(); toast('Added to the library.'); setTimeout(function () { location.reload(); }, 650); })
        .catch(function (e2) {
          save.disabled = false; save.textContent = 'Add it';
          if (!handleAuthErr(e2)) err.textContent = e2.message || 'That did not take. Try again.';
        });
    });
  }

  /* ---------- EDIT ---------- */
  function editSheet(node) {
    var d = node.dataset;
    var s = sheet();
    s.appendChild(el('h3', null, '◆ EDIT'));
    var f = {};
    if (d.kind !== 'photo') { f.title = input('text', d.title || ''); s.appendChild(field('Title', f.title)); }
    if (d.kind === 'photo') { f.caption = input('text', d.caption || ''); s.appendChild(field('Caption', f.caption)); }
    if (d.kind === 'video') { f.youtube = input('text', d.youtube || ''); s.appendChild(field('YouTube link or ID', f.youtube)); }
    if (d.kind === 'link') { f.url = input('url', d.url || ''); s.appendChild(field('The link', f.url)); }
    if (d.kind === 'essay') {
      f.body = input('textarea', '', 'Loading…');
      s.appendChild(field('The writing', f.body));
      fetch(LIB + '/essay/' + encodeURIComponent(d.id))
        .then(function (r) { return r.json(); })
        .then(function (j) { f.body.value = j.body || ''; f.body.placeholder = ''; })
        .catch(function () { f.body.placeholder = 'Could not load the text.'; });
    }
    f.date = input('date', d.date || today());
    s.appendChild(field('Date', f.date));

    var err = el('div', 'st-err');
    var row = el('div', 'st-actions');
    var cancel = el('button', 'st-btn st-ghost', 'Cancel');
    var save = el('button', 'st-btn', 'Save');
    row.appendChild(cancel); row.appendChild(save);
    s.appendChild(row); s.appendChild(err);
    cancel.addEventListener('click', closeSheet);
    save.addEventListener('click', function () {
      var patch = { id: d.id, date: f.date.value || '' };
      if (f.title) patch.title = f.title.value.trim();
      if (f.caption) patch.caption = f.caption.value.trim();
      if (f.youtube) patch.youtube = f.youtube.value.trim();
      if (f.url) patch.url = f.url.value.trim();
      if (f.body) patch.body = f.body.value;
      save.disabled = true; save.textContent = '…';
      api('/update', patch)
        .then(function () { closeSheet(); toast('Saved.'); setTimeout(function () { location.reload(); }, 600); })
        .catch(function (e2) {
          save.disabled = false; save.textContent = 'Save';
          if (!handleAuthErr(e2)) err.textContent = e2.message || 'That did not take.';
        });
    });
  }

  /* ---------- room item controls ---------- */
  var reorderT = null;
  function postOrder() {
    if (!room || !roomEl) return;
    var ids = Array.prototype.map.call(roomEl.querySelectorAll('[data-id]'), function (n) { return n.dataset.id; });
    api('/reorder', { section: room, ids: ids })
      .then(function () { toast('Order saved.'); })
      .catch(function (e2) { if (!handleAuthErr(e2)) toast('Order did not save.'); });
  }
  function decorate(node) {
    if (node.querySelector(':scope > .st-row')) return;
    var row = el('div', 'st-row');
    var up = el('button', 'st-ic', '↑');
    var dn = el('button', 'st-ic', '↓');
    var ed = el('button', 'st-ic', '✎ Edit');
    var rm = el('button', 'st-ic', '✕ Remove');
    [up, dn, ed, rm].forEach(function (b) { row.appendChild(b); });
    node.appendChild(row);
    function guard(fn) {
      return function (e) { e.preventDefault(); e.stopPropagation(); fn(); };
    }
    up.addEventListener('click', guard(function () {
      var prev = node.previousElementSibling;
      if (prev && prev.hasAttribute('data-id')) {
        node.parentNode.insertBefore(node, prev);
        clearTimeout(reorderT); reorderT = setTimeout(postOrder, 900);
      }
    }));
    dn.addEventListener('click', guard(function () {
      var next = node.nextElementSibling;
      if (next && next.hasAttribute('data-id')) {
        node.parentNode.insertBefore(next, node);
        clearTimeout(reorderT); reorderT = setTimeout(postOrder, 900);
      }
    }));
    ed.addEventListener('click', guard(function () { editSheet(node); }));
    rm.addEventListener('click', guard(function () {
      if (!confirm('Remove this from the library? This cannot be undone.')) return;
      api('/remove', { id: node.dataset.id })
        .then(function () {
          toast('Removed.');
          var parent = node.parentNode;
          node.remove();
          if (parent && !parent.querySelector('[data-id]')) setTimeout(function () { location.reload(); }, 500);
        })
        .catch(function (e2) { if (!handleAuthErr(e2)) toast(e2.message || 'Could not remove.'); });
    }));
  }
  function watchRoom() {
    if (!roomEl) return;
    Array.prototype.forEach.call(roomEl.querySelectorAll('[data-id]'), decorate);
    new MutationObserver(function () {
      Array.prototype.forEach.call(roomEl.querySelectorAll('[data-id]'), decorate);
    }).observe(roomEl, { childList: true });
  }

  /* ---------- the bar ---------- */
  function bar() {
    if (document.querySelector('.st-bar')) return;
    var b = el('div', 'st-bar');
    b.appendChild(el('span', 'st-mk', '◆'));
    b.appendChild(el('span', 'st-name', 'STUDIO'));
    var add = el('button', 'st-btn', '+ Add');
    var lock = el('button', 'st-btn st-ghost', 'Lock');
    b.appendChild(add); b.appendChild(lock);
    document.body.appendChild(b);
    add.addEventListener('click', function () { addSheet(room); });
    lock.addEventListener('click', function () {
      try { localStorage.removeItem(KEY); } catch (e) {}
      pin = null;
      toast('Studio locked.');
      setTimeout(function () { location.reload(); }, 500);
    });
  }

  function boot() { bar(); watchRoom(); }

  if (pin) boot();
  else if (location.hash === '#studio') pinSheet();
})();
