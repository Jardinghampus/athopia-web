"use client";

import React, { MouseEvent, useEffect, useRef, useState } from "react";

type AwardBadgeType =
  | "golden-kitty"
  | "product-of-the-day"
  | "product-of-the-month"
  | "product-of-the-week"
  | "athopia";

interface AwardBadgeProps {
  type?: AwardBadgeType;
  place?: number;
  link?: string;
}

const identityMatrix =
  "1, 0, 0, 0, " +
  "0, 1, 0, 0, " +
  "0, 0, 1, 0, " +
  "0, 0, 0, 1";

const maxRotate = 0.25;
const minRotate = -0.25;
const maxScale = 1;
const minScale = 0.97;

const backgroundColor = ["#c8f0e0", "#ddd", "#a8e6cf"];

const title: Record<AwardBadgeType, string> = {
  "golden-kitty": "Golden Kitty Awards",
  "product-of-the-day": "Product of the Day",
  "product-of-the-month": "Product of the Month",
  "product-of-the-week": "Product of the Week",
  athopia: "ATHOPIA",
};

const subtitle: Record<AwardBadgeType, string> = {
  "golden-kitty": "Golden Kitty Awards",
  "product-of-the-day": "Product of the Day",
  "product-of-the-month": "Product of the Month",
  "product-of-the-week": "Product of the Week",
  athopia: "Allsvenskan Community",
};

