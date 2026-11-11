<!-- ═══════════════════════════ HEADER ═══════════════════════════ -->
<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:000000,50:0b1b4d,100:0071e3&height=230&section=header&text=The%20Portfoliotext=anthonio.dev&fontSize=62fontSize=62&fontColor=ffffff&fontAlignY=36&desc=A%20liquid-glass%20portfolio%2C%20hand-built%20without%20a%20framework&descAlignY=58&descSize=18&animation=fadeIn" alt="Portfolio banner" />
</p>

<p align="center">
  <img src="https://readme-typing-svg.demolab.com?font=JetBrains+Mono&weight=600&size=20&duration=2800&pause=700&color=4DA3FF&center=true&vCenter=true&width=680&lines=Blockchain+%E2%80%A2+Cybersecurity+%E2%80%A2+AI;Apple-inspired+liquid-glass+UI+%F0%9F%AB%A7;GSAP+%2B+ScrollTrigger+%2B+Lenis+%2B+Lottie;Zero+frameworks.+Zero+build+step." alt="Typing intro" />
</p>

<p align="center">
  <a href="https://anthonio-alex-dcosta.github.io/portfolio/"><img src="https://img.shields.io/badge/%E2%96%B6_Visit_the_live_site-0071e3?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Live site" /></a>
</p>

<p align="center">
  <a href="https://anthonio-alex-dcosta.github.io/portfolio/">
    <img src=".github/assets/preview.jpg" alt="Portfolio hero section" width="100%" />
  </a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white" alt="HTML5" />
  <img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white" alt="CSS3" />
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript" />
  <img src="https://img.shields.io/badge/GSAP-88CE02?style=for-the-badge&logo=greensock&logoColor=black" alt="GSAP" />
  <img src="https://img.shields.io/badge/Lottie-00DDB3?style=for-the-badge&logo=lottiefiles&logoColor=black" alt="Lottie" />
  <img src="https://img.shields.io/badge/GitHub_Pages-222222?style=for-the-badge&logo=githubpages&logoColor=white" alt="GitHub Pages" />
</p>

<p align="center">
  <img src="https://img.shields.io/website?url=https%3A%2F%2Fanthonio-alex-dcosta.github.io%2Fportfolio%2F&style=flat-square&label=site&up_color=0071e3" alt="Site status" />
  <img src="https://img.shields.io/github/last-commit/anthonio-alex-dcosta/portfolio?style=flat-square&color=0b1b4d" alt="Last commit" />
  <img src="https://img.shields.io/badge/frameworks-0-0071e3?style=flat-square" alt="No frameworks" />
  <img src="https://img.shields.io/badge/source-~108_KB-1d4ed8?style=flat-square" alt="Source size" />
</p>

---

## 🪩 About this site

My personal website: a Computer Science graduate from **Brac University** building secure software with **blockchain, cybersecurity and AI**.

Visually it borrows from Apple's **liquid-glass** language, with frosted translucent panels, soft depth and smooth scroll-driven motion. Underneath, it's plain **HTML, CSS and JavaScript**. There's no React, no bundler and no build step, so the code you read here is the code the browser runs.

---

## 🧭 What's inside

<table>
  <tr>
    <td width="33%" valign="top">
      <h3>👋 About</h3>
      Research interests, tutoring experience and a short introduction.
    </td>
    <td width="33%" valign="top">
      <h3>🛠️ Skills</h3>
      Core focus, languages, web and blockchain, databases and tools, and professional skills.
    </td>
    <td width="33%" valign="top">
      <h3>🚀 Selected work</h3>
      Project cards for StoryGram, Missing Persons DApp, Metaverse ID and more.
    </td>
  </tr>
  <tr>
    <td width="33%" valign="top">
      <h3>📄 Research</h3>
      <i>Enabling Decentralized Identities in Metaverses Leveraging Self-sovereign Identity</i>
    </td>
    <td width="33%" valign="top">
      <h3>🎓 Journey</h3>
      A timeline from school to a BSc in CSE and student tutoring.
    </td>
    <td width="33%" valign="top">
      <h3>✉️ Contact</h3>
      <i>"Let's create something together."</i>
    </td>
  </tr>
</table>

---

## ✨ Craft details

| | Detail |
| :--: | :-- |
| 🫧 | **Liquid-glass surfaces** built from layered `backdrop-filter` blur and translucency |
| 🌗 | **Light and dark themes** with a toggle in the nav |
| 🎞️ | **GSAP + ScrollTrigger** reveal sections as you scroll |
| 🧈 | **Lenis** smooth scrolling for a native-app feel |
| ✏️ | **Hand-authored Lottie icons**, generated in code by `tools/build-lottie.mjs` and recoloured per theme in CSS |
| 📱 | **Phone layout** with an iOS-style bottom tab bar and a centred orbit hero |
| ♿ | **`prefers-reduced-motion`** respected, so animation backs off for people who ask for less |
| 📸 | **Credited photography.** Every project image is openly licensed and listed in `credits.json` |
| 📂 | **Opens from `file://`.** Lottie data ships as JS, so the site works even without a server |

---

## 🏗️ How it fits together

```mermaid
flowchart LR
    H["📄 index.html<br/>semantic sections"] --> CSS["🎨 main.css<br/>glass · themes · layout"]
    H --> JS["⚙️ main.js"]
    JS --> G["GSAP + ScrollTrigger<br/>reveals & parallax"]
    JS --> L["Lenis<br/>smooth scroll"]
    JS --> LO["lottie_light<br/>icon animations"]
    B["🛠️ tools/build-lottie.mjs"] -. generates .-> LD["assets/lottie/*.json + animations.js"]
    LD --> LO
    H -- "push to main" --> P(["🌐 GitHub Pages"])
```

<details>
<summary><b>📂 Project structure</b></summary>

```text
portfolio/
├── index.html                 every section of the site
├── assets/
│   ├── css/main.css           design tokens, glass surfaces, themes, responsive layout
│   ├── js/main.js             scroll motion, theme toggle, nav, Lottie wiring
│   ├── lottie/                generated icon animations
│   ├── img/projects/          project photography + credits.json
│   └── vendor/                GSAP, ScrollTrigger, Lenis, lottie_light (pinned, self-hosted)
├── tools/build-lottie.mjs     generates the Lottie icons from code
└── .nojekyll                  serve files as-is on GitHub Pages
```

</details>

---

## 🚀 Run it locally

```bash
git clone https://github.com/anthonio-alex-dcosta/portfolio.git
cd portfolio
open index.html            # or: npx serve .

# optional: regenerate the Lottie icons
node tools/build-lottie.mjs
```

---

<p align="center">
  <a href="https://anthonio-alex-dcosta.github.io/portfolio/"><img src="https://img.shields.io/badge/Portfolio-0071e3?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Portfolio" /></a>
  <a href="https://www.linkedin.com/in/anthonio-alex-d-costa-515aba373"><img src="https://img.shields.io/badge/LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn" /></a>
  <a href="https://github.com/anthonio-alex-dcosta"><img src="https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub" /></a>
</p>

<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:0071e3,50:0b1b4d,100:000000&height=120&section=footer" alt="footer" />
</p>
