#!/usr/bin/env node
// Draws every picture in the README from my GitHub data, in the same glass,
// fog and ultramarine as yab.pro.et, then writes the README around them.
//
//   node scripts/build.mjs            fetch with GH_TOKEN (or `gh auth token`)
//   node scripts/build.mjs --offline  redraw from scripts/data.json
//
// Every picture comes in four: light and dark, wide and phone.
// Lexend (SIL OFL) is embedded so the pictures look the same everywhere.

import fs from "node:fs"
import path from "node:path"
import { execSync } from "node:child_process"
import * as P from "./profile.mjs"
import { device } from "./devices.mjs"

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..")
const OUT = path.join(ROOT, "assets")
const DATA = path.join(ROOT, "scripts/data.json")
const FONT = fs.readFileSync(path.join(ROOT, "scripts/lexend.woff2")).toString("base64")

// ---------- data ----------

async function gql(query, variables = {}) {
  const token = process.env.GH_TOKEN || execSync("gh auth token").toString().trim()
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: { authorization: `bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({ query, variables }),
  })
  const json = await res.json()
  if (json.errors) throw new Error(JSON.stringify(json.errors))
  return json.data
}

const CAL = `contributionCalendar { totalContributions weeks { contributionDays { date contributionCount } } }`

async function fetchData() {
  const now = await gql(
    `query($l:String!){ user(login:$l){ createdAt contributionsCollection { ${CAL} } } }`,
    { l: P.login },
  )
  const user = now.user
  const days = user.contributionsCollection.contributionCalendar.weeks.flatMap((w) =>
    w.contributionDays.map((d) => ({ date: d.date, n: d.contributionCount })),
  )
  // every year since the account opened, for the longest streak and the all-time total
  const all = new Map()
  const first = new Date(user.createdAt).getUTCFullYear()
  for (let y = first; y <= new Date().getUTCFullYear(); y++) {
    const r = await gql(
      `query($l:String!,$f:DateTime,$t:DateTime){ user(login:$l){ contributionsCollection(from:$f,to:$t){ ${CAL} } } }`,
      { l: P.login, f: `${y}-01-01T00:00:00Z`, t: `${y}-12-31T23:59:59Z` },
    )
    for (const w of r.user.contributionsCollection.contributionCalendar.weeks)
      for (const d of w.contributionDays) all.set(d.date, d.contributionCount)
  }
  for (const d of days) all.set(d.date, d.n)
  const prs = await gql(
    `query($q:String!){ search(query:$q, type:ISSUE, first:1){ issueCount } }`,
    { q: `author:${P.login} is:pr is:merged is:public -user:${P.login}` },
  )
  return {
    fetched: new Date().toISOString(),
    since: first,
    days,
    all: [...all].sort(([a], [b]) => (a < b ? -1 : 1)).map(([date, n]) => ({ date, n })),
    merged: prs.search.issueCount,
  }
}

function stats(data) {
  const today = data.fetched.slice(0, 10)
  const all = data.all.filter((d) => d.date <= today)
  let longest = 0
  let run = 0
  for (const d of all) {
    run = d.n ? run + 1 : 0
    longest = Math.max(longest, run)
  }
  // today still counts as part of a streak while it's empty
  let current = 0
  for (let i = all.length - 1; i >= 0; i--) {
    if (all[i].n) current++
    else if (all[i].date !== today) break
  }
  const year = data.days.reduce((a, d) => a + d.n, 0)
  const total = all.reduce((a, d) => a + d.n, 0)
  const busiest = data.days.reduce((a, d) => (d.n > a.n ? d : a), data.days[0])
  return { year, total, longest, current, busiest, merged: data.merged, today }
}

// ---------- drawing kit ----------

const THEMES = {
  light: {
    name: "light",
    slab: "#f6f7fa",
    well: "#e9ecf2",
    hi: "#ffffff",
    hiOp: 1,
    ink: "#1a1f36",
    slate: "#5b6275",
    line: "#d3d8e2",
    ultra: "#3a3af4",
    go: "#17a35c",
    glass: "#ffffff",
    screen: "#eef0f6",
    shade: "rgb(26 31 54 / .28)",
    zero: "#cfd4df",
    engrave: "#ffffff",
  },
  // smoked black glass: near-black panels with grain, an iridescent rim
  // catching the light, beads lit from inside, porcelain type
  dark: {
    name: "dark",
    dark: true,
    slab: "#0b0c12",
    well: "#050609",
    hi: "#ffffff",
    hiOp: 0.045,
    ink: "#ecedf3",
    slate: "#8d90a2",
    line: "#1c1e29",
    ultra: "#8f8cff",
    go: "#4be39a",
    glass: "#14151d",
    screen: "#07080c",
    shade: "rgb(0 0 0 / .7)",
    zero: "#23252f",
    engrave: "#000000",
  },
}

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c])
const n0 = (n) => n.toLocaleString("en-US")
const r1 = (n) => Math.round(n * 10) / 10
const fmtDay = (iso) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" })
const fmtLong = (iso) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })

// the site's iridescent glass: periwinkle, rose, mint, violet
const STOPS = [
  [0, [0xa3, 0xad, 0xff]],
  [0.35, [0xf3, 0xa9, 0xd2]],
  [0.7, [0x92, 0xe6, 0xcc]],
  [1, [0x86, 0x83, 0xff]],
]
const mix = (a, b, k) => a.map((c, j) => Math.round(c + (b[j] - c) * k))
const hex = (c) => `#${c.map((v) => v.toString(16).padStart(2, "0")).join("")}`
const iriRGB = (t) => {
  for (let i = 0; i < STOPS.length - 1; i++) {
    const [a, ca] = STOPS[i]
    const [b, cb] = STOPS[i + 1]
    if (t <= b) return mix(ca, cb, (t - a) / (b - a))
  }
  return STOPS[3][1]
}
export const iri = (t) => hex(iriRGB(t))

// glass bead gradients, one per hue step: a white glint up-left, a deeper rim
const HUES = 24
const beadDefs = () =>
  Array.from({ length: HUES }, (_, i) => {
    const c = iriRGB(i / (HUES - 1))
    return `<radialGradient id="b${i}" cx=".34" cy=".3" r=".96"><stop offset="0" stop-color="#fff"/><stop offset=".1" stop-color="#fff" stop-opacity=".95"/><stop offset=".52" stop-color="${hex(c)}"/><stop offset="1" stop-color="${hex(mix(c, [0x3a, 0x2f, 0xb0], 0.32))}"/></radialGradient>`
  }).join("")
const hue = (t) => `url(#b${Math.round(Math.max(0, Math.min(1, t)) * (HUES - 1))})`

const bead = (x, y, r, t, extra = "") =>
  `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(r)}" fill="${hue(t)}" ${extra}/>`

function svg({ w, h, label, body, t, css = "" }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label)}"><title>${esc(label)}</title><defs><style>@font-face{font-family:Lexend;font-weight:100 900;src:url(data:font/woff2;base64,${FONT}) format("woff2")}text{font-family:Lexend,ui-sans-serif,system-ui,sans-serif}.spin,.fall,.pour,.move{transform-box:fill-box;transform-origin:center}${css}@media (prefers-reduced-motion:reduce){*{animation:none!important}}</style>${beadDefs()}<radialGradient id="sheen" cx="0" cy="0" r="1.1"><stop offset="0" stop-color="${t.hi}" stop-opacity="${t.hiOp}"/><stop offset=".6" stop-color="${t.hi}" stop-opacity="0"/></radialGradient>${t.dark ? DARK_DEFS : '<filter id="drop" x="-10%" y="-10%" width="120%" height="130%"><feDropShadow dx="0" dy="1.5" stdDeviation="1.2" flood-color="#281e8c" flood-opacity=".3"/></filter>'}</defs>${body}</svg>`
}

