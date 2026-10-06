"use client";

import { useId, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const FeaturedCarousel = ({
  slides,
}: {
  slides: { label: string; content: ReactNode }[];
}): React.JSX.Element => {
  const [active, setActive] = useState(0);
  const id = useId();
  const move = (direction: number): void =>
    setActive(
      (current) => (current + direction + slides.length) % slides.length,
    );

  return (
    <>
      <div className="grid">
        {slides.map(({ label, content }, index) => (
          <div
            key={label}
            id={`${id}-${index}`}
            role="group"
            aria-roledescription="slide"
            aria-label={`${label}, ${index + 1} of ${slides.length}`}
            aria-hidden={active !== index}
            inert={active !== index}
            className={`col-start-1 row-start-1 ${active === index ? "visible" : "invisible"}`}
          >
            {content}
          </div>
        ))}
      </div>
      <div
        role="group"
        aria-label="Featured plugin pages"
        className="mt-2 flex h-8 items-center justify-center gap-1 text-muted-foreground"
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            event.preventDefault();
            move(event.key === "ArrowLeft" ? -1 : 1);
          }
        }}
      >
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Previous featured plugins"
          onClick={() => move(-1)}
        >
          <ChevronLeft className="size-3.5" />
        </Button>
        {slides.map(({ label }, index) => (
          <button
            key={label}
            type="button"
            aria-label={`Show ${label.toLowerCase()}`}
            aria-pressed={active === index}
            aria-controls={`${id}-${index}`}
            onClick={() => setActive(index)}
            className="flex size-8 items-center justify-center rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span
              className={`h-1.5 rounded-full transition-all motion-reduce:transition-none ${active === index ? "w-5 bg-muted-foreground" : "w-1.5 bg-muted-foreground/35 hover:bg-muted-foreground/60"}`}
            />
          </button>
        ))}
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Next featured plugins"
          onClick={() => move(1)}
        >
          <ChevronRight className="size-3.5" />
        </Button>
      </div>
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {slides[active].label}. Page {active + 1} of {slides.length}.
      </p>
    </>
  );
};
