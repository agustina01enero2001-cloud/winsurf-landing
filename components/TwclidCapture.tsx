"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { TWCLID_PARAM, storeTwclid } from "@/lib/twclid";

export default function TwclidCapture() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const fromUrl = searchParams.get(TWCLID_PARAM);
    if (fromUrl) {
      storeTwclid(fromUrl);
      return;
    }

    const fromWindow = new URLSearchParams(window.location.search).get(
      TWCLID_PARAM,
    );
    if (fromWindow) {
      storeTwclid(fromWindow);
    }
  }, [searchParams]);

  return null;
}