// Dark only: beads glow from inside, panels have a rim of iridescent light
// (brightest at two opposite corners, like glass held to a lamp) and grain.
const DARK_DEFS = `<filter id="drop" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur in="SourceGraphic" stdDeviation="3.2" result="b"/><feColorMatrix in="b" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 .75 0" result="g"/><feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<linearGradient id="rim" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#a3adff" stop-opacity=".95"/><stop offset=".22" stop-color="#f3a9d2" stop-opacity=".35"/><stop offset=".5" stop-color="#92e6cc" stop-opacity=".06"/><stop offset=".8" stop-color="#92e6cc" stop-opacity=".3"/><stop offset="1" stop-color="#8683ff" stop-opacity=".9"/></linearGradient>
<linearGradient id="lip" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".3" stop-color="#fff" stop-opacity=".35"/><stop offset=".7" stop-color="#fff" stop-opacity=".08"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
<linearGradient id="porcelain" x1="0" y1="0" x2="0" y2="1"><stop offset=".2" stop-color="#ffffff"/><stop offset="1" stop-color="#a7a9d6"/></linearGradient>
<filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" stitchTiles="stitch" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .9 -.35" result="w"/><feComposite in="w" in2="SourceGraphic" operator="in"/></filter>`

// a frosted slab, as on the site's bead tray (smoked glass in the dark)
const slab = (t, w, h, r = 28) =>
  `<rect x="1" y="1" width="${w - 2}" height="${h - 2}" rx="${r}" fill="${t.slab}"/><rect x="1" y="1" width="${w - 2}" height="${h - 2}" rx="${r}" fill="url(#sheen)"/>${rim(t, w, h, r)}`