export const AwardBadge = ({
  type = "athopia",
  place,
  link = "#",
}: AwardBadgeProps) => {
  const ref = useRef<HTMLAnchorElement>(null);
  const [firstOverlayPosition, setFirstOverlayPosition] = useState<number>(0);
  const [matrix, setMatrix] = useState<string>(identityMatrix);
  const [currentMatrix, setCurrentMatrix] = useState<string>(identityMatrix);
  const [disableInOutOverlayAnimation, setDisableInOutOverlayAnimation] =
    useState<boolean>(true);
  const [disableOverlayAnimation, setDisableOverlayAnimation] =
    useState<boolean>(false);
  const [isTimeoutFinished, setIsTimeoutFinished] = useState<boolean>(false);
  const enterTimeout = useRef<NodeJS.Timeout>(null);
  const leaveTimeout1 = useRef<NodeJS.Timeout>(null);
  const leaveTimeout2 = useRef<NodeJS.Timeout>(null);
  const leaveTimeout3 = useRef<NodeJS.Timeout>(null);

  const getDimensions = () => {
    const left = ref?.current?.getBoundingClientRect()?.left || 0;
    const right = ref?.current?.getBoundingClientRect()?.right || 0;
    const top = ref?.current?.getBoundingClientRect()?.top || 0;
    const bottom = ref?.current?.getBoundingClientRect()?.bottom || 0;

    return { left, right, top, bottom };
  };

  const getMatrix = (clientX: number, clientY: number) => {
    const { left, right, top, bottom } = getDimensions();
    const xCenter = (left + right) / 2;
    const yCenter = (top + bottom) / 2;

    const scale = [
      maxScale -
        ((maxScale - minScale) * Math.abs(xCenter - clientX)) /
          (xCenter - left),
      maxScale -
        ((maxScale - minScale) * Math.abs(yCenter - clientY)) /
          (yCenter - top),
      maxScale -
        ((maxScale - minScale) *
          (Math.abs(xCenter - clientX) + Math.abs(yCenter - clientY))) /
          (xCenter - left + yCenter - top),
    ];

    const rotate = {
      x1:
        0.25 *
        ((yCenter - clientY) / yCenter - (xCenter - clientX) / xCenter),
      x2:
        maxRotate -
        (maxRotate - minRotate) * Math.abs(right - clientX) / (right - left),
      x3: 0,
      y0: 0,
      y2:
        maxRotate -
        (maxRotate - minRotate) * (top - clientY) / (top - bottom),
      y3: 0,
      z0: -(
        maxRotate -
        (maxRotate - minRotate) * Math.abs(right - clientX) / (right - left)
      ),
      z1: 0.2 - (0.2 + 0.6) * ((top - clientY) / (top - bottom)),
      z3: 0,
    };
    return (
      `${scale[0]}, ${rotate.y0}, ${rotate.z0}, 0, ` +
      `${rotate.x1}, ${scale[1]}, ${rotate.z1}, 0, ` +
      `${rotate.x2}, ${rotate.y2}, ${scale[2]}, 0, ` +
      `${rotate.x3}, ${rotate.y3}, ${rotate.z3}, 1`
    );
  };

  const getOppositeMatrix = (
    _matrix: string,
    clientY: number,
    onMouseEnter?: boolean
  ) => {
    const { top, bottom } = getDimensions();
    const oppositeY = bottom - clientY + top;
    const weakening = onMouseEnter ? 0.7 : 4;
    const multiplier = onMouseEnter ? -1 : 1;

    return _matrix
      .split(", ")
      .map((item, index) => {
        if (index === 2 || index === 4 || index === 8) {
          return (-parseFloat(item) * multiplier) / weakening;
        } else if (index === 0 || index === 5 || index === 10) {
          return "1";
        } else if (index === 6) {
          return (
            (multiplier *
              (maxRotate -
                (maxRotate - minRotate) * ((top - oppositeY) / (top - bottom)))) /
            weakening
          );
        } else if (index === 9) {
          return (
            (maxRotate -
              (maxRotate - minRotate) * ((top - oppositeY) / (top - bottom))) /
            weakening
          );
        }
        return item;
      })
      .join(", ");
  };

  const onMouseEnter = (e: MouseEvent<HTMLAnchorElement>) => {
    if (leaveTimeout1.current) clearTimeout(leaveTimeout1.current);
    if (leaveTimeout2.current) clearTimeout(leaveTimeout2.current);
    if (leaveTimeout3.current) clearTimeout(leaveTimeout3.current);
    setDisableOverlayAnimation(true);

    const { left, right, top, bottom } = getDimensions();
    const xCenter = (left + right) / 2;
    const yCenter = (top + bottom) / 2;

    setDisableInOutOverlayAnimation(false);
    enterTimeout.current = setTimeout(
      () => setDisableInOutOverlayAnimation(true),
      350
    );
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setFirstOverlayPosition(
          (Math.abs(xCenter - e.clientX) + Math.abs(yCenter - e.clientY)) / 1.5
        );
      });
    });

    const matrix = getMatrix(e.clientX, e.clientY);
    const oppositeMatrix = getOppositeMatrix(matrix, e.clientY, true);

    setMatrix(oppositeMatrix);
    setIsTimeoutFinished(false);
    setTimeout(() => {
      setIsTimeoutFinished(true);
    }, 200);
  };

  const onMouseMove = (e: MouseEvent<HTMLAnchorElement>) => {
    const { left, right, top, bottom } = getDimensions();
    const xCenter = (left + right) / 2;
    const yCenter = (top + bottom) / 2;

    setTimeout(
      () =>
        setFirstOverlayPosition(
          (Math.abs(xCenter - e.clientX) + Math.abs(yCenter - e.clientY)) / 1.5
        ),
      150
    );

    if (isTimeoutFinished) {
      setCurrentMatrix(getMatrix(e.clientX, e.clientY));
    }
  };

  const onMouseLeave = (e: MouseEvent<HTMLAnchorElement>) => {
    const oppositeMatrix = getOppositeMatrix(matrix, e.clientY);

    if (enterTimeout.current) clearTimeout(enterTimeout.current);

    setCurrentMatrix(oppositeMatrix);
    setTimeout(() => setCurrentMatrix(identityMatrix), 200);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setDisableInOutOverlayAnimation(false);
        leaveTimeout1.current = setTimeout(
          () => setFirstOverlayPosition(-firstOverlayPosition / 4),
          150
        );
        leaveTimeout2.current = setTimeout(
          () => setFirstOverlayPosition(0),
          300
        );
        leaveTimeout3.current = setTimeout(() => {
          setDisableOverlayAnimation(false);
          setDisableInOutOverlayAnimation(true);
        }, 500);
      });
    });
  };

  useEffect(() => {
    if (isTimeoutFinished) {
      setMatrix(currentMatrix);
    }
  }, [currentMatrix, isTimeoutFinished]);

  const overlayAnimations = [...Array(10).keys()]
    .map(
      (e) => `
    @keyframes overlayAnimation${e + 1} {
      0% {
        transform: rotate(${e * 10}deg);
      }
      50% {
        transform: rotate(${(e + 1) * 10}deg);
      }
      100% {
        transform: rotate(${e * 10}deg);
      }
    }
    `
    )
    .join(" ");

  const displayTitle =
    type === "athopia"
      ? title.athopia
      : `${title[type]}${place ? ` #${place}` : ""}`;

  const displaySubtitle = type === "athopia" ? subtitle.athopia : "PRODUCT HUNT";

  return (
    <a
      ref={ref}
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className="block w-[180px] sm:w-[260px] h-auto cursor-pointer"
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      onMouseEnter={onMouseEnter}
    >
      <style>{overlayAnimations}</style>
      <div
        style={{
          transform: `perspective(700px) matrix3d(${matrix})`,
          transformOrigin: "center center",
          transition: "transform 200ms ease-out",
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 260 54"
          className="w-[180px] sm:w-[260px] h-auto"
        >
          <defs>
            <filter id="blur1">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
            </filter>
            <mask id="badgeMask">
              <rect width="260" height="54" fill="white" rx="10" />
            </mask>
          </defs>
          <rect
            width="260"
            height="54"
            rx="10"
            fill={backgroundColor[(place || 2) - 1] || backgroundColor[1]}
          />
          <rect
            x="4"
            y="4"
            width="252"
            height="46"
            rx="8"
            fill="transparent"
            stroke="#bbb"
            strokeWidth="1"
          />
          <text
            fontFamily="Helvetica-Bold, Helvetica"
            fontSize="9"
            fontWeight="bold"
            fill="#666"
            x="130"
            y="18"
            textAnchor="middle"
          >
            {displaySubtitle}
          </text>
          <text
            fontFamily="Helvetica-Bold, Helvetica"
            fontSize="18"
            fontWeight="bold"
            fill="#1D9E75"
            x="130"
            y="40"
            textAnchor="middle"
          >
            {displayTitle}
          </text>
          <g transform="translate(8, 9)">
            <circle cx="18" cy="18" r="14" fill="none" stroke="#1D9E75" strokeWidth="2" />
            <path
              fill="#1D9E75"
              d="M18 6a12 12 0 0 1 0 24 12 12 0 0 1 0-24m0 0v24M6 18h24"
            />
          </g>
          <g style={{ mixBlendMode: "overlay" }} mask="url(#badgeMask)">
            {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90].map((offset, i) => (
              <g
                key={offset}
                style={{
                  transform: `rotate(${firstOverlayPosition + offset}deg)`,
                  transformOrigin: "center center",
                  transition: !disableInOutOverlayAnimation
                    ? "transform 200ms ease-out"
                    : "none",
                  animation: disableOverlayAnimation
                    ? "none"
                    : `overlayAnimation${i + 1} 5s infinite`,
                  willChange: "transform",
                }}
              >
                <polygon
                  points="0,0 260,54 260,0 0,54"
                  fill={
                    [
                      "hsl(158, 70%, 45%)",
                      "hsl(30, 100%, 50%)",
                      "hsl(60, 100%, 50%)",
                      "hsl(96, 100%, 50%)",
                      "hsl(158, 85%, 40%)",
                      "hsl(200, 85%, 47%)",
                      "hsl(300, 20%, 35%)",
                      "transparent",
                      "transparent",
                      "white",
                    ][i]
                  }
                  filter="url(#blur1)"
                  opacity="0.5"
                />
              </g>
            ))}
          </g>
        </svg>
      </div>
    </a>
  );
};
