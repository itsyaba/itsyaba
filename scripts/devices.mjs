// The device each project lives in (a phone for apps, a browser for sites,
// a terminal for tools, a monitor for setups) with a small shapes-only
// screen that moves. No fake text, only shapes.

const r1 = (n) => Math.round(n * 10) / 10
const rect = (x, y, w, h, rx, fill, extra = "") =>
  `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" rx="${r1(rx)}" fill="${fill}" ${extra}/>`

function phoneFrame(t, b) {
  const h = b.h - 26
  const w = h * 0.52
  const x = b.x + (b.w - w) / 2
  const y = b.y + 13
  const s = { x: x + 5, y: y + 5, w: w - 10, h: h - 10 }
  return {
    s,
    under: `${rect(x, y + 3, w, h, w * 0.2, t.shade)}${rect(x, y, w, h, w * 0.2, t.glass, `stroke="${t.line}"`)}${rect(s.x, s.y, s.w, s.h, w * 0.16, t.screen)}`,
    over: rect(x + w / 2 - w * 0.17, s.y + 5, w * 0.34, 8, 4, "#000"),
  }
}

function windowFrame(t, b, dark) {
  const w = b.w - 30
  const h = Math.min(b.h - 30, w * 0.72)
  const x = b.x + 15
  const y = b.y + (b.h - h) / 2
  const bar = 22
  const s = { x: x + 1, y: y + bar, w: w - 2, h: h - bar - 1 }
  const bg = dark ? "#151a2e" : t.glass
  const dots = [0, 1, 2].map((i) => `<circle cx="${r1(x + 13 + i * 11)}" cy="${y + bar / 2}" r="3.4" fill="${dark ? "#3a4266" : t.line}"/>`).join("")
  return {
    s,
    under: `${rect(x, y + 3, w, h, 12, t.shade)}${rect(x, y, w, h, 12, bg, `stroke="${dark ? "#2a3150" : t.line}"`)}${dots}${dark ? "" : rect(x + 52, y + 6, w - 70, 10, 5, t.screen)}${rect(s.x, s.y, s.w, s.h, 0, dark ? "#0c1020" : t.screen, 'clip-path="none"')}`,
    over: "",
  }
}

function monitorFrame(t, b) {
  const w = b.w - 34
  const h = w * 0.6
  const x = b.x + 17
  const y = b.y + (b.h - h - 22) / 2
  const s = { x: x + 6, y: y + 6, w: w - 12, h: h - 12 }
  return {
    s,
    under: `${rect(x + w / 2 - 6, y + h, 12, 14, 0, t.line)}${rect(x + w / 2 - 30, y + h + 12, 60, 6, 3, t.line)}${rect(x, y + 3, w, h, 10, t.shade)}${rect(x, y, w, h, 10, t.glass, `stroke="${t.line}"`)}${rect(s.x, s.y, s.w, s.h, 5, "#0c1020")}`,
    over: "",
  }
}

