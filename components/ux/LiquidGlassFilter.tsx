/**
 * Delad SVG-refraktionsfilter för liquid glass (`#lg`).
 *
 * Monteras en gång i root-layouten. Chrome-ytor (dock, header, banners)
 * hänvisar hit via `backdrop-filter: url(#lg)`. Osynlig — bara defs.
 *
 * feTurbulence skapar en brustextur; feDisplacementMap förskjuter bakgrundens
 * pixlar så glaset böjer ljus i stället för att bara sudda.
 */
export function LiquidGlassFilter() {
  return (
    <svg
      aria-hidden
      width={0}
      height={0}
      className="pointer-events-none absolute"
      style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}
    >
      <defs>
        <filter
          id="lg"
          x="-25%"
          y="-25%"
          width="150%"
          height="150%"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.012 0.04"
            numOctaves={2}
            seed={2}
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale={16}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
    </svg>
  );
}
