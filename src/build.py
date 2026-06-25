#!/usr/bin/env python3
"""Rebuilds index.html from src/sections/*.html. Run: python3 src/build.py"""
import os, re

HERE   = os.path.dirname(os.path.abspath(__file__))
SECDIR = os.path.join(HERE, "sections")
OUT    = os.path.join(HERE, "..", "index.html")

# scroll order — News sits in the dark wing, below The Creed
SECTIONS = [
    ("hero",         "Home",          "hero.html"),
    ("manuscripts",  "Manuscripts",   "manuscripts.html"),
    ("illuminations","Illuminations", "illuminations.html"),
    ("longtake",     "The Long Take", "longtake.html"),
    ("story",        "Our Story",     "story-door.html"),
    ("creed",        "The Creed",     "creed-door.html"),
    ("news",         "News",          "news.html"),
    ("social",       "Social",        "social.html"),
    ("join",         "Join",          "join.html"),
    ("footer",       None,            "footer.html"),
]

# doors -> room pages (sit at repo root)
ROOMS = {
    'class="story" href="#"': 'class="story" href="our-story.html"',
    'class="creed" href="#"': 'class="creed" href="the-creed.html"',
}

def extract(html):
    s = re.search(r'<style[^>]*>(.*?)</style>', html, re.S)
    b = re.search(r'<body[^>]*>(.*?)</body>', html, re.S)
    return (s.group(1) if s else ''), (b.group(1) if b else '')

def split_rules(css):
    i, n, out = 0, len(css), []
    while i < n:
        while i < n and css[i].isspace(): i += 1
        if i >= n: break
        if css[i:i+2] == '/*':
            e = css.find('*/', i+2)
            if e == -1: break
            i = e + 2; continue
        ps = i
        while i < n and css[i] not in '{;': i += 1
        if i >= n: break
        if css[i] == ';':
            out.append(('stmt', css[ps:i].strip(), None)); i += 1; continue
        prelude = css[ps:i].strip()
        depth, bs = 0, i + 1
        while i < n:
            c = css[i]
            if c == '{': depth += 1
            elif c == '}':
                depth -= 1
                if depth == 0: break
            i += 1
        out.append(('block', prelude, css[bs:i])); i += 1
    return out

def map_part(p, pre):
    p = p.strip()
    if not p: return ''
    if p == ':root': return pre
    if p == '*': return pre + ' *'
    for tag in ('html', 'body'):
        if p == tag: return pre
        if p.startswith(tag) and len(p) > len(tag) and p[len(tag)] in ' .:[#,>+~':
            return pre + p[len(tag):]
    return pre + ' ' + p

def prefix_sel(sel, pre):
    return ', '.join(map_part(x, pre) for x in sel.split(',') if x.strip())

def transform(css, pre):
    scoped, glob = [], []
    for kind, prelude, block in split_rules(css):
        if kind == 'stmt':
            glob.append(prelude + ';'); continue
        low = prelude.lower()
        if low.startswith(('@keyframes', '@-webkit-keyframes', '@font-face', '@font-feature', '@page')):
            glob.append(prelude + '{' + block + '}')
        elif low.startswith(('@media', '@supports')):
            ins, ing = transform(block, pre)
            scoped.append(prelude + '{\n' + ins + '\n}')
            glob.extend(ing)
        else:
            scoped.append(prefix_sel(prelude, pre) + '{' + block + '}')
    return '\n'.join(scoped), glob

all_scoped, all_glob, panels = [], [], []
for sid, label, fn in SECTIONS:
    with open(os.path.join(SECDIR, fn), encoding='utf-8') as f:
        html = f.read()
    for a, b in ROOMS.items():
        html = html.replace(a, b)
    style, body = extract(html)
    sc, gl = transform(style, '#' + sid)
    all_scoped.append('/* ===== ' + sid + ' ===== */\n' + sc)
    all_glob.extend(gl)
    panels.append('<section class="panel" id="' + sid + '">\n' + body.strip() + '\n</section>')

seen, glob_u = set(), []
for g in all_glob:
    if g.strip() not in seen:
        seen.add(g.strip()); glob_u.append(g)

nav = '\n      '.join('<a href="#' + sid + '">' + label + '</a>'
                     for sid, label, _ in SECTIONS if label)

