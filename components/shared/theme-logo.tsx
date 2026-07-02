"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import LogoIcon from "@/public/assets/images/logo-icon.png";

function ThemeLogo() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return (
    <Link href="/dashboard" className="flex items-center gap-2.5 group">
      <Image
        src={LogoIcon}
        alt="Enfycon Logo"
        width={44}
        height={44}
        style={{ objectFit: "contain" }}
        priority
      />
      <span
        style={{
          fontSize: 22,
          fontWeight: 700,
          letterSpacing: "-0.5px",
          color: "#2563EB",
        }}
      >
        TenderLinked
      </span>
    </Link>
  );
}

export default ThemeLogo;
