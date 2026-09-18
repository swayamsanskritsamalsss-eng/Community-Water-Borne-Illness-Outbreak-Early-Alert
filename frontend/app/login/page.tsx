"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  getMe,
  login,
} from "../../lib/api";

import {
  hasSession,
  setSessionToken,
} from "../../lib/auth";


export default function LoginPage() {

  const router =
    useRouter();


  const [
    email,
    setEmail,
  ] = useState("");


  const [
    password,
    setPassword,
  ] = useState("");


  const [
    loading,
    setLoading,
  ] = useState(false);


  const [
    error,
    setError,
  ] = useState("");


  useEffect(() => {

    async function checkExistingSession() {

      if (!hasSession()) {
        return;
      }

      try {

        const user =
          await getMe();

        if (
          user.role === "chw"
        ) {
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

      } catch {
        // Invalid/expired session.
      }
    }

    checkExistingSession();

  }, [router]);


  async function handleSubmit(
    event: FormEvent
  ) {

    event.preventDefault();

    setError("");
    setLoading(true);

    try {

      const response =
        await login(
          email.trim(),
          password
        );

      setSessionToken(
        response.access_token
      );


      if (
        response.user.role ===
        "chw"
      ) {
        router.replace("/chw");
      }

      else if (
        response.user.role ===
        "authority"
      ) {
        router.replace(
          "/authority"
        );
      }

      else {
        router.replace("/admin");
      }

    } catch (err: any) {

      setError(
        err?.message ||
          "Unable to login."
      );

    } finally {
      setLoading(false);
    }
  }


  function fillDemo(
    role:
      | "chw"
      | "authority"
      | "admin"
  ) {

    if (role === "chw") {

      setEmail(
        "chw@aarogya.app"
      );

      setPassword(
        "Chw@123"
      );

    }

    else if (
      role === "authority"
    ) {

      setEmail(
        "authority@aarogya.app"
      );

      setPassword(
        "Authority@123"
      );

    }

    else {

      setEmail(
        "admin@aarogya.app"
      );

      setPassword(
        "Admin@123"
      );
    }

    setError("");
  }


  return (
    <main className="min-h-screen bg-gradient-to-br from-water-50 via-white to-slate-100">

      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-10">

        <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl lg:grid-cols-2">

          {/* =================================================
              LEFT SIDE
              ================================================= */}

          <section className="hidden bg-slate-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">

            <div>

              <div className="mb-8 flex items-center gap-3">

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-water-600 text-2xl">
                  💧
                </div>

                <div>

                  <div className="text-xl font-extrabold">
                    Aarogya
                  </div>

                  <div className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                    Early Warning System
                  </div>

                </div>

              </div>


              <h1 className="max-w-md text-4xl font-extrabold leading-tight">
                Detect possible
                illness clusters
                before they become
                harder to see.
              </h1>


              <p className="mt-5 max-w-md leading-7 text-slate-300">
                A community-focused
                system for collecting
                health reports and
                notifying authorities
                when a possible cluster
                appears.
              </p>

            </div>


            <div className="grid grid-cols-3 gap-3">

              <div className="rounded-2xl bg-white/5 p-4">

                <div className="text-2xl">
                  🩺
                </div>

                <div className="mt-2 text-xs font-semibold text-slate-300">
                  CHW Reports
                </div>

              </div>


              <div className="rounded-2xl bg-white/5 p-4">

                <div className="text-2xl">
                  🚨
                </div>

                <div className="mt-2 text-xs font-semibold text-slate-300">
                  Alerts
                </div>

              </div>


              <div className="rounded-2xl bg-white/5 p-4">

                <div className="text-2xl">
                  📱
                </div>

                <div className="mt-2 text-xs font-semibold text-slate-300">
                  Notifications
                </div>

              </div>

            </div>

          </section>


          {/* =================================================
              LOGIN
              ================================================= */}

          <section className="p-6 sm:p-10">

            <div className="mx-auto max-w-md">

              <div className="mb-8 lg:hidden">

                <div className="mb-3 flex items-center gap-3">

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-water-600 text-xl">
                    💧
                  </div>

                  <div className="text-xl font-extrabold text-slate-900">
                    Aarogya
                  </div>

                </div>

              </div>


              <div className="mb-8">

                <p className="mb-2 text-sm font-bold uppercase tracking-widest text-water-600">
                  Secure Access
                </p>

                <h2 className="text-3xl font-extrabold text-slate-900">
                  Welcome back
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Sign in to access your
                  Aarogya dashboard.
                </p>

              </div>


              {error && (

                <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {error}
                </div>

              )}


              <form
                onSubmit={handleSubmit}
                className="space-y-5"
              >

                <div>

                  <label className="form-label">
                    Email
                  </label>

                  <input
                    className="form-input"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(event) =>
                      setEmail(
                        event.target.value
                      )
                    }
                    required
                  />

                </div>


                <div>

                  <label className="form-label">
                    Password
                  </label>

                  <input
                    className="form-input"
                    type="password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(event) =>
                      setPassword(
                        event.target.value
                      )
                    }
                    required
                  />

                </div>


                <button
                  className="btn-primary w-full py-3"
                  disabled={loading}
                  type="submit"
                >

                  {loading
                    ? "Signing in..."
                    : "Sign in"}

                </button>

              </form>


              {/* =================================================
                  DEMO LOGIN
                  ================================================= */}

              <div className="mt-8">

                <div className="mb-3 flex items-center gap-3">

                  <div className="h-px flex-1 bg-slate-200" />

                  <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                    Demo accounts
                  </span>

                  <div className="h-px flex-1 bg-slate-200" />

                </div>


                <div className="grid gap-2 sm:grid-cols-3">

                  <button
                    type="button"
                    onClick={() =>
                      fillDemo("chw")
                    }
                    className="rounded-xl border border-slate-200 p-3 text-left hover:bg-slate-50"
                  >

                    <div className="text-lg">
                      🩺
                    </div>

                    <div className="mt-1 text-xs font-bold text-slate-800">
                      CHW
                    </div>

                  </button>


                  <button
                    type="button"
                    onClick={() =>
                      fillDemo(
                        "authority"
                      )
                    }
                    className="rounded-xl border border-slate-200 p-3 text-left hover:bg-slate-50"
                  >

                    <div className="text-lg">
                      🏥
                    </div>

                    <div className="mt-1 text-xs font-bold text-slate-800">
                      Authority
                    </div>

                  </button>


                  <button
                    type="button"
                    onClick={() =>
                      fillDemo("admin")
                    }
                    className="rounded-xl border border-slate-200 p-3 text-left hover:bg-slate-50"
                  >

                    <div className="text-lg">
                      🛠️
                    </div>

                    <div className="mt-1 text-xs font-bold text-slate-800">
                      Admin
                    </div>

                  </button>

                </div>

              </div>


              <div className="mt-8 rounded-xl bg-slate-50 p-4 text-xs leading-5 text-slate-500">

                <strong className="text-slate-700">
                  Demo only:
                </strong>{" "}
                The credentials shown
                above are for the
                hackathon demonstration.
                They should not be used
                in a production deployment.

              </div>

            </div>

          </section>

        </div>

      </div>

    </main>
  );
}