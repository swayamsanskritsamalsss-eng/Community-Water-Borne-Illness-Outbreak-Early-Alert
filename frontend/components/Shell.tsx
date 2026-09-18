"use client";

import {
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import {
  usePathname,
  useRouter,
} from "next/navigation";

import {
  getMe,
  logout,
  User,
} from "../lib/api";

import {
  clearSessionToken,
} from "../lib/auth";


interface ShellProps {
  children: React.ReactNode;
  title?: string;
}


export default function Shell({
  children,
  title = "Aarogya",
}: ShellProps) {

  const router =
    useRouter();

  const pathname =
    usePathname();


  const [
    user,
    setUser,
  ] = useState<User | null>(null);

  const [
    mobileMenu,
    setMobileMenu,
  ] = useState(false);


  useEffect(() => {

    async function loadUser() {

      try {

        const currentUser =
          await getMe();

        setUser(currentUser);

      } catch {
        clearSessionToken();
        router.replace("/login");
      }
    }

    loadUser();

  }, [router]);


  async function handleLogout() {

    try {
      await logout();
    } finally {
      clearSessionToken();
      router.replace("/login");
    }
  }


  const links = [];

  if (user?.role === "chw") {

    links.push({
      href: "/chw",
      label: "CHW Dashboard",
      icon: "🩺",
    });
  }


  if (
    user?.role === "authority"
  ) {

    links.push(
      {
        href: "/authority",
        label: "Dashboard",
        icon: "📊",
      },
      {
        href: "/authority/alerts",
        label: "Alerts",
        icon: "🚨",
      }
    );
  }


  if (user?.role === "admin") {

    links.push(
      {
        href: "/admin",
        label: "Dashboard",
        icon: "📊",
      },
      {
        href: "/admin/users",
        label: "Users",
        icon: "👥",
      },
      {
        href: "/admin/settings",
        label: "Settings",
        icon: "⚙️",
      }
    );
  }


  return (
    <div className="min-h-screen bg-slate-50">

      {/* =====================================================
          HEADER
          ===================================================== */}

      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">

        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-4 sm:px-6">

          <div className="flex items-center gap-3">

            <button
              onClick={() =>
                setMobileMenu(
                  !mobileMenu
                )
              }
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
              aria-label="Open menu"
            >
              ☰
            </button>


            <Link
              href={
                user?.role === "chw"
                  ? "/chw"
                  : user?.role ===
                      "authority"
                    ? "/authority"
                    : "/admin"
              }
              className="flex items-center gap-2"
            >

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-water-600 text-xl shadow-sm">
                💧
              </div>

              <div>
                <div className="text-lg font-extrabold tracking-tight text-slate-900">
                  Aarogya
                </div>

                <div className="hidden text-[10px] font-semibold uppercase tracking-widest text-slate-400 sm:block">
                  Community Early Warning
                </div>
              </div>

            </Link>

          </div>


          <div className="flex items-center gap-3">

            <div className="hidden text-right sm:block">

              <div className="text-sm font-bold text-slate-800">
                {user?.full_name}
              </div>

              <div className="text-xs capitalize text-slate-500">
                {user?.role}
              </div>

            </div>


            <button
              onClick={handleLogout}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Logout
            </button>

          </div>

        </div>

      </header>


      <div className="mx-auto flex max-w-[1400px]">

        {/* =================================================
            DESKTOP SIDEBAR
            ================================================= */}

        <aside className="hidden min-h-[calc(100vh-64px)] w-64 border-r border-slate-200 bg-white p-4 lg:block">

          <div className="mb-5 px-3 pt-2">

            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Navigation
            </p>

          </div>


          <nav className="space-y-1">

            {links.map((link) => {

              const active =
                pathname === link.href ||
                pathname.startsWith(
                  `${link.href}/`
                );

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${
                    active
                      ? "bg-water-50 text-water-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >

                  <span className="text-lg">
                    {link.icon}
                  </span>

                  {link.label}

                </Link>
              );

            })}

          </nav>


          <div className="mt-8 rounded-2xl bg-slate-900 p-4 text-white">

            <div className="mb-2 text-lg">
              💧
            </div>

            <p className="text-sm font-bold">
              Early visibility saves time.
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-300">
              Aarogya detects possible
              clusters for investigation.
            </p>

          </div>

        </aside>


        {/* =================================================
            MOBILE MENU
            ================================================= */}

        {mobileMenu && (

          <div
            className="fixed inset-0 z-50 lg:hidden"
            onClick={() =>
              setMobileMenu(false)
            }
          >

            <div className="absolute inset-0 bg-black/30" />

            <aside
              className="relative h-full w-72 bg-white p-5 shadow-xl"
              onClick={(event) =>
                event.stopPropagation()
              }
            >

              <div className="mb-6 flex items-center justify-between">

                <div className="font-bold text-slate-900">
                  Menu
                </div>

                <button
                  onClick={() =>
                    setMobileMenu(false)
                  }
                  className="rounded-lg p-2 hover:bg-slate-100"
                >
                  ✕
                </button>

              </div>


              <nav className="space-y-1">

                {links.map((link) => (

                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() =>
                      setMobileMenu(false)
                    }
                    className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <span>
                      {link.icon}
                    </span>

                    {link.label}
                  </Link>

                ))}

              </nav>

            </aside>

          </div>

        )}


        {/* =================================================
            CONTENT
            ================================================= */}

        <main className="min-w-0 flex-1">

          <div className="border-b border-slate-200 bg-white">

            <div className="mx-auto max-w-[1400px] px-4 py-4 sm:px-6">

              <h1 className="text-xl font-extrabold text-slate-900">
                {title}
              </h1>

            </div>

          </div>


          {children}

        </main>

      </div>

    </div>
  );
}