"use client";

import { useId, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { Button } from "@/components/ui/button";

export const FeaturedCarousel = ({
  slides,
}: {
  slides: { label: string; content: ReactNode }[];
}): React.JSX.Element => {
  const [active, setActive] = useState(0);
  const id = useId();
  const navigate = ({
    target,
    control,
    inputMethod,
  }: {
    target: number;
    control: string;
    inputMethod: string;
  }): void => {
    trackEvent("carousel navigated", {
      from_slide: slides[active].label,
      to_slide: slides[target].label,
      from_position: active + 1,
      to_position: target + 1,
      control,
      input_method: inputMethod,
      changed: target !== active,
    });
    setActive(target);
  };
  const move = ({
    direction,
    inputMethod,
  }: {
    direction: number;
    inputMethod: string;
  }): void =>
    navigate({
      target: (active + direction + slides.length) % slides.length,
      control: direction < 0 ? "previous" : "next",
      inputMethod,
    });

  return (
    <>
      <div className="grid">
        {slides.map(({ label, content }, index) => (
          <div
            key={label}
            id={`${id}-${index}`}
            data-carousel-slide={label}
            data-carousel-position={index + 1}
            data-analytics-source="featured"
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
            move({
              direction: event.key === "ArrowLeft" ? -1 : 1,
              inputMethod: "keyboard",
            });
          }
        }}
      >
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Previous featured plugins"
          data-attr="carousel-previous"
          onClick={(event) =>
            move({
              direction: -1,
              inputMethod: event.detail === 0 ? "keyboard" : "pointer",
            })
          }
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
            data-attr="carousel-indicator"
            onClick={(event) =>
              navigate({
                target: index,
                control: "indicator",
                inputMethod: event.detail === 0 ? "keyboard" : "pointer",
              })
            }
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
          data-attr="carousel-next"
          onClick={(event) =>
            move({
              direction: 1,
              inputMethod: event.detail === 0 ? "keyboard" : "pointer",
            })
          }
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
