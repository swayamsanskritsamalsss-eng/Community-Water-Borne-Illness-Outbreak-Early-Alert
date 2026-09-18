"use client";

import {
  useEffect,
  useState,
} from "react";

import AuthGuard from "../../../components/AuthGuard";
import PushSetup from "../../../components/PushSetup";
import Shell from "../../../components/Shell";

import {
  acknowledgeAlert,
  Alert,
  getAlerts,
  resolveAlert,
} from "../../../lib/api";


function AlertsContent() {

  const [
    alerts,
    setAlerts,
  ] = useState<Alert[]>([]);


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    error,
    setError,
  ] = useState("");


  const [
    actionId,
    setActionId,
  ] = useState<string | null>(
    null
  );


  async function loadAlerts() {

    try {

      setLoading(true);

      const data =
        await getAlerts();

      setAlerts(data);

    } catch (err: any) {

      setError(
        err?.message ||
          "Unable to load alerts."
      );

    } finally {

      setLoading(false);
    }
  }


  useEffect(() => {

    loadAlerts();

    const interval =
      window.setInterval(
        loadAlerts,
        30000
      );

    return () =>
      window.clearInterval(
        interval
      );

  }, []);


  async function handleAcknowledge(
    id: string
  ) {

    try {

      setActionId(id);

      await acknowledgeAlert(
        id
      );

      await loadAlerts();

    } catch (err: any) {

      setError(
        err?.message ||
          "Unable to acknowledge alert."
      );

    } finally {

      setActionId(null);
    }
  }


  async function handleResolve(
    id: string
  ) {

    try {

      setActionId(id);

      await resolveAlert(id);

      await loadAlerts();

    } catch (err: any) {

      setError(
        err?.message ||
          "Unable to resolve alert."
      );

    } finally {

      setActionId(null);
    }
  }


  return (
    <>

      <PushSetup />

      <div className="page-container">

        <div className="mb-6">

          <h2 className="text-2xl font-extrabold text-slate-900">
            Alert Center
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Review possible illness
            clusters and record the
            investigation status.
          </p>

        </div>


        {error && (

          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>

        )}


        {loading ? (

          <div className="py-20 text-center">

            <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-water-600" />

            <p className="text-sm text-slate-500">
              Loading alerts...
            </p>

          </div>

        ) : alerts.length === 0 ? (

          <div className="card p-12 text-center">

            <div className="text-5xl">
              ✓
            </div>

            <h3 className="mt-4 text-lg font-bold text-slate-900">
              No alerts
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Aarogya has not generated
              any possible-cluster alerts
              yet.
            </p>

          </div>

        ) : (

          <div className="space-y-4">

            {alerts.map(
              (alert) => (

                <div
                  key={alert.id}
                  className={`card overflow-hidden ${
                    alert.status ===
                    "active"
                      ? "border-red-200"
                      : ""
                  }`}
                >

                  <div className="p-5">

                    <div className="flex flex-col justify-between gap-4 md:flex-row">

                      <div className="flex gap-4">

                        <div
                          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl ${
                            alert.status ===
                            "active"
                              ? "bg-red-100"
                              : alert.status ===
                                  "acknowledged"
                                ? "bg-amber-100"
                                : "bg-green-100"
                          }`}
                        >
                          {alert.status ===
                          "resolved"
                            ? "✓"
                            : "🚨"}
                        </div>


                        <div>

                          <div className="flex flex-wrap items-center gap-2">

                            <h3 className="font-extrabold text-slate-900">
                              {alert.village_name}
                            </h3>

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


                          <p className="mt-1 text-sm text-slate-600">
                            {alert.report_count}{" "}
                            reports detected
                            within{" "}
                            {alert.window_hours}{" "}
                            hours.
                          </p>


                          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700">
                            {alert.message}
                          </p>


                          <p className="mt-2 text-xs text-slate-400">
                            Created{" "}
                            {new Date(
                              alert.created_at
                            ).toLocaleString()}
                          </p>

                        </div>

                      </div>


                      <div className="flex shrink-0 items-center gap-2">

                        {alert.status ===
                          "active" && (

                          <button
                            className="btn-secondary"
                            disabled={
                              actionId ===
                              alert.id
                            }
                            onClick={() =>
                              handleAcknowledge(
                                alert.id
                              )
                            }
                          >
                            Acknowledge
                          </button>

                        )}


                        {alert.status !==
                          "resolved" && (

                          <button
                            className="btn-primary"
                            disabled={
                              actionId ===
                              alert.id
                            }
                            onClick={() =>
                              handleResolve(
                                alert.id
                              )
                            }
                          >
                            Resolve
                          </button>

                        )}

                      </div>

                    </div>

                  </div>


                  <div className="border-t border-slate-100 bg-slate-50 px-5 py-3">

                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-500">

                      <span>
                        Threshold:{" "}
                        <strong className="text-slate-700">
                          {alert.threshold}
                        </strong>
                      </span>

                      <span>
                        Window:{" "}
                        <strong className="text-slate-700">
                          {alert.window_hours}h
                        </strong>
                      </span>

                      <span>
                        Reports:{" "}
                        <strong className="text-slate-700">
                          {alert.report_count}
                        </strong>
                      </span>

                    </div>

                  </div>

                </div>

              )
            )}

          </div>

        )}


        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">

          <p className="font-bold text-amber-900">
            Interpretation
          </p>

          <p className="mt-1 text-sm leading-6 text-amber-800">
            An alert indicates a
            <strong>
              {" "}
              possible cluster
            </strong>
            based on the configured
            reporting threshold. It does
            not confirm an outbreak,
            diagnosis, or contaminated
            water source.
          </p>

        </div>

      </div>
    </>
  );
}


export default function AuthorityAlertsPage() {

  return (
    <AuthGuard
      allowedRoles={[
        "authority",
        "admin",
      ]}
    >

      <Shell
        title="Alert Center"
      >
        <AlertsContent />
      </Shell>

    </AuthGuard>
  );
}