BASE = """  *{ margin:0; padding:0; box-sizing:border-box; }
  html{ scroll-behavior:smooth; }
  html,body{ overflow-x:hidden; }
  body{ background:#0f0a06; font-family:'EB Garamond',Georgia,serif; }
  .panel{ position:relative; width:100%; }

  .menu-btn{ position:fixed; top:clamp(.9rem,2.5vw,1.4rem); right:clamp(.9rem,2.5vw,1.4rem); z-index:1000;
    width:46px; height:46px; border-radius:50%; cursor:pointer;
    background:rgba(15,10,6,.55); border:1px solid rgba(201,119,46,.5); -webkit-backdrop-filter:blur(6px); backdrop-filter:blur(6px);
    display:flex; flex-direction:column; align-items:center; justify-content:center; gap:5px;
    transition:border-color .2s ease, background .2s ease; }
  .menu-btn:hover{ border-color:#C9772E; background:rgba(15,10,6,.78); }
  .menu-btn span{ display:block; width:19px; height:1.6px; background:#E6D1A4; border-radius:2px;
    transition:transform .28s ease, opacity .2s ease; }
  .menu-btn.open span:nth-child(1){ transform:translateY(6.6px) rotate(45deg); }
  .menu-btn.open span:nth-child(2){ opacity:0; }
  .menu-btn.open span:nth-child(3){ transform:translateY(-6.6px) rotate(-45deg); }

  .menu-overlay{ position:fixed; inset:0; z-index:999;
    background:radial-gradient(120% 85% at 50% 0%, #1d160e 0%, #0b0704 100%);
    display:flex; flex-direction:column; align-items:center; justify-content:center;
    opacity:0; visibility:hidden; transition:opacity .32s ease, visibility .32s ease; }
  .menu-overlay.open{ opacity:1; visibility:visible; }
  .menu-orn{ display:flex; align-items:center; gap:1rem; margin-bottom:clamp(1.8rem,5vw,2.6rem); }
  .menu-orn .line{ height:1px; width:clamp(40px,12vw,72px); background:linear-gradient(90deg,transparent,rgba(201,119,46,.5)); }
  .menu-orn .line.r{ background:linear-gradient(90deg,rgba(201,119,46,.5),transparent); }
  .menu-orn .mark{ color:#C9772E; transform:rotate(45deg); font-size:.72rem; }
  .menu-nav{ display:flex; flex-direction:column; align-items:center; gap:clamp(.65rem,2.3vw,1.1rem); }
  .menu-nav a{ font-family:'Cinzel',serif; font-weight:600; text-transform:uppercase; letter-spacing:.18em; padding-left:.18em;
    font-size:clamp(1.05rem,3.6vw,1.5rem); color:#E6D1A4; text-decoration:none; transition:color .18s ease; }
  .menu-nav a:hover{ color:#F6E8C9; }
  .menu-foot{ margin-top:clamp(2rem,5vw,2.8rem); font-family:'Cinzel',serif; font-weight:500; text-transform:uppercase;
    letter-spacing:.28em; padding-left:.28em; font-size:.66rem; color:rgba(201,119,46,.9); }
  @media (prefers-reduced-motion: reduce){ html{ scroll-behavior:auto; } .menu-btn span,.menu-overlay{ transition:none; } }"""

DOC = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>S.H.E.H \u2014 Start Hard. End Hard.</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700;800;900&family=EB+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600&display=swap" rel="stylesheet">
<style>
__BASE__

/* ============ global keyframes (lifted from sections) ============ */
__GLOB__

/* ============ per-section scoped styles ============ */
__SCOPED__
</style>
</head>
<body>

  <div class="menu-btn" id="menuBtn" role="button" tabindex="0" aria-label="Open menu"><span></span><span></span><span></span></div>
  <nav class="menu-overlay" id="menuOverlay" aria-label="Site">
    <div class="menu-orn"><span class="line"></span><span class="mark">\u25C6</span><span class="line r"></span></div>
    <div class="menu-nav">
      __NAV__
    </div>
    <div class="menu-foot">Start Hard. End Hard.</div>
  </nav>

__PANELS__

  <script>
    (function(){
      var btn=document.getElementById('menuBtn'), ov=document.getElementById('menuOverlay');
      function close(){ btn.classList.remove('open'); ov.classList.remove('open'); }
      function toggle(){ btn.classList.contains('open') ? close() : (btn.classList.add('open'), ov.classList.add('open')); }
      btn.addEventListener('click', toggle);
      btn.addEventListener('keydown', function(e){ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); toggle(); } });
      Array.prototype.forEach.call(document.querySelectorAll('.menu-nav a'), function(a){ a.addEventListener('click', close); });
      document.addEventListener('keydown', function(e){ if(e.key==='Escape') close(); });
    })();
  </script>

</body>
</html>
"""

out = (DOC.replace("__BASE__", BASE)
          .replace("__GLOB__", "\n".join(glob_u))
          .replace("__SCOPED__", "\n\n".join(all_scoped))
          .replace("__NAV__", nav)
          .replace("__PANELS__", "\n\n".join(panels)))

with open(OUT, "w", encoding="utf-8") as f:
    f.write(out)
print("Built", os.path.relpath(OUT, HERE), "-", round(len(out)/1024,1), "KB")