const ART = {
  // Melodify's real player (iOS style, pink accent, dark): the cover's colours
  // blurred behind everything, a big cover, title and artist with a star, a
  // thin scrubber with times, back / play in a white circle / forward, volume
  melodify(t, s) {
    const W = s.w
    const x0 = s.x
    const y0 = s.y
    const pad = W * 0.11
    const cw = W - pad * 2
    const pink = "#ff375f"
    const gray = "#ebebf5"
    let o = `<defs><linearGradient id="mwash" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff7a59" stop-opacity=".75"/><stop offset=".45" stop-color="#b8326b" stop-opacity=".55"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>
<linearGradient id="msky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff8a5c"/><stop offset=".6" stop-color="#ff4f7b"/><stop offset="1" stop-color="#7b3fe4"/></linearGradient></defs>`
    o += rect(x0, y0, W, s.h, 0, "#000")
    o += rect(x0, y0, W, s.h, 0, "url(#mwash)")
    // top bar: chevron down, a grabber, more
    const ty = y0 + 17
    o += `<path d="M${r1(x0 + pad)} ${r1(ty - 1.2)}l2.4 2.2 2.4-2.2" stroke="${gray}" stroke-width="1.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`
    o += [0, 1, 2].map((i) => `<circle cx="${r1(x0 + W - pad - 4.4 + i * 2.2)}" cy="${r1(ty)}" r=".75" fill="${gray}"/>`).join("")
    // the cover: a sunset valley, breathing while it plays
    const ay = ty + 6
    o += `<g class="breathe">${rect(x0 + pad, ay + 1.5, cw, cw, 4, "#000", 'opacity=".45"')}<clipPath id="mcov"><rect x="${r1(x0 + pad)}" y="${r1(ay)}" width="${r1(cw)}" height="${r1(cw)}" rx="4"/></clipPath><g clip-path="url(#mcov)">${rect(x0 + pad, ay, cw, cw, 0, "url(#msky)")}<circle cx="${r1(x0 + pad + cw * 0.62)}" cy="${r1(ay + cw * 0.5)}" r="${r1(cw * 0.17)}" fill="#ffd36e"/><path d="M${r1(x0 + pad)} ${r1(ay + cw * 0.72)}q${r1(cw * 0.3)} ${r1(-cw * 0.22)} ${r1(cw * 0.55)} ${r1(-cw * 0.02)}t${r1(cw * 0.45)} ${r1(-cw * 0.06)}V${r1(ay + cw)}H${r1(x0 + pad)}z" fill="#5a2a8c"/><path d="M${r1(x0 + pad)} ${r1(ay + cw * 0.86)}q${r1(cw * 0.4)} ${r1(-cw * 0.16)} ${r1(cw)} ${r1(-cw * 0.04)}V${r1(ay + cw)}H${r1(x0 + pad)}z" fill="#2c1650"/></g></g>`
    // title + artist, star on the right
    const tl = ay + cw + 8.5
    o += rect(x0 + pad, tl, cw * 0.58, 2.8, 1.4, "#fff")
    o += rect(x0 + pad, tl + 5, cw * 0.38, 2.2, 1.1, gray, 'opacity=".55"')
    const sx = x0 + pad + cw - 3
    const sy = tl + 2.8
    o += `<path d="M${r1(sx)} ${r1(sy - 2.8)}l.85 1.8 1.95.25-1.45 1.35.38 1.95-1.73-.95-1.73.95.38-1.95-1.45-1.35 1.95-.25z" fill="${pink}"/>`
    // scrubber with times
    const by = tl + 15
    o += rect(x0 + pad, by, cw, 1.6, 0.8, gray, 'opacity=".25"')
    o += `<g class="scrub">${rect(x0 + pad, by, cw, 1.6, 0.8, "#fff", 'opacity=".9"')}</g>`
    o += rect(x0 + pad, by + 4.2, 5, 1.4, 0.7, gray, 'opacity=".45"')
    o += rect(x0 + pad + cw - 6, by + 4.2, 6, 1.4, 0.7, gray, 'opacity=".45"')
    // controls: back, play (white circle), forward
    const cy = by + 17
    const mx = x0 + W / 2
    const tri = (x, y, d, sz) => `M${r1(x)} ${r1(y - sz)}l${r1(d * sz * 1.2)} ${r1(sz)}l${r1(-d * sz * 1.2)} ${r1(sz)}z`
    const skip = (x, d) => `<path d="${tri(x, cy, d, 2.6)}${tri(x + d * 3, cy, d, 2.6)}" fill="#fff"/>${rect(d > 0 ? x + 6.2 : x - 7.2, cy - 2.6, 1, 5.2, 0.4, "#fff")}`
    o += skip(mx - cw * 0.36, -1).replace(/M/, "M")
    o += `<circle cx="${r1(mx)}" cy="${r1(cy)}" r="7.5" fill="#fff"/>`
    o += `<g class="pp">${rect(mx - 2.6, cy - 3, 1.8, 6, 0.5, "#000")}${rect(mx + 0.8, cy - 3, 1.8, 6, 0.5, "#000")}</g>`
    o += skip(mx + cw * 0.36 - 6, 1)
    // volume
    const vy = cy + 15
    o += `<path d="M${r1(x0 + pad)} ${r1(vy - 0.9)}h1.2l1.6-1.4v4.6l-1.6-1.4h-1.2z" fill="${gray}" opacity=".6"/>`
    o += rect(x0 + pad + 5, vy - 0.6, cw - 12, 1.4, 0.7, gray, 'opacity=".25"')
    o += rect(x0 + pad + 5, vy - 0.6, (cw - 12) * 0.62, 1.4, 0.7, gray, 'opacity=".75"')
    o += `<path d="M${r1(x0 + pad + cw - 4.6)} ${r1(vy - 0.9)}h1.2l1.6-1.4v4.6l-1.6-1.4h-1.2z" fill="${gray}" opacity=".6"/><path d="M${r1(x0 + pad + cw - 0.6)} ${r1(vy - 1.6)}q1 1.6 0 3.2" stroke="${gray}" stroke-width=".7" fill="none" opacity=".6"/>`
    // bottom: lyrics, AirPlay-ish, queue in the accent
    const qy = vy + 13
    o += `<path d="M${r1(x0 + W * 0.25 - 2.2)} ${r1(qy - 2)}h4.4v3h-2.6l-1.8 1.4z" fill="none" stroke="${pink}" stroke-width=".9" stroke-linejoin="round"/>`
    o += `<path d="M${r1(mx - 2.4)} ${r1(qy + 2)}l2.4-3 2.4 3z" fill="${gray}" opacity=".6"/><path d="M${r1(mx - 3.2)} ${r1(qy + 0.4)}v-3h6.4v3" stroke="${gray}" stroke-width=".8" fill="none" opacity=".6"/>`
    o += [0, 1, 2].map((i) => rect(x0 + W * 0.75 - 2.4, qy - 2 + i * 1.8, 4.8, 0.9, 0.45, gray, 'opacity=".6"')).join("")
    return o
  },
  // a list of sets that tick off one by one
  forge(t, s) {
    let o = rect(s.x + 10, s.y + 24, s.w * 0.55, 9, 4.5, t.ink, 'opacity=".75"')
    const rows = 4
    for (let i = 0; i < rows; i++) {
      const y = s.y + 48 + i * ((s.h - 60) / rows)
      o += rect(s.x + 8, y, s.w - 16, (s.h - 60) / rows - 6, 8, t.glass, `stroke="${t.line}"`)
      o += rect(s.x + 16, y + 9, s.w * 0.38, 6, 3, t.slate, 'opacity=".5"')
      o += `<circle cx="${r1(s.x + s.w - 22)}" cy="${r1(y + ((s.h - 60) / rows - 6) / 2)}" r="7" fill="${t.line}"/>`
      o += `<circle class="tick" style="animation-delay:${i * 0.45}s" cx="${r1(s.x + s.w - 22)}" cy="${r1(y + ((s.h - 60) / rows - 6) / 2)}" r="7" fill="${t.go}"/>`
    }
    return o
  },
  // a ring of time running out, then a lock
  leash(t, s) {
    const cx = s.x + s.w / 2
    const cy = s.y + s.h * 0.45
    const r = s.w * 0.32
    const c = 2 * Math.PI * r
    let o = `<circle cx="${r1(cx)}" cy="${r1(cy)}" r="${r1(r)}" fill="none" stroke="${t.line}" stroke-width="8"/>`
    o += `<circle class="drain" style="--c:${r1(c)}" cx="${r1(cx)}" cy="${r1(cy)}" r="${r1(r)}" fill="none" stroke="${t.ultra}" stroke-width="8" stroke-linecap="round" stroke-dasharray="${r1(c)}" transform="rotate(-90 ${r1(cx)} ${r1(cy)})"/>`
    o += rect(cx - 9, cy - 3, 18, 14, 3, t.ink)
    o += `<path d="M${r1(cx - 5)} ${r1(cy - 3)}v-4a5 5 0 0 1 10 0v4" fill="none" stroke="${t.ink}" stroke-width="2.4"/>`
    const by = cy + r + 22
    o += rect(s.x + 14, by, s.w - 28, 10, 5, t.slate, 'opacity=".35"')
    o += rect(s.x + 24, by + 18, s.w - 48, 10, 5, t.slate, 'opacity=".25"')
    return o
  },
  // a page being edited: one card selected and resized by hand
  patchwork(t, s) {
    let o = rect(s.x + 10, s.y + 10, s.w - 20, 8, 4, t.slate, 'opacity=".35"')
    o += rect(s.x + 10, s.y + 26, s.w * 0.6, 12, 4, t.ink, 'opacity=".8"')
    o += rect(s.x + 10, s.y + 44, s.w * 0.42, 7, 3.5, t.slate, 'opacity=".45"')
    const cy = s.y + 60
    const ch = s.h - 70
    const cw = (s.w - 30) / 2
    o += rect(s.x + 10, cy, cw, ch, 6, t.glass, `stroke="${t.line}"`)
    o += `<g class="grow">${rect(s.x + 20 + cw, cy, cw, ch, 6, t.glass)}${rect(s.x + 20 + cw, cy, cw, ch, 6, "none", `stroke="${t.ultra}" stroke-width="1.6" stroke-dasharray="4 3"`)}</g>`
    for (const [x, y] of [
      [s.x + 20 + cw, cy],
      [s.x + 20 + 2 * cw, cy + ch],
    ])
      o += rect(x - 3, y - 3, 6, 6, 1.5, t.ultra)
    return o
  },
  // a slice of watermelon jelly that wobbles
  "melon-jelly"(t, s) {
    const cx = s.x + s.w / 2
    const cy = s.y + s.h * 0.34
    const r = Math.min(s.w * 0.4, s.h * 0.62)
    const arc = (rr) => `M${r1(cx - rr)} ${r1(cy)}A${r1(rr)} ${r1(rr)} 0 0 0 ${r1(cx + rr)} ${r1(cy)}Z`
    let o = `<ellipse cx="${r1(cx)}" cy="${r1(cy + r + 6)}" rx="${r1(r * 0.8)}" ry="4" fill="${t.shade}" class="shadow"/>`
    o += `<g class="wobble"><path d="${arc(r)}" fill="#3fae6a"/><path d="${arc(r - 5)}" fill="#e9f7e4"/><path d="${arc(r - 9)}" fill="#ff5c7a" opacity=".92"/>`
    o += `<path d="M${r1(cx - r * 0.55)} ${r1(cy + 4)}q${r1(r * 0.3)} ${r1(r * 0.25)} ${r1(r * 0.7)} ${r1(r * 0.05)}" stroke="#fff" stroke-opacity=".55" stroke-width="3" fill="none" stroke-linecap="round"/>`
    for (const [a, d] of [
      [-0.5, 0.45],
      [0, 0.6],
      [0.5, 0.45],
      [-0.25, 0.3],
      [0.25, 0.3],
    ])
      o += `<ellipse cx="${r1(cx + a * r)}" cy="${r1(cy + d * r)}" rx="2" ry="3" fill="#2a1a24"/>`
    o += `</g><line class="slice" x1="${r1(cx + 4)}" y1="${r1(cy - 8)}" x2="${r1(cx - 4)}" y2="${r1(cy + r + 4)}" stroke="${t.ultra}" stroke-width="2" stroke-linecap="round"/>`
    return o
  },
  // a response whose secret gets covered before it leaves
  redactenv(t, s) {
    const lh = 15
    let o = ""
    const line = (i, parts) => {
      let x = s.x + 10
      const y = s.y + 12 + i * lh
      for (const [w, c, cls] of parts) {
        o += rect(x, y, w, 7, 3.5, c, cls ? `class="${cls}"` : "")
        x += w + 5
      }
    }
    line(0, [[8, "#3ddc84"], [44, "#98a0b8"], [30, "#6b74a0"]])
    line(1, [[10, "#ff8fa3"], [26, "#98a0b8"]])
    line(2, [[18, "#6b74a0"], [40, "#98a0b8"]])
    line(3, [[18, "#6b74a0"], [56, "#f5c04a"]])
    line(4, [[10, "#ff8fa3"]])
    line(5, [[8, "#3ddc84"], [12, "#e8eaf2"]])
    // the mask slides over the secret
    const mx = s.x + 10 + 18 + 5
    const my = s.y + 12 + 3 * lh - 3
    o += `<g class="mask">${rect(mx, my, 60, 13, 6.5, t.ultra)}${[0, 1, 2, 3, 4].map((i) => `<circle cx="${mx + 12 + i * 9}" cy="${my + 6.5}" r="2" fill="#fff"/>`).join("")}</g>`
    return o
  },
  // a prompt, then a voice: bars that talk
  redat(t, s) {
    let o = rect(s.x + 10, s.y + 12, 8, 7, 3.5, "#3ddc84") + rect(s.x + 23, s.y + 12, 50, 7, 3.5, "#98a0b8")
    const n = 15
    const bw = (s.w - 30) / n
    const mid = s.y + s.h * 0.6
    for (let i = 0; i < n; i++) {
      const hgt = 8 + Math.abs(Math.sin(i * 1.7)) * (s.h * 0.4)
      o += rect(s.x + 15 + i * bw, mid - hgt / 2, bw * 0.55, hgt, bw * 0.27, i % 3 ? "#8080ff" : "#f3a9d2", `class="talk" style="animation-delay:${(i * 0.09).toFixed(2)}s"`)
    }
    return o
  },
  // a tiled desktop: windows snap into place
  dotfiles(t, s) {
    let o = rect(s.x + 4, s.y + 4, s.w - 8, 7, 3.5, "#252c46")
    o += `<circle cx="${s.x + 9}" cy="${s.y + 7.5}" r="2" fill="#8080ff"/>`
    const top = s.y + 15
    const hh = s.h - 19
    const half = (s.w - 12) / 2
    const tiles = [
      [s.x + 4, top, half, hh, "#1b2139"],
      [s.x + 8 + half, top, half, hh / 2 - 2, "#1b2139"],
      [s.x + 8 + half, top + hh / 2 + 2, half, hh / 2 - 2, "#1b2139"],
    ]
    tiles.forEach(([x, y, w, h, c], i) => {
      o += `<g class="snap" style="animation-delay:${i * 0.25}s">${rect(x, y, w, h, 4, c, 'stroke="#2f3760"')}${rect(x + 5, y + 6, w * 0.5, 4, 2, i === 0 ? "#3ddc84" : "#98a0b8")}${rect(x + 5, y + 14, w * 0.7, 4, 2, "#6b74a0")}</g>`
    })
    return o
  },
}