const rim = (t, w, h, r) =>
  t.dark
    ? `<rect x="1" y="1" width="${w - 2}" height="${h - 2}" rx="${r}" fill="#fff" filter="url(#grain)" opacity=".05"/><rect x="1" y="1" width="${w - 2}" height="${h - 2}" rx="${r}" fill="none" stroke="${t.line}" stroke-width="2"/><rect x="1.5" y="1.5" width="${w - 3}" height="${h - 3}" rx="${r - 0.5}" fill="none" stroke="url(#rim)" stroke-width="1.2"/><path d="M${r + 4} 2.2H${w - r - 4}" stroke="url(#lip)" stroke-width="1"/>`
    : `<rect x="1.5" y="1.5" width="${w - 3}" height="${h - 3}" rx="${r - 0.5}" fill="none" stroke="${t.line}"/>`

const text = (x, y, s, { size = 16, weight = 400, fill, anchor = "start", ls = 0, extra = "" } = {}) =>
  `<text x="${r1(x)}" y="${r1(y)}" font-size="${size}" font-weight="${weight}" fill="${fill}"${anchor !== "start" ? ` text-anchor="${anchor}"` : ""}${ls ? ` letter-spacing="${ls}"` : ""} ${extra}>${esc(s)}</text>`

// Lexend is wide; this is close enough to wrap lines and size pills
const widthOf = (s, size, weight = 400) => s.length * size * (weight >= 600 ? 0.62 : 0.57)

function wrap(s, size, max) {
  const lines = []
  let line = ""
  for (const word of s.split(" ")) {
    const next = line ? `${line} ${word}` : word
    if (widthOf(next, size) > max && line) {
      lines.push(line)
      line = word
    } else line = next
  }
  if (line) lines.push(line)
  return lines
}

// ---------- hero: the name, cut by a knife and mended ----------

