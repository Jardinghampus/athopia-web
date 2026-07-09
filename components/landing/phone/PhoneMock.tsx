"use client";

import { PhoneFrame } from "./PhoneFrame";
import { ScreenFeed } from "./screens";

/* Egen entry-punkt så Hero.tsx kan next/dynamic(ssr:false) hela
   telefon-mockupen (dekorativ, aria-hidden) i en separat chunk. */
export default function PhoneMock() {
  return (
    <PhoneFrame className="relative">
      <ScreenFeed />
    </PhoneFrame>
  );
}
