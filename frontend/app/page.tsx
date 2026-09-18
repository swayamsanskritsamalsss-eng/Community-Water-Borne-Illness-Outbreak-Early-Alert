"use client";

import {
  useEffect,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  getMe,
} from "../lib/api";

import {
  hasSession,
} from "../lib/auth";


export default function HomePage() {

  const router =
    useRouter();


  useEffect(() => {

    async function redirectUser() {

      if (!hasSession()) {
        router.replace("/login");
        return;
      }

      try {

        const user =
          await getMe();

        if (user.role === "chw") {
          router.replace("/chw");
        }

        else if (
          user.role === "authority"
        ) {
          router.replace(
            "/authority"
          );
        }

        else if (
          user.role === "admin"
        ) {
          router.replace("/admin");
        }

        else {
          router.replace("/login");
        }

      } catch {
        router.replace("/login");
      }
    }

    redirectUser();

  }, [router]);


  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">

      <div className="text-center">

        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-water-600 text-3xl">
          💧
        </div>

        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-water-600" />

        <p className="text-sm font-medium text-slate-500">
          Opening Aarogya...
        </p>

      </div>

    </div>
  );
}