function hero(t, phone) {
  const w = phone ? 600 : 880
  const h = phone ? 420 : 320
  const pad = phone ? 32 : 44
  const size = phone ? 92 : 124
  const base = phone ? 210 : 196
  // the cut runs a little uphill across the letters' middle
  const midY = base - size * 0.36
  const tilt = phone ? 22 : 30
  const y0 = midY + tilt / 2
  const y1 = midY - tilt / 2
  const cutAt = (x) => y0 + ((y1 - y0) * x) / w
  const name = (fill, extra = "") =>
    text(pad - 4, base, P.hero.name, { size, weight: 800, fill, ls: phone ? -1 : -1.5, extra })
  const top = `0,0 ${w},0 ${w},${r1(cutAt(w))} 0,${r1(cutAt(0))}`
  const bottom = `0,${r1(cutAt(0))} ${w},${r1(cutAt(w))} ${w},${h} 0,${h}`
  const nx0 = pad - 18
  const nx1 = Math.min(w - 12, pad + P.hero.name.length * size * 0.66 + 18)
  const len = Math.hypot(nx1 - nx0, y1 - y0)

  // pills along the top
  const pill = (x, y, label, { dot, fill, color, stroke, ph = 34 } = {}) => {
    const pw = widthOf(label, 14, 500) + (dot ? 40 : 28)
    return {
      w: pw,
      s: `<rect x="${x}" y="${y}" width="${r1(pw)}" height="${ph}" rx="${ph / 2}" fill="${fill}"${stroke ? ` stroke="${stroke}"` : ""}/>${
        dot
          ? `<circle cx="${x + 18}" cy="${y + ph / 2}" r="4.5" fill="${t.go}"/><circle class="pulse" cx="${x + 18}" cy="${y + ph / 2}" r="4.5" fill="none" stroke="${t.go}" stroke-width="2"/>`
          : ""
      }${text(x + (dot ? 30 : 14), y + ph / 2 + 5, label, { size: 14, weight: 500, fill: color })}`,
    }
  }
  const open = pill(pad, pad - 8, P.hero.open, { dot: true, fill: t.glass, color: t.ink, stroke: t.line })
  const place = pill(pad + open.w + 10, pad - 8, P.hero.place, { fill: "none", color: t.slate, stroke: t.line })
  const siteW = widthOf("yab.pro.et ↗", 14, 600) + 30
  const site = phone
    ? ""
    : `<rect x="${r1(w - pad - siteW)}" y="${pad - 8}" width="${r1(siteW)}" height="34" rx="17" fill="${t.ultra}"/>${text(w - pad - siteW / 2, pad + 14, "yab.pro.et ↗", { size: 14, weight: 600, fill: "#fff", anchor: "middle" })}`

  // three beads spill out of the cut while it is open
  const spill = [0.3, 0.52, 0.71]
    .map((k, i) => bead(w * k, cutAt(w * k), phone ? 6 : 7, k, `class="fall" style="animation-delay:${i * 90}ms" filter="url(#drop)"`))
    .join("")

  // the beads that spilled from earlier cuts, in a little heap
  let heap = ""
  if (!phone) {
    const spots = [[0,0,13],[26,-2,12],[51,1,13],[13,-21,12],[38,-22,13],[25,-42,11],[64,-17,10],[-22,2,10],[76,3,11]]
    heap = `<g filter="url(#drop)">${spots.map(([dx, dy, r], i) => bead(w - pad - 90 + dx, h - pad - 4 + dy, r, (i * 0.37) % 1)).join("")}</g>`
  }
  const lines = phone ? wrap(P.hero.line, 21, w - pad * 2) : [P.hero.line]
  const roleY = base + (phone ? 66 : 62)
  const body = `${slab(t, w, h, phone ? 32 : 36)}
<clipPath id="top"><polygon points="${top}"/></clipPath><clipPath id="bot"><polygon points="${bottom}"/></clipPath>
${open.s}${place.s}${site}
<g clip-path="url(#bot)"><g class="lo">${name(t.dark ? "url(#porcelain)" : t.ink)}</g></g>
<g clip-path="url(#top)"><g class="up">${name(t.dark ? "url(#porcelain)" : t.ink)}</g></g>
<line class="seam" x1="${nx0}" y1="${r1(cutAt(nx0))}" x2="${r1(nx1)}" y2="${r1(cutAt(nx1))}" stroke="${t.ultra}" stroke-width="1.5"/>
<line class="knife" x1="${nx0}" y1="${r1(cutAt(nx0))}" x2="${r1(nx1)}" y2="${r1(cutAt(nx1))}" stroke="url(#blade)" stroke-width="3" stroke-linecap="round" stroke-dasharray="180 ${r1(len * 2)}"/>
<linearGradient id="blade" gradientUnits="userSpaceOnUse" x1="${nx0}" y1="0" x2="${r1(nx1)}" y2="0"><stop offset="0" stop-color="${t.ultra}"/><stop offset="1" stop-color="#fff"/></linearGradient>
${spill}${heap}
${text(pad, roleY, P.hero.role, { size: phone ? 30 : 30, weight: 600, fill: t.ink })}
${lines.map((l, i) => text(pad, roleY + 36 + i * 30, l, { size: phone ? 21 : 20, fill: t.slate })).join("")}`

  // 7 s loop: the knife passes, the top half slides along the cut, beads
  // spill, and the name mends itself.
  const dx = phone ? 12 : 16
  const css = `
.up,.lo,.seam,.knife,.fall{animation-duration:7s;animation-iteration-count:infinite;animation-timing-function:cubic-bezier(.3,1.25,.5,1)}
.up{animation-name:up}.lo{animation-name:lo}.seam{animation-name:seam;opacity:0}.fall{animation-name:fall;opacity:0}
.knife{animation-name:knife;animation-timing-function:cubic-bezier(.6,0,.3,1);stroke-dashoffset:180;opacity:0}
@keyframes knife{0%,12%{stroke-dashoffset:180;opacity:0}13%{opacity:1}22%{stroke-dashoffset:${r1(-len)};opacity:1}23%,100%{opacity:0}}
@keyframes up{0%,21%{transform:none}30%,62%{transform:translate(${dx}px,${-(dx * tilt) / w - 3}px)}74%,100%{transform:none}}
@keyframes lo{0%,21%{transform:none}30%,62%{transform:translate(-4px,2px)}74%,100%{transform:none}}
@keyframes seam{0%,21%{opacity:0}28%,60%{opacity:.55}72%,100%{opacity:0}}
@keyframes fall{0%,26%{opacity:0;transform:scale(.2)}32%{opacity:1;transform:scale(1)}58%{opacity:1;transform:translateY(${phone ? 70 : 54}px)}64%,100%{opacity:0;transform:translateY(${phone ? 76 : 60}px)}}
.pulse{animation:pulse 2.2s ease-out infinite}
@keyframes pulse{0%{transform:scale(1);opacity:.9}100%{transform:scale(2.6);opacity:0}}
.pulse{transform-box:fill-box;transform-origin:center}`
  return svg({
    w,
    h,
    t,
    css,
    label: `Yeabsira. ${P.hero.role}. ${P.hero.line} ${P.hero.place}.`,
    body,
  })
}

// ---------- stats: numbers that roll into place like an odometer ----------

