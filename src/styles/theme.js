export const ROOT_VARS = {
  "--ink": "#1B2A4A",
  "--paper": "#F3EFE3",
  "--paper-card": "#FAF7EE",
  "--stamp": "#B23A2E",
  "--graphite": "#2B2B28",
  "--ledger": "#2F6E4F",
  "--pencil": "#8B8578",
};

export const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:wght@600;700;800&family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

.ef-root {
  font-family: 'IBM Plex Sans', sans-serif;
  background-color: var(--paper);
  background-image: repeating-linear-gradient(0deg, rgba(27,42,74,0.035) 0px, rgba(27,42,74,0.035) 1px, transparent 1px, transparent 27px);
  color: var(--graphite);
  min-height: 100vh;
}
.ef-serif { font-family: 'Source Serif 4', serif; }
.ef-mono { font-family: 'IBM Plex Mono', monospace; }

.ef-logo-box {
  width: 34px; height: 34px; border-radius: 4px; background: var(--ink); color: var(--paper);
  display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 14px;
}

.ef-card { background: var(--paper-card); border: 1.5px solid var(--ink); border-radius: 6px; position: relative; }
.ef-corner { position: absolute; width: 14px; height: 14px; pointer-events: none; }
.ef-corner.tl { top: -1.5px; left: -1.5px; border-top: 3px solid var(--stamp); border-left: 3px solid var(--stamp); }
.ef-corner.tr { top: -1.5px; right: -1.5px; border-top: 3px solid var(--stamp); border-right: 3px solid var(--stamp); }
.ef-corner.bl { bottom: -1.5px; left: -1.5px; border-bottom: 3px solid var(--stamp); border-left: 3px solid var(--stamp); }
.ef-corner.br { bottom: -1.5px; right: -1.5px; border-bottom: 3px solid var(--stamp); border-right: 3px solid var(--stamp); }

.ef-chip { border: 1.5px solid var(--pencil); background: transparent; color: var(--graphite); transition: all .15s ease; cursor: pointer; }
.ef-chip:hover { border-color: var(--ink); }
.ef-chip-active { background: var(--ink); border-color: var(--ink); color: var(--paper); }

.ef-btn-primary { background: var(--stamp); color: var(--paper); border: none; cursor: pointer; transition: transform .1s ease, box-shadow .15s ease; }
.ef-btn-primary:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 0 rgba(27,42,74,0.2); }
.ef-btn-primary:disabled { opacity: .35; cursor: not-allowed; }
.ef-btn-secondary { background: transparent; border: 1.5px solid var(--ink); color: var(--ink); cursor: pointer; transition: background .15s ease; }
.ef-btn-secondary:hover:not(:disabled) { background: rgba(27,42,74,0.06); }
.ef-btn-secondary:disabled { opacity: .3; cursor: not-allowed; }

.ef-bubble {
  width: 36px; height: 36px; border-radius: 50%; border: 2px solid var(--ink);
  display: flex; align-items: center; justify-content: center; font-family: 'IBM Plex Mono', monospace;
  font-weight: 600; font-size: 13px; cursor: pointer; flex-shrink: 0; transition: all .15s ease; background: var(--paper-card);
}
.ef-bubble:hover { border-color: var(--stamp); }
.ef-bubble-selected { background: var(--ink); color: var(--paper); border-color: var(--ink); }
.ef-bubble-correct { background: var(--ledger); color: var(--paper); border-color: var(--ledger); }
.ef-bubble-wrong { background: var(--stamp); color: var(--paper); border-color: var(--stamp); }

.ef-dot { width: 11px; height: 11px; border-radius: 50%; border: 1.5px solid var(--pencil); cursor: pointer; }
.ef-dot-answered { background: var(--ink); border-color: var(--ink); }
.ef-dot-current { box-shadow: 0 0 0 3px rgba(178,58,46,0.3); border-color: var(--stamp); }

.ef-dashed { border: 2px dashed var(--pencil); transition: border-color .15s ease, background .15s ease; }
.ef-dashed-active { border-color: var(--stamp); background: rgba(178,58,46,0.04); }

.ef-input { border: 1.5px solid var(--pencil); background: var(--paper-card); color: var(--graphite); }
.ef-input:focus { border-color: var(--ink); }

@keyframes ef-fade { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
.ef-anim { animation: ef-fade .35s ease; }
`;
