<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Mystery Treasure Vault — Bargain Drop</title>
  <meta name="description" content="Click the Bargain Drop treasure chest to unlock your exclusive 10-character mystery discount code." />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@600;700;800&family=Outfit:wght@700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <style>
    :root {
      --bg-obsidian: #09090b;
      --bg-surface: #121318;
      --bg-elevated: #1a1c24;
      --text-primary: #FAFAFA;
      --text-secondary: #A1A1AA;
      --text-muted: #71717A;
      --accent-crimson: #DC2626;
      --accent-crimson-hover: #EF4444;
      --accent-gold: #F59E0B;
      --accent-gold-bright: #FBBF24;
      --accent-gold-pale: #FEF3C7;
      --border-subtle: rgba(255, 255, 255, 0.08);
      --border-gold: rgba(245, 158, 11, 0.45);
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    html, body {
      min-height: 100vh;
      background-color: var(--bg-obsidian);
      color: var(--text-primary);
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      overflow-x: hidden;
      -webkit-font-smoothing: antialiased;
    }

    /* Ambient Atmospheric Stage Lighting */
    body::before {
      content: '';
      position: fixed;
      inset: 0;
      background:
        radial-gradient(circle at 50% 38%, rgba(245, 158, 11, 0.12) 0%, rgba(220, 38, 38, 0.06) 35%, transparent 70%),
        radial-gradient(circle at 50% 100%, rgba(18, 19, 24, 0.95) 0%, var(--bg-obsidian) 100%);
      pointer-events: none;
      z-index: 0;
      transition: background 0.8s ease;
    }

    body.chest-opened::before {
      background:
        radial-gradient(circle at 50% 42%, rgba(251, 191, 36, 0.26) 0%, rgba(220, 38, 38, 0.12) 42%, transparent 75%),
        radial-gradient(circle at 50% 100%, rgba(18, 19, 24, 0.95) 0%, var(--bg-obsidian) 100%);
    }

    /* Top Minimal Brand Header */
    .top-bar {
      position: relative;
      z-index: 10;
      display: flex;
      align-items: center;
      justify-content: space-between;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px 24px;
      border-bottom: 1px solid var(--border-subtle);
    }

    .brand-link {
      display: inline-flex;
      align-items: center;
      gap: 12px;
      text-decoration: none;
      color: var(--text-primary);
      font-family: 'Outfit', sans-serif;
      font-weight: 800;
      font-size: 1.25rem;
      letter-spacing: -0.02em;
    }

    .brand-mark {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      background: linear-gradient(135deg, var(--accent-crimson) 0%, #991B1B 100%);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 14px rgba(220, 38, 38, 0.35);
      border: 1px solid rgba(255, 255, 255, 0.14);
    }

    .brand-mark svg {
      width: 20px;
      height: 20px;
      color: #fff;
    }

    .brand-link span em {
      font-style: normal;
      color: var(--accent-crimson);
    }

    .top-status {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--text-secondary);
      border-left: 2px solid var(--accent-gold);
      padding-left: 10px;
    }

    /* Main Vault Stage */
    .vault-main {
      position: relative;
      z-index: 5;
      max-width: 1120px;
      margin: 0 auto;
      min-height: calc(100vh - 81px);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 24px 72px;
      text-align: center;
    }

    .eyebrow {
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.14em;
      color: var(--accent-gold-bright);
      margin-bottom: 12px;
    }

    .headline {
      font-family: 'Outfit', sans-serif;
      font-size: clamp(2.1rem, 4.5vw, 3.5rem);
      font-weight: 900;
      line-height: 1.06;
      letter-spacing: -0.03em;
      color: var(--text-primary);
      max-width: 18ch;
      margin: 0 auto 14px;
    }

    .subheadline {
      font-size: clamp(0.98rem, 1.5vw, 1.125rem);
      color: var(--text-secondary);
      max-width: 52ch;
      line-height: 1.6;
      margin: 0 auto 36px;
      transition: color 0.3s ease;
    }

    /* Interactive Stage Row: Chest + Action Reveal Next To It */
    .treasure-interactive-row {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 32px;
      width: 100%;
      transition: all 0.6s cubic-bezier(0.22, 1, 0.36, 1);
    }

    @media (min-width: 860px) {
      .treasure-interactive-row.is-opened {
        flex-direction: row;
        align-items: center;
        justify-content: center;
        gap: 48px;
      }
    }

    /* Chest Wrapper & Interactive Trigger */
    .chest-stage {
      position: relative;
      width: 340px;
      height: 320px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-end;
      cursor: pointer;
      user-select: none;
      -webkit-tap-highlight-color: transparent;
      outline: none;
      perspective: 900px;
    }

    .chest-stage:focus-visible {
      outline: 2px solid var(--accent-gold-bright);
      outline-offset: 12px;
      border-radius: 16px;
    }

    .chest-stage.is-opened {
      cursor: default;
    }

    /* Ambient Floor Pedestal Glow */
    .chest-pedestal {
      position: absolute;
      bottom: 14px;
      width: 280px;
      height: 38px;
      background: radial-gradient(ellipse at center, rgba(245, 158, 11, 0.38) 0%, rgba(220, 38, 38, 0.14) 55%, transparent 75%);
      border-radius: 50%;
      filter: blur(6px);
      transition: transform 0.6s ease, opacity 0.6s ease, background 0.6s ease;
      z-index: 1;
    }

    .chest-stage:hover:not(.is-opened) .chest-pedestal {
      transform: scale(1.08);
      background: radial-gradient(ellipse at center, rgba(251, 191, 36, 0.55) 0%, rgba(220, 38, 38, 0.22) 55%, transparent 78%);
    }

    .chest-stage.is-opened .chest-pedestal {
      transform: scale(1.22);
      background: radial-gradient(ellipse at center, rgba(251, 191, 36, 0.72) 0%, rgba(220, 38, 38, 0.28) 58%, transparent 80%);
    }

    /* Light Rays Bursting from Inside Chest */
    .chest-light-rays {
      position: absolute;
      bottom: 85px;
      left: 50%;
      transform: translateX(-50%) scale(0.3);
      width: 340px;
      height: 240px;
      background:
        conic-gradient(
          from 240deg at 50% 85%,
          transparent 0deg,
          rgba(251, 191, 36, 0.35) 15deg,
          transparent 30deg,
          rgba(254, 243, 199, 0.45) 50deg,
          transparent 68deg,
          rgba(251, 191, 36, 0.4) 88deg,
          transparent 105deg,
          rgba(254, 243, 199, 0.35) 120deg,
          transparent 135deg
        );
      filter: blur(8px);
      opacity: 0;
      pointer-events: none;
      z-index: 2;
      transition: opacity 0.55s ease, transform 0.65s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .chest-stage.is-opened .chest-light-rays {
      opacity: 1;
      transform: translateX(-50%) scale(1.05);
      animation: raysPulse 4s ease-in-out infinite alternate;
    }

    @keyframes raysPulse {
      0% { opacity: 0.78; transform: translateX(-50%) scale(1); }
      100% { opacity: 1; transform: translateX(-50%) scale(1.08); }
    }

    /* Treasure Chest Assembly */
    .chest-assembly {
      position: relative;
      width: 260px;
      height: 200px;
      z-index: 3;
      margin-bottom: 24px;
      transform-style: preserve-3d;
      animation: idleFloat 3.4s ease-in-out infinite;
    }

    .chest-stage:hover:not(.is-opened):not(.is-opening) .chest-assembly {
      transform: translateY(-5px) scale(1.02);
    }

    .chest-stage.is-opening .chest-assembly {
      animation: chestRumble 0.55s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
    }

    .chest-stage.is-opened .chest-assembly {
      animation: none;
      transform: translateY(0);
    }

    @keyframes idleFloat {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-6px); }
    }

    @keyframes chestRumble {
      0% { transform: translate(0, 0) rotate(0deg) scale(1); }
      15% { transform: translate(-5px, -2px) rotate(-2.5deg) scale(1.03); }
      30% { transform: translate(5px, 1px) rotate(2.5deg) scale(1.04); }
      45% { transform: translate(-6px, -3px) rotate(-3deg) scale(1.05); }
      60% { transform: translate(6px, 2px) rotate(3deg) scale(1.06); }
      75% { transform: translate(-4px, -4px) rotate(-1.5deg) scale(1.07); }
      90% { transform: translate(3px, -2px) rotate(1.5deg) scale(1.05); }
      100% { transform: translate(0, 0) rotate(0deg) scale(1); }
    }

    /* Inside Vault Cavity & Golden Hoard (Behind the front wall, revealed when lid opens) */
    .chest-interior {
      position: absolute;
      top: 56px;
      left: 14px;
      right: 14px;
      height: 58px;
      background: linear-gradient(180deg, #1b0d06 0%, #3d1c08 60%, #78350f 100%);
      border-radius: 8px 8px 0 0;
      border: 2px solid #92400e;
      overflow: visible;
      z-index: 2;
      box-shadow: inset 0 10px 24px rgba(0, 0, 0, 0.85);
    }

    /* Glowing Gold Coins & Gems Inside Chest */
    .interior-treasure-glow {
      position: absolute;
      inset: 4px 8px 0 8px;
      background: radial-gradient(ellipse at 50% 80%, #FEF08A 0%, #F59E0B 50%, rgba(180, 83, 9, 0) 100%);
      opacity: 0;
      transition: opacity 0.4s ease 0.15s;
      border-radius: 50% 50% 0 0;
    }

    .chest-stage.is-opened .interior-treasure-glow {
      opacity: 1;
    }

    .coins-svg {
      position: absolute;
      bottom: -6px;
      left: 50%;
      transform: translateX(-50%) translateY(10px) scale(0.85);
      width: 210px;
      height: 46px;
      opacity: 0;
      transition: opacity 0.45s ease 0.18s, transform 0.5s cubic-bezier(0.22, 1, 0.36, 1) 0.18s;
      z-index: 3;
    }

    .chest-stage.is-opened .coins-svg {
      opacity: 1;
      transform: translateX(-50%) translateY(0) scale(1);
    }

    /* THE REVEALED 10-CHARACTER CODE INSIDE THE CHEST */
    .inside-chest-code-card {
      position: absolute;
      left: 50%;
      bottom: 82px;
      transform: translateX(-50%) translateY(48px) scale(0.45);
      opacity: 0;
      pointer-events: none;
      z-index: 6;
      width: 276px;
      background: linear-gradient(180deg, #1E1F29 0%, #12131A 100%);
      border: 2px solid var(--accent-gold-bright);
      border-radius: 12px;
      padding: 12px 14px 10px;
      box-shadow:
        0 18px 40px rgba(0, 0, 0, 0.85),
        0 0 28px rgba(245, 158, 11, 0.45),
        inset 0 1px 0 rgba(255, 255, 255, 0.2);
      transition:
        transform 0.65s cubic-bezier(0.18, 1.25, 0.32, 1) 0.22s,
        opacity 0.4s ease 0.2s;
    }

    .chest-stage.is-opened .inside-chest-code-card {
      transform: translateX(-50%) translateY(-16px) scale(1);
      opacity: 1;
      pointer-events: auto;
    }

    .code-card-label {
      font-size: 0.68rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: var(--accent-gold-bright);
      margin-bottom: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }

    .code-display-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: rgba(9, 9, 11, 0.85);
      border: 1px solid rgba(251, 191, 36, 0.35);
      border-radius: 8px;
      padding: 8px 10px;
      gap: 8px;
    }

    .secret-code-text {
      font-family: 'JetBrains Mono', monospace;
      font-size: 1.18rem;
      font-weight: 800;
      letter-spacing: 0.12em;
      color: #FEF3C7;
      text-shadow: 0 0 12px rgba(251, 191, 36, 0.45);
      user-select: all;
    }

    .copy-code-btn {
      background: rgba(245, 158, 11, 0.16);
      color: var(--accent-gold-bright);
      border: 1px solid rgba(245, 158, 11, 0.4);
      border-radius: 6px;
      padding: 6px 10px;
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      cursor: pointer;
      transition: all 0.2s ease;
      flex-shrink: 0;
    }

    .copy-code-btn:hover {
      background: var(--accent-gold-bright);
      color: #09090b;
    }

    .copy-code-btn.copied {
      background: #10B981;
      border-color: #10B981;
      color: #052E16;
    }

    /* Chest Lid (Top Half - Swings Open on Click) */
    .chest-lid {
      position: absolute;
      top: 18px;
      left: 10px;
      right: 10px;
      height: 76px;
      background:
        linear-gradient(180deg, #9A3412 0%, #7C2D12 48%, #431407 100%);
      border-radius: 38px 38px 4px 4px;
      border: 3px solid #D97706;
      box-shadow:
        inset 0 6px 12px rgba(254, 243, 199, 0.22),
        inset 0 -8px 14px rgba(0, 0, 0, 0.6),
        0 6px 16px rgba(0, 0, 0, 0.5);
      transform-origin: 50% 100%;
      transform: rotateX(0deg);
      transition:
        transform 0.7s cubic-bezier(0.22, 1, 0.36, 1),
        box-shadow 0.5s ease,
        filter 0.5s ease;
      z-index: 5;
      overflow: hidden;
    }

    /* Lid Metallic Straps */
    .chest-lid::before,
    .chest-lid::after {
      content: '';
      position: absolute;
      top: 0;
      bottom: 0;
      width: 22px;
      background: linear-gradient(90deg, #B45309 0%, #FBBF24 50%, #92400E 100%);
      border-left: 1px solid rgba(254, 243, 199, 0.5);
      border-right: 1px solid rgba(69, 26, 3, 0.8);
    }

    .chest-lid::before { left: 32px; }
    .chest-lid::after { right: 32px; }

    /* Lid Wood Plank Grain Line */
    .lid-ridge {
      position: absolute;
      left: 0;
      right: 0;
      top: 50%;
      height: 2px;
      background: rgba(0, 0, 0, 0.45);
      box-shadow: 0 1px 0 rgba(255, 255, 255, 0.08);
    }

    /* Open State for Chest Lid */
    .chest-stage.is-opened .chest-lid {
      transform: translateY(-28px) rotateX(68deg) scaleY(0.72);
      filter: brightness(0.92);
      box-shadow:
        inset 0 -10px 18px rgba(251, 191, 36, 0.35),
        0 -8px 24px rgba(245, 158, 11, 0.35);
      z-index: 1;
    }

    /* Chest Base (Front Lower Box) */
    .chest-base {
      position: absolute;
      bottom: 12px;
      left: 10px;
      right: 10px;
      height: 102px;
      background:
        linear-gradient(180deg, #7C2D12 0%, #5B1E0C 55%, #3B1105 100%);
      border-radius: 4px 4px 16px 16px;
      border: 3px solid #D97706;
      box-shadow:
        inset 0 6px 12px rgba(0, 0, 0, 0.65),
        inset 0 -6px 12px rgba(0, 0, 0, 0.7),
        0 16px 32px rgba(0, 0, 0, 0.8);
      z-index: 4;
      overflow: hidden;
    }

    /* Base Metallic Straps */
    .chest-base::before,
    .chest-base::after {
      content: '';
      position: absolute;
      top: 0;
      bottom: 0;
      width: 22px;
      background: linear-gradient(90deg, #B45309 0%, #FBBF24 50%, #92400E 100%);
      border-left: 1px solid rgba(254, 243, 199, 0.45);
      border-right: 1px solid rgba(69, 26, 3, 0.8);
    }

    .chest-base::before { left: 32px; }
    .chest-base::after { right: 32px; }

    /* Horizontal Wood Slat Lines on Base */
    .base-plank-1,
    .base-plank-2 {
      position: absolute;
      left: 0;
      right: 0;
      height: 2px;
      background: rgba(0, 0, 0, 0.5);
      box-shadow: 0 1px 0 rgba(255, 255, 255, 0.06);
    }
    .base-plank-1 { top: 34px; }
    .base-plank-2 { top: 68px; }

    /* Center Golden Lock Escutcheon */
    .chest-lock {
      position: absolute;
      top: 68px;
      left: 50%;
      transform: translateX(-50%);
      width: 44px;
      height: 52px;
      background: linear-gradient(180deg, #FDE68A 0%, #F59E0B 45%, #B45309 100%);
      border: 2px solid #FEF3C7;
      border-radius: 8px 8px 20px 20px;
      box-shadow:
        0 6px 16px rgba(0, 0, 0, 0.65),
        0 0 18px rgba(245, 158, 11, 0.4);
      z-index: 7;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      transition: transform 0.55s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.4s ease;
    }

    .keyhole-circle {
      width: 11px;
      height: 11px;
      background: #1C1917;
      border-radius: 50%;
      margin-top: 2px;
    }

    .keyhole-slot {
      width: 5px;
      height: 11px;
      background: #1C1917;
      margin-top: -2px;
      border-radius: 0 0 3px 3px;
    }

    .chest-stage:hover:not(.is-opened) .chest-lock {
      box-shadow:
        0 6px 16px rgba(0, 0, 0, 0.65),
        0 0 26px rgba(251, 191, 36, 0.85);
    }

    .chest-stage.is-opened .chest-lock {
      transform: translateX(-50%) translateY(16px) scale(0.92);
    }

    /* Prompt Under Chest */
    .click-prompt {
      position: relative;
      z-index: 5;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 0.85rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--accent-gold-bright);
      padding: 8px 16px;
      border: 1px solid rgba(245, 158, 11, 0.35);
      border-radius: 8px;
      background: rgba(24, 24, 27, 0.8);
      transition: all 0.3s ease;
    }

    .chest-stage:hover:not(.is-opened) .click-prompt {
      background: rgba(245, 158, 11, 0.16);
      border-color: var(--accent-gold-bright);
      transform: translateY(-2px);
    }

    .chest-stage.is-opened .click-prompt {
      opacity: 0;
      pointer-events: none;
      transform: translateY(8px);
    }

    /* Sparkle Particles Burst */
    .sparkles-layer {
      position: absolute;
      inset: 0;
      pointer-events: none;
      z-index: 8;
    }

    .sparkle-dot {
      position: absolute;
      left: 50%;
      top: 46%;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--accent-gold-bright);
      box-shadow: 0 0 12px var(--accent-gold-bright);
      opacity: 0;
    }

    .chest-stage.is-opened .sparkle-dot {
      animation: particleBurst 1.1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    @keyframes particleBurst {
      0% {
        opacity: 1;
        transform: translate(0, 0) scale(0.4);
      }
      70% {
        opacity: 1;
      }
      100% {
        opacity: 0;
        transform: translate(var(--tx), var(--ty)) scale(1.1);
      }
    }

    /* REVEALED PANEL NEXT TO CHEST ("Go to Bargain Drop" button + instructions) */
    .reveal-action-panel {
      max-width: 380px;
      width: 100%;
      background: linear-gradient(180deg, rgba(26, 28, 36, 0.92) 0%, rgba(18, 19, 24, 0.96) 100%);
      border: 1px solid var(--border-gold);
      border-radius: 14px;
      padding: 28px 26px;
      text-align: left;
      box-shadow: 0 24px 48px rgba(0, 0, 0, 0.65);
      opacity: 0;
      max-height: 0;
      overflow: hidden;
      padding-top: 0;
      padding-bottom: 0;
      border-width: 0;
      transform: translateX(24px) scale(0.95);
      pointer-events: none;
      transition:
        opacity 0.55s ease 0.3s,
        transform 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.3s,
        max-height 0.55s ease 0.2s,
        padding 0.55s ease 0.2s,
        border-width 0.3s ease 0.2s;
    }

    .treasure-interactive-row.is-opened .reveal-action-panel {
      opacity: 1;
      max-height: 360px;
      padding: 28px 26px;
      border-width: 1px;
      transform: translateX(0) scale(1);
      pointer-events: auto;
    }

    .panel-tag {
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #10B981;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .panel-title {
      font-family: 'Outfit', sans-serif;
      font-size: 1.5rem;
      font-weight: 800;
      line-height: 1.2;
      color: var(--text-primary);
      margin-bottom: 10px;
    }

    .panel-desc {
      font-size: 0.92rem;
      color: var(--text-secondary);
      line-height: 1.55;
      margin-bottom: 22px;
    }

    .go-bargain-drop-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      width: 100%;
      padding: 15px 22px;
      border-radius: 10px;
      background: linear-gradient(135deg, var(--accent-crimson) 0%, #B91C1C 100%);
      color: #FFFFFF;
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 0.98rem;
      font-weight: 700;
      letter-spacing: 0.01em;
      text-decoration: none;
      border: 1px solid rgba(255, 255, 255, 0.18);
      box-shadow: 0 10px 24px rgba(220, 38, 38, 0.4);
      cursor: pointer;
      transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
    }

    .go-bargain-drop-btn:hover {
      background: linear-gradient(135deg, var(--accent-crimson-hover) 0%, var(--accent-crimson) 100%);
      transform: translateY(-2px);
      box-shadow: 0 14px 28px rgba(220, 38, 38, 0.55);
    }

    .go-bargain-drop-btn:active {
      transform: translateY(0);
    }

    .go-bargain-drop-btn svg {
      width: 18px;
      height: 18px;
      transition: transform 0.2s ease;
    }

    .go-bargain-drop-btn:hover svg {
      transform: translateX(4px);
    }

    @media (prefers-reduced-motion: reduce) {
      .chest-assembly,
      .chest-stage.is-opened .chest-light-rays {
        animation: none !important;
      }
      .chest-lid,
      .inside-chest-code-card,
      .reveal-action-panel {
        transition-duration: 0.15s !important;
      }
    }
  </style>
</head>
<body>
  <header class="top-bar">
    <a href="/" class="brand-link" aria-label="Bargain Drop Home">
      <span class="brand-mark">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path stroke-linecap="round" stroke-linejoin="round" d="M16 10a4 4 0 01-8 0" />
        </svg>
      </span>
      <span>BARGAIN<em>DROP</em></span>
    </a>
    <div class="top-status">Mystery Vault Drop</div>
  </header>

  <main class="vault-main">
    <p class="eyebrow">Exclusive Vault Reward</p>
    <h1 class="headline" id="vaultHeadline">Unlock the Bargain Drop Treasure Chest</h1>
    <p class="subheadline" id="vaultSubheadline">
      Click the sealed treasure chest below to break the lock and reveal your unique 10-character reward code inside.
    </p>

    <div class="treasure-interactive-row" id="interactiveRow">
      <!-- Interactive Treasure Chest -->
      <div
        class="chest-stage"
        id="treasureChest"
        role="button"
        tabindex="0"
        aria-label="Closed treasure chest. Click or press Enter to open and reveal your 10-character discount code."
        aria-expanded="false"
      >
        <div class="chest-light-rays" aria-hidden="true"></div>

        <!-- Burst Particles -->
        <div class="sparkles-layer" aria-hidden="true">
          <span class="sparkle-dot" style="--tx: -115px; --ty: -95px;"></span>
          <span class="sparkle-dot" style="--tx: 115px; --ty: -90px;"></span>
          <span class="sparkle-dot" style="--tx: -140px; --ty: -25px;"></span>
          <span class="sparkle-dot" style="--tx: 140px; --ty: -30px;"></span>
          <span class="sparkle-dot" style="--tx: -70px; --ty: -130px;"></span>
          <span class="sparkle-dot" style="--tx: 75px; --ty: -125px;"></span>
          <span class="sparkle-dot" style="--tx: 0px; --ty: -145px;"></span>
        </div>

        <div class="chest-assembly">
          <!-- Chest Lid (Swings Open) -->
          <div class="chest-lid">
            <div class="lid-ridge"></div>
          </div>

          <!-- Chest Interior & Gold Coins -->
          <div class="chest-interior">
            <div class="interior-treasure-glow"></div>
            <svg class="coins-svg" viewBox="0 0 210 46" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <ellipse cx="42" cy="34" rx="22" ry="10" fill="#F59E0B" stroke="#FEF3C7" stroke-width="1.5"/>
              <ellipse cx="78" cy="28" rx="24" ry="11" fill="#FBBF24" stroke="#FEF3C7" stroke-width="1.5"/>
              <ellipse cx="132" cy="29" rx="24" ry="11" fill="#F59E0B" stroke="#FEF3C7" stroke-width="1.5"/>
              <ellipse cx="168" cy="35" rx="20" ry="9" fill="#D97706" stroke="#FEF3C7" stroke-width="1.5"/>
              <ellipse cx="105" cy="24" rx="26" ry="12" fill="#FDE047" stroke="#FFFFFF" stroke-width="1.5"/>
              <polygon points="105,6 115,16 105,26 95,16" fill="#EF4444" stroke="#FECACA" stroke-width="1.2"/>
            </svg>
          </div>

          <!-- Revealed 10-Character Code Emerging From Inside the Chest -->
          <div class="inside-chest-code-card" id="codeCard" aria-live="polite">
            <div class="code-card-label">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 2L14.8 8.5L22 9.3L16.5 14L18.2 21L12 17.3L5.8 21L7.5 14L2 9.3L9.2 8.5L12 2Z" />
              </svg>
              <span>Unlocked 10-Char Code</span>
            </div>
            <div class="code-display-row">
              <span class="secret-code-text" id="discountCodeValue">----------</span>
              <button type="button" class="copy-code-btn" id="copyCodeBtn" aria-label="Copy discount code">
                Copy
              </button>
            </div>
          </div>

          <!-- Chest Front Lock -->
          <div class="chest-lock" aria-hidden="true">
            <div class="keyhole-circle"></div>
            <div class="keyhole-slot"></div>
          </div>

          <!-- Chest Lower Base -->
          <div class="chest-base">
            <div class="base-plank-1"></div>
            <div class="base-plank-2"></div>
          </div>
        </div>

        <div class="chest-pedestal" aria-hidden="true"></div>

        <div class="click-prompt" id="clickPrompt">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" />
          </svg>
          <span>Click Treasure Chest to Open</span>
        </div>
      </div>

      <!-- Revealed Next to the Chest: "Go to Bargain Drop" CTA Panel -->
      <aside class="reveal-action-panel" id="revealPanel" aria-hidden="true">
        <div class="panel-tag">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span>Treasure Chest Unlocked</span>
        </div>
        <h2 class="panel-title">Your Mystery Code is Ready</h2>
        <p class="panel-desc">
          Your unique 10-character code has been revealed inside the chest and saved for your visit. Head straight to the Bargain Drop homepage to shop live drops.
        </p>
        <a href="/" class="go-bargain-drop-btn" id="goBargainDropBtn">
          <span>Go to Bargain Drop</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14M13 5l7 7-7 7" />
          </svg>
        </a>
      </aside>
    </div>
  </main>

  <script>
    (function () {
      const chestEl = document.getElementById('treasureChest');
      const interactiveRow = document.getElementById('interactiveRow');
      const codeValueEl = document.getElementById('discountCodeValue');
      const copyBtn = document.getElementById('copyCodeBtn');
      const headlineEl = document.getElementById('vaultHeadline');
      const subheadlineEl = document.getElementById('vaultSubheadline');
      const revealPanel = document.getElementById('revealPanel');
      const goBtn = document.getElementById('goBargainDropBtn');

      // Ensure homepage navigation works cleanly both on bargain-drop.online and local preview
      const homeUrl = window.location.hostname.includes('bargain-drop.online') ? 'https://bargain-drop.online/' : '/';
      if (goBtn) {
        goBtn.setAttribute('href', homeUrl);
      }

      let isOpened = false;
      let isOpening = false;
      let generatedCode = '';

      // Generate a cryptographically random 10-character alphanumeric code
      function generateRandom10CharCode() {
        const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        const values = new Uint32Array(10);
        if (window.crypto && window.crypto.getRandomValues) {
          window.crypto.getRandomValues(values);
        } else {
          for (let i = 0; i < 10; i++) {
            values[i] = Math.floor(Math.random() * charset.length);
          }
        }
        let result = '';
        for (let i = 0; i < 10; i++) {
          result += charset[values[i] % charset.length];
        }
        return result;
      }

      function openTreasureChest() {
        if (isOpened || isOpening) return;
        isOpening = true;

        generatedCode = generateRandom10CharCode();
        codeValueEl.textContent = generatedCode;

        try {
          localStorage.setItem('bd_mystery_discount_code', generatedCode);
        } catch (_e) {
          // Ignore storage errors in private browsing
        }

        // Trigger anticipation shake animation first
        chestEl.classList.add('is-opening');

        setTimeout(function () {
          chestEl.classList.remove('is-opening');
          chestEl.classList.add('is-opened');
          chestEl.setAttribute('aria-expanded', 'true');
          chestEl.setAttribute('aria-label', 'Opened treasure chest revealing discount code ' + generatedCode);
          interactiveRow.classList.add('is-opened');
          document.body.classList.add('chest-opened');
          revealPanel.setAttribute('aria-hidden', 'false');

          headlineEl.textContent = 'Treasure Unlocked!';
          subheadlineEl.textContent = 'Copy your 10-character code from inside the chest and head to Bargain Drop.';
          isOpened = true;
          isOpening = false;
        }, 480);
      }

      chestEl.addEventListener('click', function (e) {
        if (e.target === copyBtn || copyBtn.contains(e.target)) return;
        openTreasureChest();
      });

      chestEl.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          if (document.activeElement === copyBtn) return;
          e.preventDefault();
          openTreasureChest();
        }
      });

      copyBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (!generatedCode) return;

        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(generatedCode).then(showCopiedFeedback).catch(fallbackCopy);
        } else {
          fallbackCopy();
        }
      });

      function fallbackCopy() {
        const tempInput = document.createElement('input');
        tempInput.value = generatedCode;
        document.body.appendChild(tempInput);
        tempInput.select();
        try {
          document.execCommand('copy');
        } catch (_err) {}
        document.body.removeChild(tempInput);
        showCopiedFeedback();
      }

      function showCopiedFeedback() {
        copyBtn.textContent = 'Copied!';
        copyBtn.classList.add('copied');
        setTimeout(function () {
          copyBtn.textContent = 'Copy';
          copyBtn.classList.remove('copied');
        }, 2000);
      }
    })();
  </script>
</body>
</html>