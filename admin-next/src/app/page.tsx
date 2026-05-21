"use client";

import { SignInButton, SignOutButton, useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { ShieldCheck, ArrowRight, AlertCircle, LayoutDashboard } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { useEffect, useState } from "react";

function HomeContent() {
  const [isMounted, setIsMounted] = useState(false);
  const { userId, isLoaded } = useAuth();
  const searchParams = useSearchParams();
  const isUnauthorized = searchParams.get("error") === "unauthorized";

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isLoaded || !isMounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-6 h-14 flex items-center border-b bg-white">
        <div className="flex items-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-700 text-white shadow-lg shadow-blue-200">
            <LayoutDashboard className="h-6 w-6" />
          </div>
          <span className="ml-2 text-xl font-black text-slate-900">Admin portal test</span>
        </div>
        <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
          {!userId ? (
            <SignInButton mode="modal">
              <button className="text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors">
                Sign In
              </button>
            </SignInButton>
          ) : (
            <div className="flex items-center gap-4">
              <Link className="text-sm font-bold text-blue-600 hover:underline underline-offset-4" href="/dashboard">
                Go to Dashboard
              </Link>
              <SignOutButton signOutOptions={{ redirectUrl: "/" }}>
                <button className="text-sm font-bold text-red-500 hover:text-red-700 transition-colors">
                  Sign Out
                </button>
              </SignOutButton>
            </div>
          )}
        </nav>
      </header>
      <main className="flex-1">
        {isUnauthorized && (
          <div className="bg-red-50 p-4 border-b border-red-200">
            <div className="container mx-auto flex flex-col sm:flex-row items-center justify-center gap-4 text-red-700 font-bold">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Access Denied: Your account does not have Administrator permissions.
              </div>
              <SignOutButton signOutOptions={{ redirectUrl: "/" }}>
                <button className="bg-red-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-red-700 transition-all shadow-sm shadow-red-200">
                  Sign Out to Switch Account
                </button>
              </SignOutButton>
            </div>
          </div>
        )}
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-slate-50">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-4xl font-black tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl text-slate-900">
                  Centralized <span className="text-blue-700">Education</span> Management
                </h1>
                <p className="mx-auto max-w-[700px] text-slate-700 md:text-xl font-bold">
                  Empower your institution with a powerful admin panel. Manage users, courses, and system health with ease.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                {userId ? (
                  <Link
                    href="/dashboard"
                    className="inline-flex h-12 items-center justify-center rounded-lg bg-blue-600 px-8 text-sm font-bold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 hover:scale-105 active:scale-95"
                  >
                    Enter Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                ) : (
                  <>
                    <SignInButton mode="modal">
                      <button className="inline-flex h-12 items-center justify-center rounded-lg bg-blue-600 px-10 text-sm font-bold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 hover:scale-105 active:scale-95">
                        Admin Login
                      </button>
                    </SignInButton>
                    <button className="inline-flex h-12 items-center justify-center rounded-lg bg-white border border-slate-200 px-10 text-sm font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50">
                      Learn More
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t bg-white">
        <p className="text-xs font-medium text-slate-500">© 2024 EduPlatform Inc. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
