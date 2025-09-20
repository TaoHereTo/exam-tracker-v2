"use client";

import React from "react";
import { AuthWrapper } from "@/components/auth/AuthWrapper";
import { MainApp } from "@/components/MainApp";

export default function Home() {
  return (
    <AuthWrapper>
      <MainApp />
    </AuthWrapper>
  );
}
