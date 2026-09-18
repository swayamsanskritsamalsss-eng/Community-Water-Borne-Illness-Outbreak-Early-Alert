"use client";

import {
  useEffect,
  useState,
} from "react";

import AuthGuard from "../../components/AuthGuard";
import PushSetup from "../../components/PushSetup";
import Shell from "../../components/Shell";

import {
  AuthorityDashboard,
  getAuthorityDashboard,
} from "../../lib/api";


function AuthorityDashboardContent() {

  const [
    dashboard,
    setDashboard,
  ] = useState<AuthorityDashboard | null>(
    null
  );


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    error,
    setError,
  ] = useState("");


  async function loadDashboard() {

    try {

      setLoading(true);

      const data =
        await getAuthorityDashboard();

      setDashboard(data);

    } catch (err: any) {

      setError(
        err?.message ||
          "Unable to load dashboard."
      );

    } finally {

      setLoading(false);
    }
  }


  useEffect(() => {

    loadDashboard();

    const interval =
      window.setInterval(
        loadDashboard,
        30000
      );

    return () =>
      window.clearInterval(
        interval
      );

  }, []);


  if (loading) {

    return (
      <div className="page-container">

        <div className="py-20 text-center">

          <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-water-600" />

          <p className="text-sm text-slate-500">
            Loading authority dashboard...
          </p>

        </div>

      </div>
    );
  }


  if (error) {

    return (
      <div className="page-container">

        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-medium text-red-700">
          {error}
        </div>

      </div>
    );
  }


  if (!dashboard) {
    return null;
  }


  const {
    stats,
    recent_reports,
    alerts,
  } = dashboard;


  return (
    <>

      <PushSetup />

      <div className="page-container">

        {/* =================================================
            HEADER
            ================================================= */}

        <div className="mb-6">

          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">

            <div>

              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">

                <span className="h-2 w-2 rounded-full bg-blue-500" />

                Monitoring

              </div>

              <h2 className="text-2xl font-extrabold text-slate-900">
                District Health Overview
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Monitor reports and possible
                illness clusters across the
                community.
              </p>

            </div>


            <a
              href="/authority/alerts"
              className="btn-primary"
            >
              🚨 View alerts
            </a>

          </div>

        </div>


        {/* =================================================
            STATS
            ================================================= */}

        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <div className="card card-padding">

            <p className="text-sm font-medium text-slate-500">
              Total reports
            </p>

            <div className="mt-3 flex items-end justify-between">

              <p className="text-3xl font-extrabold text-slate-900">
                {stats.total_reports}
              </p>

              <span className="text-2xl">
                📋
              </span>

            </div>

          </div>


          <div className="card card-padding">

            <p className="text-sm font-medium text-slate-500">
              Last 24 hours
            </p>

            <div className="mt-3 flex items-end justify-between">

              <p className="text-3xl font-extrabold text-slate-900">
                {stats.reports_last_24h}
              </p>

              <span className="text-2xl">
                🕐
              </span>

            </div>

          </div>


          <div className="card card-padding">

            <p className="text-sm font-medium text-slate-500">
              Active alerts
            </p>

            <div className="mt-3 flex items-end justify-between">

              <p className="text-3xl font-extrabold text-red-600">
                {stats.active_alerts}
              </p>

              <span className="text-2xl">
                🚨
              </span>

            </div>

          </div>


          <div className="card card-padding">

            <p className="text-sm font-medium text-slate-500">
              Affected villages
            </p>

            <div className="mt-3 flex items-end justify-between">

              <p className="text-3xl font-extrabold text-slate-900">
                {stats.affected_villages}
              </p>

              <span className="text-2xl">
                🏘️
              </span>

            </div>

          </div>

        </div>


        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">

          {/* =================================================
              RECENT REPORTS
              ================================================= */}

          <section className="card overflow-hidden">

            <div className="border-b border-slate-200 px-5 py-4">

              <h3 className="section-title">
                Recent community reports
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                Latest reports received by
                Aarogya.
              </p>

            </div>


            {recent_reports.length === 0 ? (

              <div className="px-5 py-12 text-center">

                <div className="text-4xl">
                  📋
                </div>

                <p className="mt-3 font-semibold text-slate-700">
                  No reports yet
                </p>

              </div>

            ) : (

              <div className="data-table-wrapper">

                <table className="data-table">

                  <thead>

                    <tr>

                      <th>
                        Village
                      </th>

                      <th>
                        Symptom
                      </th>

                      <th>
                        Water
                      </th>

                      <th>
                        Time
                      </th>

                    </tr>

                  </thead>


                  <tbody>

                    {recent_reports.map(
                      (report) => (

                        <tr
                          key={report.id}
                        >

                          <td className="font-semibold">
                            {report.village_name}
                          </td>

                          <td>
                            {report.symptom}
                          </td>

                          <td>
                            {report.water_source ||
                              "—"}
                          </td>

                          <td>
                            {new Date(
                              report.occurred_at
                            ).toLocaleString()}
                          </td>

                        </tr>

                      )
                    )}

                  </tbody>

                </table>

              </div>

            )}

          </section>


          {/* =================================================
              ALERTS
              ================================================= */}

          <section className="card overflow-hidden">

            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">

              <div>

                <h3 className="section-title">
                  Recent alerts
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  Possible clusters requiring
                  investigation.
                </p>

              </div>

              <a
                href="/authority/alerts"
                className="text-sm font-bold text-water-700 hover:text-water-800"
              >
                View all
              </a>

            </div>


            <div className="space-y-3 p-4">

              {alerts.length === 0 ? (

                <div className="rounded-xl bg-green-50 p-5 text-center">

                  <div className="text-3xl">
                    ✓
                  </div>

                  <p className="mt-2 font-bold text-green-800">
                    No active alerts
                  </p>

                  <p className="mt-1 text-xs text-green-700">
                    Continue monitoring
                    incoming reports.
                  </p>

                </div>

              ) : (

                alerts.slice(
                  0,
                  5
                ).map(
                  (alert) => (

                    <div
                      key={alert.id}
                      className={`rounded-xl border p-4 ${
                        alert.status ===
                        "resolved"
                          ? "border-slate-200 bg-slate-50"
                          : "border-red-200 bg-red-50"
                      }`}
                    >

                      <div className="flex items-start justify-between gap-3">

                        <div>

                          <p className="font-bold text-slate-900">
                            {alert.village_name}
                          </p>

                          <p className="mt-1 text-sm leading-5 text-slate-600">
                            {alert.report_count}{" "}
                            reports in{" "}
                            {alert.window_hours}h
                          </p>

                        </div>


                        <span
                          className={`badge ${
                            alert.status ===
                            "active"
                              ? "badge-red"
                              : alert.status ===
                                  "acknowledged"
                                ? "badge-yellow"
                                : "badge-green"
                          }`}
                        >
                          {alert.status}
                        </span>

                      </div>

                    </div>

                  )
                )

              )}

            </div>

          </section>

        </div>


        {/* =================================================
            SYSTEM EXPLANATION
            ================================================= */}

        <section className="mt-6 rounded-2xl bg-slate-900 p-6 text-white">

          <div className="grid gap-6 md:grid-cols-3">

            <div>

              <div className="mb-2 text-2xl">
                📥
              </div>

              <p className="font-bold">
                Collect
              </p>

              <p className="mt-1 text-sm leading-6 text-slate-300">
                Community Health Workers
                submit observed illness
                reports.
              </p>

            </div>


            <div>

              <div className="mb-2 text-2xl">
                🔎
              </div>

              <p className="font-bold">
                Detect
              </p>

              <p className="mt-1 text-sm leading-6 text-slate-300">
                Aarogya checks recent
                reports within the same
                village.
              </p>

            </div>


            <div>

              <div className="mb-2 text-2xl">
                🚨
              </div>

              <p className="font-bold">
                Investigate
              </p>

              <p className="mt-1 text-sm leading-6 text-slate-300">
                Authorities receive a
                possible-cluster alert
                requiring investigation.
              </p>

            </div>

          </div>

        </section>

      </div>
    </>
  );
}


export default function AuthorityPage() {

  return (
    <AuthGuard
      allowedRoles={[
        "authority",
        "admin",
      ]}
    >

      <Shell
        title="Authority Dashboard"
      >
        <AuthorityDashboardContent />
      </Shell>

    </AuthGuard>
  );
}