function odometer(x, y, value, { size, fill, engrave, id, delay = 0 }) {
  const s = n0(value)
  const lh = size * 1.15
  const step = size * 0.62
  let out = `<clipPath id="${id}"><rect x="${x - 4}" y="${r1(y - size * 0.86)}" width="${r1(s.length * step + 8)}" height="${r1(size * 1.12)}"/></clipPath><g clip-path="url(#${id})">`
  let cx = x
  s.split("").forEach((ch, i) => {
    if (ch === ",") {
      out += text(cx + step * 0.18, y, ",", { size, weight: 700, fill })
      cx += step * 0.5
      return
    }
    const d = Number(ch)
    // two turns of the wheel so even a 0 rolls
    const col = Array.from({ length: 10 + d + 1 }, (_, k) => {
      const yy = y + k * lh
      return `${engrave ? text(cx + step / 2, yy + 1.4, k % 10, { size, weight: 700, fill: engrave, anchor: "middle" }) : ""}${text(cx + step / 2, yy, k % 10, { size, weight: 700, fill, anchor: "middle" })}`
    }).join("")
    out += `<g class="roll r${d}" style="animation-delay:${delay + i * 110}ms">${col}</g>`
    cx += step
  })
  return { s: `${out}</g>`, w: cx - x }
}

function statsCard(t, st, phone) {
  const w = phone ? 600 : 880
  const h = phone ? 380 : 236
  const pad = phone ? 32 : 36
  const items = [
    { n: st.year, label: "contributions, past year", unit: "" },
    { n: st.current, label: "current streak", unit: st.current === 1 ? "day" : "days" },
    { n: st.longest, label: "longest streak", unit: "days" },
    { n: st.merged, label: "open-source PRs merged", unit: "" },
  ]
  const cols = phone ? 2 : 4
  const cw = (w - pad * 2) / cols
  const rowH = phone ? 132 : 0
  const size = phone ? 52 : 50
  let body = slab(t, w, h)
  body += text(pad, pad + 20, "On GitHub", { size: 20, weight: 600, fill: t.ink })
  body += text(w - pad, pad + 20, `counted ${fmtLong(st.today)}`, { size: 14, fill: t.slate, anchor: "end" })
  items.forEach((it, i) => {
    const c = i % cols
    const r = Math.floor(i / cols)
    const x = pad + c * cw + (c ? 22 : 0)
    const top = (phone ? 92 : 96) + r * rowH
    if (c) body += `<line x1="${r1(pad + c * cw)}" y1="${top - 8}" x2="${r1(pad + c * cw)}" y2="${top + 100}" stroke="${t.line}"/>`
    body += bead(x + 7, top + 9, 7, i / 3, 'filter="url(#drop)"')
    body += text(x + 22, top + 14, it.label, { size: phone ? 16 : 14, fill: t.slate })
    const o = odometer(x, top + 78, it.n, {
      size,
      fill: t.ink,
      engrave: t.name === "light" ? t.engrave : null,
      id: `o${i}`,
      delay: 200 + i * 180,
    })
    body += o.s
    if (it.unit) body += text(x + o.w + 8, top + 78, it.unit, { size: 18, weight: 500, fill: t.slate })
  })
  const lh = size * 1.15
  const css = `.roll{animation:1.6s cubic-bezier(.25,1.1,.4,1) both}${Array.from({ length: 10 }, (_, d) => `.r${d}{animation-name:r${d};transform:translateY(${r1(-(10 + d) * lh)}px)}@keyframes r${d}{from{transform:translateY(0)}to{transform:translateY(${r1(-(10 + d) * lh)}px)}}`).join("")}`
  return svg({
    w,
    h,
    t,
    css,
    body,
    label: `On GitHub: ${n0(st.year)} contributions in the past year, a ${st.current}-day streak right now, longest streak ${st.longest} days, ${st.merged} pull requests merged into other people's public repositories.`,
  })
}

// ---------- the year: one glass bead per day, poured into a tray ----------

