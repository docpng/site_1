"use client";

import { Children, useCallback, useEffect, useRef, useState } from "react";

/**
 * Horizontally scrolling row of cards. Uses native scrolling, so swipe,
 * trackpad, shift+wheel and keyboard all work; arrows scroll one "page".
 * With `autoAdvance`, it moves every few seconds, pausing on hover/focus/touch,
 * and never moves for visitors who prefer reduced motion.
 */
export function Carousel({ label, autoAdvance = false, children }: { label: string; autoAdvance?: boolean; children: React.ReactNode }) {
  const track = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const paused = useRef(false);
  const items = Children.toArray(children);

  const update = useCallback(() => {
    const el = track.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 4);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [update]);

  const scrollByPage = useCallback((dir: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (!autoAdvance || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => {
      const el = track.current;
      if (!el || paused.current || document.hidden) return;
      if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 4) el.scrollTo({ left: 0, behavior: "smooth" });
      else scrollByPage(1);
    }, 5000);
    return () => window.clearInterval(id);
  }, [autoAdvance, scrollByPage]);

  const onPause = () => {
    paused.current = true;
  };
  const onResume = () => {
    paused.current = false;
  };

  return (
    <div
      className="relative"
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
      onMouseEnter={onPause}
      onMouseLeave={onResume}
      onFocusCapture={onPause}
      onBlurCapture={onResume}
      onTouchStart={onPause}
    >
      <div
        ref={track}
        tabIndex={0}
        className="scrollbar-none -mx-4 flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth px-4 pb-2 focus-visible:outline-2 focus-visible:outline-brand-500 sm:mx-0 sm:px-0"
      >
        {items.map((child, i) => (
          <div
            key={i}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${items.length}`}
            className="flex w-[82%] shrink-0 snap-start sm:w-[calc((100%-1.5rem)/2)] lg:w-[calc((100%-3rem)/3)] [&>*]:w-full"
          >
            {child}
          </div>
        ))}
      </div>

      {!(atStart && atEnd) && (
        <div className="mt-4 flex justify-end gap-2">
          <ArrowButton dir="prev" disabled={atStart} onClick={() => scrollByPage(-1)} />
          <ArrowButton dir="next" disabled={atEnd} onClick={() => scrollByPage(1)} />
        </div>
      )}
    </div>
  );
}

function ArrowButton({ dir, disabled, onClick }: { dir: "prev" | "next"; disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={dir === "prev" ? "Previous" : "Next"}
      className="flex h-10 w-10 items-center justify-center rounded-full border border-brand-200 bg-white text-brand-700 shadow-sm transition hover:bg-brand-50 disabled:cursor-default disabled:opacity-40"
    >
      <svg viewBox="0 0 20 20" className={`h-5 w-5 ${dir === "prev" ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
        <path d="M7.5 4.5 13 10l-5.5 5.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