export function device(t, p, b, kit) {
  const frame =
    p.device === "phone"
      ? phoneFrame(t, b)
      : p.device === "desktop"
        ? monitorFrame(t, b)
        : windowFrame(t, b, p.device === "terminal")
  const id = `scr-${p.id}`
  const s = frame.s
  return `${frame.under}<clipPath id="${id}"><rect x="${r1(s.x)}" y="${r1(s.y)}" width="${r1(s.w)}" height="${r1(s.h)}" rx="${p.device === "phone" ? r1(s.w * 0.16) : 4}"/></clipPath><g clip-path="url(#${id})">${ART[p.id](t, s, kit)}</g>${frame.over}`
}

device.css = `
.breathe{transform-box:fill-box;transform-origin:center;animation:breathe 2.4s ease-in-out infinite}@keyframes breathe{0%,100%{transform:scale(1)}50%{transform:scale(1.035)}}
.scrub{transform-box:fill-box;transform-origin:left;animation:scrub 6s linear infinite}@keyframes scrub{from{transform:scaleX(.05)}to{transform:scaleX(1)}}
.tick{transform-box:fill-box;transform-origin:center;animation:tick 4.5s cubic-bezier(.3,1.6,.5,1) infinite both}@keyframes tick{0%,10%{transform:scale(0)}18%,85%{transform:scale(1)}95%,100%{transform:scale(0)}}
.drain{animation:drain 5s ease-in-out infinite}@keyframes drain{0%{stroke-dashoffset:0}80%,100%{stroke-dashoffset:calc(var(--c) * .9px)}}
.grow{transform-box:fill-box;transform-origin:left;animation:grow 3.5s cubic-bezier(.5,0,.3,1) infinite alternate}@keyframes grow{0%,20%{transform:scaleX(1)}80%,100%{transform:scaleX(.72)}}
.wobble{transform-box:fill-box;transform-origin:50% 0;animation:wobble 2.8s ease-in-out infinite}@keyframes wobble{0%,100%{transform:scale(1,1)}20%{transform:scale(1.06,.92)}40%{transform:scale(.97,1.05)}60%{transform:scale(1.02,.98)}}
.slice{stroke-dasharray:120;animation:slice 2.8s ease-in-out infinite}@keyframes slice{0%,5%{stroke-dashoffset:120;opacity:1}18%{stroke-dashoffset:0;opacity:1}35%,100%{stroke-dashoffset:0;opacity:0}}
.mask{transform-box:fill-box;animation:mask 3.5s cubic-bezier(.6,0,.3,1) infinite}@keyframes mask{0%,15%{transform:translateX(120px)}40%,85%{transform:none}100%{transform:translateX(120px)}}
.talk{transform-box:fill-box;transform-origin:center;animation:talk 1.1s ease-in-out infinite alternate}@keyframes talk{from{transform:scaleY(.25)}to{transform:scaleY(1)}}
.snap{transform-box:fill-box;transform-origin:center;animation:snap 5s cubic-bezier(.3,1.4,.5,1) infinite both}@keyframes snap{0%{transform:scale(.6);opacity:0}12%,88%{transform:none;opacity:1}100%{transform:scale(.9);opacity:0}}`
