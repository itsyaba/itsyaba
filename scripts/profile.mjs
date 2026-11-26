// Everything the README says. Edit the words here; build.mjs draws them.

export const login = "itsyaba"
export const site = "https://yab.pro.et"

export const hero = {
  name: "YEABSIRA",
  role: "Fullstack & mobile developer",
  line: "Web, iOS and Android, from the API to the app in your pocket.",
  place: "Addis Ababa, Ethiopia",
  open: "Open to new work",
}

export const links = [
  { id: "site", label: "yab.pro.et", url: "https://yab.pro.et" },
  { id: "linkedin", label: "LinkedIn", url: "https://www.linkedin.com/in/itsyaba/" },
  { id: "telegram", label: "Telegram", url: "https://t.me/itsyaba" },
  { id: "x", label: "X", url: "https://x.com/itsyabah" },
  { id: "mail", label: "Email", url: "mailto:yabahane@gmail.com" },
]

// device: phone (apps), browser (sites), terminal (tools), desktop (setups)
export const projects = [
  {
    id: "melodify",
    name: "Melodify",
    kind: "iPhone & Android",
    url: "https://github.com/itsyaba/melodify",
    device: "phone",
    text: "An offline-first music player. No accounts, no streaming, no ads: it plays the files on your phone.",
  },
  {
    id: "patchwork",
    name: "Patchwork",
    kind: "Web · AI",
    url: "https://patchwork-editor.vercel.app",
    device: "browser",
    text: "An AI site builder where your own edits survive. Every visual tweak becomes a real code edit.",
  },
  {
    id: "melon-jelly",
    name: "Melon Jelly",
    kind: "Web · WebGPU",
    url: "https://melon-jelly-tau.vercel.app",
    device: "browser",
    text: "A slice of watermelon jelly you can pull and cut, simulated as a real soft body with hand-written shaders.",
  },
  {
    id: "forge",
    name: "Forge",
    kind: "iPhone & Android",
    url: "https://github.com/itsyaba/forge",
    device: "phone",
    text: "A workout planner for people who don't know what a workout looks like yet. It walks you through every set.",
  },
  {
    id: "leash",
    name: "Leash",
    kind: "Android",
    url: "https://github.com/itsyaba/Leash",
    device: "phone",
    text: "Puts addictive apps on a leash, with real time limits and cooldowns that are hard to get around.",
  },
  {
    id: "redactenv",
    name: "redactenv",
    kind: "Node · npm",
    url: "https://github.com/itsyaba/redactenv",
    device: "terminal",
    text: "Scrubs API keys, tokens and secrets out of a Node server's responses, error pages and logs.",
  },
  {
    id: "redat",
    name: "Redat",
    alt: "Redat (ረዳት)",
    kind: "Linux · Amharic",
    url: "https://github.com/itsyaba/redat",
    device: "terminal",
    text: "An Amharic voice assistant for my desktop. I speak, Claude does the task, and it answers out loud.",
  },
  {
    id: "dotfiles",
    name: "dotfiles",
    kind: "CachyOS · Hyprland",
    url: "https://github.com/itsyaba/dotfiles",
    device: "desktop",
    text: "My Hyprland setup on the Caelestia shell, with Quickshell panels and a drawer for my Claude Code usage.",
  },
]

// Plain markdown under the cards. Never call an open PR merged.
export const openSource = `<h3>Open source</h3>

- **[Mangayomi](https://github.com/kodjodevf/mangayomi)**: a free reader for manga, novels and anime on Android, iOS and desktop, with 4.6k stars. [11 merged pull requests](https://github.com/kodjodevf/mangayomi/pulls?q=is%3Apr+author%3Aitsyaba+is%3Amerged) in the app (smoother webtoon scrolling, backup restore, update badges, extension installs) and [9 in its extensions](https://github.com/m2k3a/mangayomi-extensions/pulls?q=is%3Apr+author%3Aitsyaba+is%3Amerged), mostly new sources.
- **[data-peek](https://github.com/Rohithgilla12/data-peek)**: a fast, minimal desktop database client. [Made its desktop menu items that did nothing actually work](https://github.com/Rohithgilla12/data-peek/pull/289).
- **In review:** [Expo Router](https://github.com/expo/expo/pull/51242) (an extra render in \`useFocusEffect\`), [shadcn/ui](https://github.com/shadcn-ui/ui/pull/12240) (registry hooks landing in the right workspace) and the [Caelestia shell](https://github.com/caelestia-dots/shell/pull/2110) (an option to turn the weather off).`

export const footer = `<p>
  <img src="https://komarev.com/ghpvc/?username=itsyaba&color=3a3af4" alt="Profile views" />
  <a href="https://wakatime.com/@2b224cfe-965f-4f77-99f7-65a66228c302"><img src="https://wakatime.com/badge/user/2b224cfe-965f-4f77-99f7-65a66228c302.svg" alt="Coding time on WakaTime" /></a>
</p>`
