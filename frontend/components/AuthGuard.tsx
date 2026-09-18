"use client";

import {
  useEffect,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import {
  getMe,
  User,
} from "../lib/api";

import {
  hasSession,
} from "../lib/auth";


interface AuthGuardProps {
  children: React.ReactNode;

  allowedRoles?: (
    "chw" |
    "authority" |
    "admin"
  )[];
}


export default function AuthGuard({
  children,
  allowedRoles,
}: AuthGuardProps) {

  const router =
    useRouter();

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    user,
    setUser,
  ] = useState<User | null>(null);


  useEffect(() => {

    let mounted = true;

    async function checkAuth() {

      if (!hasSession()) {
        router.replace("/login");
        return;
      }

      try {

        const currentUser =
          await getMe();

        if (!mounted) {
          return;
        }

        if (
          allowedRoles &&
          !allowedRoles.includes(
            currentUser.role
          )
        ) {

          if (
            currentUser.role === "chw"
          ) {
            router.replace("/chw");
          }

          else if (
            currentUser.role === "authority"
          ) {
            router.replace("/authority");
          }

          else {
            router.replace("/admin");
          }

          return;
        }

        setUser(currentUser);
        setLoading(false);

      } catch {

        if (!mounted) {
          return;
        }

        router.replace("/login");
      }
    }

    checkAuth();

    return () => {
      mounted = false;
    };

  }, [
    router,
    allowedRoles,
  ]);


  if (loading) {

    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-water-600" />

          <p className="text-sm font-medium text-slate-500">
            Checking session...
          </p>
        </div>
      </div>
    );
  }


  if (!user) {
    return null;
  }


  return (
    <>
      {children}
    </>
  );
}