function yearTray(t, data, st, phone) {
  const days = data.days
  const weeks = []
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7))
  const shown = phone ? weeks.slice(-22) : weeks
  const w = phone ? 600 : 880
  const pad = phone ? 28 : 36
  const cell = (w - pad * 2) / shown.length
  const gridTop = phone ? 140 : 130
  const h = gridTop + cell * 7 + (phone ? 78 : 70)
  const counts = days.map((d) => d.n).filter(Boolean).sort((a, b) => a - b)
  const p90 = counts[Math.floor(counts.length * 0.9)] || 1
  const total = days.length
  let body = slab(t, w, h)
  body += text(pad, pad + 22, "A year in glass", { size: 22, weight: 600, fill: t.ink })
  body += text(pad, pad + 48, phone ? "one bead per day, last 5 months" : "one bead for every day, bigger on busier ones", { size: 15, fill: t.slate })
  body += text(w - pad, pad + 22, n0(phone ? shown.flat().reduce((a, d) => a + d.n, 0) : st.year), { size: 22, weight: 700, fill: t.ink, anchor: "end" })
  body += text(w - pad, pad + 48, phone ? "contributions" : "contributions in the past year", { size: 15, fill: t.slate, anchor: "end" })
  // months
  let last = ""
  let lastC = -9
  shown.forEach((wk, c) => {
    const m = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" ")[Number(wk[wk.length - 1].date.slice(5, 7)) - 1]
    if (m !== last && c - lastC >= 3 && c < shown.length - 2) {
      body += text(pad + c * cell + 1, gridTop - 12, m, { size: phone ? 14 : 12, weight: 500, fill: t.slate })
      last = m
      lastC = c
    }
  })
  // the dish
  body += `<rect x="${pad - 8}" y="${gridTop - 6}" width="${r1(w - pad * 2 + 16)}" height="${r1(cell * 7 + 12)}" rx="${r1(cell * 0.7)}" fill="${t.well}"/>`
  let beads = ""
  shown.forEach((wk, c) => {
    wk.forEach((d, r) => {
      const x = pad + c * cell + cell / 2
      const y = gridTop + r * cell + cell / 2
      const idx = days.indexOf(d)
      if (!d.n) {
        beads += `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(Math.max(1.4, cell * 0.08))}" fill="${t.zero}"/>`
        return
      }
      const lvl = Math.min(1, Math.log1p(d.n) / Math.log1p(p90))
      const rad = (cell / 2) * (0.42 + 0.5 * lvl)
      const delay = c * (phone ? 55 : 26) + (6 - r) * 14
      beads += bead(x, y, rad, idx / (total - 1), `class="pour" style="animation-delay:${delay}ms"`)
    })
  })
  body += `<g filter="url(#drop)">${beads}</g>`
  // today
  const lastWk = shown[shown.length - 1]
  const tr = lastWk.length - 1
  const tx = pad + (shown.length - 1) * cell + cell / 2
  const ty = gridTop + tr * cell + cell / 2
  body += `<circle cx="${r1(tx)}" cy="${r1(ty)}" r="${r1(cell * 0.46)}" fill="none" stroke="${t.go}" stroke-width="1.6"/>`
  // legend
  const ly = gridTop + cell * 7 + (phone ? 46 : 42)
  const busiest = `busiest day ${fmtDay(st.busiest.date)}, ${st.busiest.n} contributions`
  body += text(pad, ly, busiest, { size: phone ? 15 : 14, fill: t.slate })
  const lx = w - pad
  const sizes = [0.25, 0.55, 0.8, 1]
  let lgx = lx - 34
  body += text(lx, ly, "more", { size: 14, fill: t.slate, anchor: "end" })
  sizes
    .slice()
    .reverse()
    .forEach((k, i) => {
      const rr = 3 + k * 5
      lgx -= 22
      body += bead(lgx, ly - 5, rr, 1 - i / 3)
    })
  body += text(lgx - 16, ly, "less", { size: 14, fill: t.slate, anchor: "end" })
  const css = `.pour{animation:pour 1s cubic-bezier(.3,1.5,.5,1) both}@keyframes pour{0%{transform:translateY(-70px) scale(.3);opacity:0}45%{opacity:1}100%{transform:none;opacity:1}}`
  return svg({
    w,
    h: Math.round(h),
    t,
    css,
    body,
    label: `${n0(st.year)} contributions on GitHub in the past year, one glass bead per day. The busiest day was ${fmtDay(st.busiest.date)}, with ${st.busiest.n}.`,
  })
}

// ---------- project cards ----------

