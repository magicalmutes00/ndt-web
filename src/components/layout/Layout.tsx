"use client";

import { Outlet } from "react-router-dom";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { ScrollProgress } from "../ui/ScrollProgress";
import { BackToTop } from "../ui/BackToTop";
import { CursorGlow } from "../ui/CursorGlow";

export function Layout() {
  return (
    <>
      <CursorGlow />
      <ScrollProgress />
      <Navbar />
      <main>
        <Outlet />
      </main>
      <Footer />
      <BackToTop />
    </>
  );
}
