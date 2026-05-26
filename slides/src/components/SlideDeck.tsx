import { useCallback, useEffect, useState, type ReactNode } from "react";
import type { Slide } from "../slides";

type Props = { slides: Slide[] };

const FONT_SCALE_MIN = 0.75;
const FONT_SCALE_MAX = 2;
const FONT_SCALE_STEP = 0.1;
const FONT_SCALE_DEFAULT = 1;

export default function SlideDeck({ slides }: Props) {
  const [index, setIndex] = useState(0);
  const [fontScale, setFontScale] = useState(FONT_SCALE_DEFAULT);
  const total = slides.length;
  const current = slides[index];

  const changeFontScale = useCallback((delta: number) => {
    setFontScale((s) => {
      const next = Math.round((s + delta) * 10) / 10;
      return Math.min(FONT_SCALE_MAX, Math.max(FONT_SCALE_MIN, next));
    });
  }, []);

  useEffect(() => {
    document.documentElement.style.fontSize = `${16 * fontScale}px`;
    return () => {
      document.documentElement.style.fontSize = "";
    };
  }, [fontScale]);

  const go = useCallback(
    (delta: number) => {
      setIndex((i) => Math.min(total - 1, Math.max(0, i + delta)));
    },
    [total],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") {
        e.preventDefault();
        go(1);
      } else if (e.key === "ArrowLeft" || e.key === "PageUp" || e.key === "Backspace") {
        e.preventDefault();
        go(-1);
      } else if (e.key === "Home") {
        e.preventDefault();
        setIndex(0);
      } else if (e.key === "End") {
        e.preventDefault();
        setIndex(total - 1);
      } else if (e.key === "f" || e.key === "F") {
        if (!document.fullscreenElement) {
          void document.documentElement.requestFullscreen();
        } else {
          void document.exitFullscreen();
        }
      } else if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        changeFontScale(FONT_SCALE_STEP);
      } else if (e.key === "-") {
        e.preventDefault();
        changeFontScale(-FONT_SCALE_STEP);
      } else if (e.key === "0") {
        e.preventDefault();
        setFontScale(FONT_SCALE_DEFAULT);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, total, changeFontScale]);

  const progress = ((index + 1) / total) * 100;

  const atMinScale = fontScale <= FONT_SCALE_MIN;
  const atMaxScale = fontScale >= FONT_SCALE_MAX;

  return (
    <div className="deck">
      <div className="progress-track" aria-hidden>
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <header className="deck-header">
        <div className="deck-header-start">
          {current.section && <span className="section-tag">{current.section}</span>}
        </div>
        <div className="font-controls" role="group" aria-label="Font size">
          <NavButton
            label="Decrease font size"
            disabled={atMinScale}
            onClick={() => changeFontScale(-FONT_SCALE_STEP)}
          >
            A−
          </NavButton>
          <span className="font-scale-label" aria-live="polite">
            {Math.round(fontScale * 100)}%
          </span>
          <NavButton
            label="Increase font size"
            disabled={atMaxScale}
            onClick={() => changeFontScale(FONT_SCALE_STEP)}
          >
            A+
          </NavButton>
        </div>
        <span className="slide-counter">
          {index + 1} / {total}
        </span>
      </header>

      <main
        className="slide-viewport"
        onClick={(e) => {
          if ((e.target as HTMLElement).closest(".font-controls, .deck-footer, button")) return;
          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
          const x = e.clientX - rect.left;
          if (x < rect.width * 0.28) go(-1);
          else if (x > rect.width * 0.72) go(1);
        }}
      >
        <article key={current.id} className="slide animate-in">
          {current.content}
        </article>
      </main>

      <footer className="deck-footer">
        <NavButton label="Previous" disabled={index === 0} onClick={() => go(-1)}>
          ←
        </NavButton>
        <div className="dot-nav" role="tablist" aria-label="Slides">
          {slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Slide ${i + 1}: ${s.id}`}
              className={i === index ? "dot active" : "dot"}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
        <NavButton label="Next" disabled={index === total - 1} onClick={() => go(1)}>
          →
        </NavButton>
      </footer>
    </div>
  );
}

function NavButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button type="button" className="nav-btn" aria-label={label} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  );
}