// A portrait slab of glass, already cut: the top half is a stage in the
// project's own colour with its device standing in it, slid a little along
// the knife's line, and the words sit in the bottom half.
function card(t, p, i, phone) {
  const w = 440
  const h = phone ? 450 : 560
  const n = P.projects.length
  const k = i / (n - 1)
  const c1 = iri(k)
  const c2 = iri((k + 0.3) % 1)
  // the cut runs uphill, and alternates direction down the grid
  const dir = i % 2 ? -1 : 1
  const cy = 318
  const ya = cy + dir * 14
  const yb = cy - dir * 14
  const stage = `0,0 ${w},0 ${w},${yb} 0,${ya}`
  const lower = `0,${ya} ${w},${yb} ${w},${h} 0,${h}`
  const tilt = (i % 2 ? 3 : -3) * (p.device === "phone" ? 1.6 : 1)
  const sc = p.device === "phone" ? 1.5 : 1.42
  const bw = 236
  const bh = 168
  const gx = (w - bw * sc) / 2
  const gy = (cy - 20 - bh * sc) / 2 + 12
  const no = String(i + 1).padStart(2, "0")
  let body = `<clipPath id="card"><rect x="1" y="1" width="${w - 2}" height="${h - 2}" rx="30"/></clipPath>
<clipPath id="stage"><polygon points="${stage}"/></clipPath><clipPath id="lower"><polygon points="${lower}"/></clipPath>
<linearGradient id="wash" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient>
<radialGradient id="orb" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset=".55" stop-color="#fff" stop-opacity=".15"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
<g clip-path="url(#card)">
<rect width="${w}" height="${h}" fill="${t.slab}"/>
<g clip-path="url(#lower)"><rect width="${w}" height="${h}" fill="${t.slab}"/><rect width="${w}" height="${h}" fill="url(#sheen)" opacity=".5"/></g>
<g transform="translate(5 ${-dir * 0.4 - 3})"><g clip-path="url(#stage)">
${t.dark
  ? `<radialGradient id="spot" cx=".5" cy=".62" r=".62"><stop offset="0" stop-color="${c1}" stop-opacity=".5"/><stop offset=".45" stop-color="${c2}" stop-opacity=".16"/><stop offset="1" stop-color="${c2}" stop-opacity="0"/></radialGradient><rect width="${w}" height="${cy + 20}" fill="#07080c"/><rect width="${w}" height="${cy + 20}" fill="url(#spot)"/><ellipse cx="${w / 2}" cy="${cy - 26}" rx="${w * 0.34}" ry="10" fill="${c1}" opacity=".22" filter="url(#drop)"/><rect width="${w}" height="${cy + 20}" fill="#fff" filter="url(#grain)" opacity=".06"/>`
  : `<rect width="${w}" height="${cy + 20}" fill="url(#wash)" opacity=".55"/><rect width="${w}" height="${cy + 20}" fill="${t.slab}" opacity=".25"/><circle cx="${w * 0.72}" cy="${cy * 0.3}" r="${cy * 0.42}" fill="url(#orb)" opacity=".9"/>`}
${[0, 1, 2, 3, 4, 5].map((j) => `<circle cx="${30 + j * 14}" cy="${cy - 40 + dir * (j * 2.2 - 4)}" r="2" fill="${t.ink}" opacity=".18"/>`).join("")}
${text(28, 50, no, { size: 15, weight: 700, fill: t.ink, extra: 'opacity=".45"' })}
${text(w - 28, 50, p.kind, { size: 14, weight: 600, fill: t.ink, anchor: "end", extra: 'opacity=".6"' })}
<g transform="translate(${r1(gx)} ${r1(gy)}) rotate(${tilt} ${r1((bw * sc) / 2)} ${r1((bh * sc) / 2)}) scale(${sc})">${device(t, p, { x: 0, y: 0, w: bw, h: bh }, { iri, bead, hue })}</g>
</g></g>
<line x1="0" y1="${ya}" x2="${w}" y2="${yb}" stroke="${t.ultra}" stroke-width="1.5" opacity=".75"${t.dark ? ' filter="url(#drop)"' : ""}/>
${bead(w - 46, (ya + yb) / 2 + 1, 9, k, 'filter="url(#drop)"')}`
  const ty = cy + 64
  const nameSize = phone ? 44 : 36
  body += text(28, ty + (phone ? 8 : 0), p.name, { size: nameSize, weight: 800, fill: t.ink, ls: -1 })
  if (phone) {
    body += text(28, ty + 50, p.url.includes("github.com") ? "open source ↗" : "live ↗", { size: 22, weight: 600, fill: t.ultra })
  } else {
    wrap(p.text, 17, w - 56).slice(0, 3).forEach((l, j) => (body += text(28, ty + 34 + j * 25, l, { size: 17, fill: t.ink, extra: 'opacity=".78"' })))
    const host = p.url.replace(/^https?:\/\//, "")
    body += `<line x1="28" y1="${h - 62}" x2="${w - 28}" y2="${h - 62}" stroke="${t.line}"/>`
    body += text(28, h - 30, host, { size: 14, weight: 500, fill: t.slate })
    body += `<circle cx="${w - 44}" cy="${h - 35}" r="16" fill="${t.ultra}"/><path d="M${w - 50} ${h - 29}l12-12m-8 0h8v8" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`
  }
  body += `</g>${rim(t, w, h, 30)}`
  return svg({ w, h, t, body, css: device.css, label: `${p.alt || p.name} (${p.kind}): ${p.text}` })
}

// ---------- contact pills ----------

const ICONS = {
  site: `<circle cx="12" cy="12" r="8" fill="none" stroke="#fff" stroke-width="1.8"/><ellipse cx="12" cy="12" rx="3.6" ry="8" fill="none" stroke="#fff" stroke-width="1.6"/><path d="M4 12h16" stroke="#fff" stroke-width="1.6"/>`,
  linkedin: `<rect x="5" y="9.5" width="3" height="9" rx=".6" fill="#fff"/><circle cx="6.5" cy="6.3" r="1.8" fill="#fff"/><path d="M11 18.5v-9h2.8v1.3c.6-1 1.6-1.5 2.9-1.5 2.1 0 3.3 1.3 3.3 3.9v5.3h-3v-4.7c0-1.1-.4-1.8-1.4-1.8s-1.6.7-1.6 1.8v4.7z" fill="#fff"/>`,
  telegram: `<path d="M4 11.5 19.5 5l-2.6 13.5-4.6-3.6-2.5 2.4.4-4.3 6.3-6-7.8 4.8z" fill="#fff"/>`,
  x: `<path d="M6 5.5h3.2l9 13H15zM18 5.5l-5 5.8M6 18.5l5-5.8" stroke="#fff" stroke-width="1.7" fill="none" stroke-linejoin="round"/>`,
  mail: `<rect x="4" y="6.5" width="16" height="11" rx="2" fill="none" stroke="#fff" stroke-width="1.8"/><path d="m4.8 7.5 7.2 5.5 7.2-5.5" fill="none" stroke="#fff" stroke-width="1.8"/>`,
}

function pill(t, l, i) {
  const h = 48
  const w = Math.round(widthOf(l.label, 16, 600) + 70)
  const body = `${slab(t, w, h, h / 2 - 1)}
<circle cx="25" cy="24" r="16" fill="${hue(i / 4)}"/><circle cx="25" cy="24" r="16" fill="${t.ultra}" opacity=".55"/><g transform="translate(13 12)">${ICONS[l.id]}</g>${text(50, 29.5, l.label, { size: 16, weight: 600, fill: t.ink })}`
  return svg({ w, h, t, body, label: l.label })
}

// ---------- write it all ----------

const pic = (base, alt, width = "100%", phone = true) =>
  `<picture>${phone ? `<source media="(prefers-color-scheme: dark) and (max-width: 600px)" srcset="assets/${base}-phone-dark.svg"><source media="(max-width: 600px)" srcset="assets/${base}-phone-light.svg">` : ""}<source media="(prefers-color-scheme: dark)" srcset="assets/${base}-dark.svg"><img src="assets/${base}-light.svg" ${width.startsWith("h") ? `height="${width.slice(1)}"` : `width="${width}"`} alt="${esc(alt)}"></picture>`

const pairs = (a) => a.reduce((o, x, i) => (i % 2 ? o[o.length - 1].push(x) : o.push([x]), o), [])

async function main() {
  const offline = process.argv.includes("--offline")
  const data = offline ? JSON.parse(fs.readFileSync(DATA, "utf8")) : await fetchData()
  if (!offline) fs.writeFileSync(DATA, JSON.stringify(data))
  const st = stats(data)
  fs.mkdirSync(OUT, { recursive: true })
  for (const f of fs.readdirSync(OUT)) if (f.endsWith(".svg")) fs.rmSync(path.join(OUT, f))

  const put = (name, s) => fs.writeFileSync(path.join(OUT, `${name}.svg`), s)
  for (const t of Object.values(THEMES)) {
    for (const phone of [false, true]) {
      const sfx = `${phone ? "-phone" : ""}-${t.name}`
      put(`hero${sfx}`, hero(t, phone))
      put(`stats${sfx}`, statsCard(t, st, phone))
      put(`year${sfx}`, yearTray(t, data, st, phone))
      P.projects.forEach((p, i) => put(`app-${p.id}${sfx}`, card(t, p, i, phone)))
    }
    P.links.forEach((l, i) => put(`link-${l.id}-${t.name}`, pill(t, l, i)))
  }

  const alt = (s) => s
  const readme = `<a href="${P.site}">${pic("hero", `Yeabsira. ${P.hero.role}. ${P.hero.line} ${P.hero.place}.`)}</a>

<p>
${P.links.map((l) => `<a href="${l.url}">${pic(`link-${l.id}`, l.label, "h48", false)}</a>`).join("\n")}
</p>

${pic("stats", alt(`On GitHub: ${n0(st.year)} contributions in the past year, a ${st.current}-day streak right now, longest streak ${st.longest} days, ${st.merged} pull requests merged into other people's public repositories.`))}

${pic("year", `${n0(st.year)} contributions in the past year, one glass bead per day. Busiest day ${fmtDay(st.busiest.date)}, with ${st.busiest.n}.`)}

<h3>Things I've made</h3>

${pairs(P.projects).map((row) => `<p>\n${row.map((p) => `<a href="${p.url}">${pic(`app-${p.id}`, `${p.alt || p.name} (${p.kind}): ${p.text}`, "49%")}</a>`).join("\n")}\n</p>`).join("\n\n")}

${P.openSource}

${P.footer}

<sub>Every picture here is drawn by <a href="scripts/build.mjs">scripts/build.mjs</a> and redrawn every night from my GitHub data.</sub>
`
  fs.writeFileSync(path.join(ROOT, "README.md"), readme)
  console.log(`drew ${fs.readdirSync(OUT).filter((f) => f.endsWith(".svg")).length} pictures`, st)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
