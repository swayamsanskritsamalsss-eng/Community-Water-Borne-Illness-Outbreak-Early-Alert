"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import AuthGuard from "../../../components/AuthGuard";
import Shell from "../../../components/Shell";

import {
  getAdminSettings,
  SystemSettings,
  updateAdminSettings,
} from "../../../lib/api";


function SettingsContent() {

  const [
    clusterThreshold,
    setClusterThreshold,
  ] = useState("3");


  const [
    windowHours,
    setWindowHours,
  ] = useState("24");


  const [
    notificationsEnabled,
    setNotificationsEnabled,
  ] = useState(true);


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    saving,
    setSaving,
  ] = useState(false);


  const [
    success,
    setSuccess,
  ] = useState("");


  const [
    error,
    setError,
  ] = useState("");


  useEffect(() => {

    async function load() {

      try {

        const data =
          await getAdminSettings();

        setClusterThreshold(
          String(
            data.cluster_threshold
          )
        );

        setWindowHours(
          String(
            data.window_hours
          )
        );

        setNotificationsEnabled(
          data.notifications_enabled
        );

      } catch (err: any) {

        setError(
          err?.message ||
            "Unable to load settings."
        );

      } finally {

        setLoading(false);
      }
    }

    load();

  }, []);


  async function handleSave(
    event: FormEvent
  ) {

    event.preventDefault();

    setSuccess("");
    setError("");
    setSaving(true);


    try {

      const data: SystemSettings = {
        cluster_threshold:
          Number(
            clusterThreshold
          ),

        window_hours:
          Number(
            windowHours
          ),

        notifications_enabled:
          notificationsEnabled,
      };


      await updateAdminSettings(
        data
      );


      setSuccess(
        "Settings saved successfully."
      );

    } catch (err: any) {

      setError(
        err?.message ||
          "Unable to save settings."
      );

    } finally {

      setSaving(false);
    }
  }


  if (loading) {

    return (
      <div className="page-container">

        <div className="py-20 text-center">

          <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-water-600" />

          <p className="text-sm text-slate-500">
            Loading settings...
          </p>

        </div>

      </div>
    );
  }


  return (
    <div className="page-container">

      <div className="mb-6">

        <h2 className="text-2xl font-extrabold text-slate-900">
          System Settings
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Configure the possible-cluster
          detection logic.
        </p>

      </div>


      {success && (

        <div className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
          {success}
        </div>

      )}


      {error && (

        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>

      )}


      <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">

        <section className="card card-padding">

          <h3 className="section-title">
            Detection configuration
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            These values control the
            demo rule engine.
          </p>


          <form
            onSubmit={handleSave}
            className="mt-6 space-y-6"
          >

            <div>

              <label className="form-label">
                Cluster threshold
              </label>

              <input
                className="form-input"
                type="number"
                min={1}
                max={100}
                value={clusterThreshold}
                onChange={(event) =>
                  setClusterThreshold(
                    event.target.value
                  )
                }
                required
              />

              <p className="mt-2 text-xs leading-5 text-slate-500">
                Example: 3 means an alert
                can be created when more
                than 3 reports occur
                within the configured
                time window.
              </p>

            </div>


            <div>

              <label className="form-label">
                Detection window
              </label>

              <div className="flex gap-3">

                <input
                  className="form-input"
                  type="number"
                  min={1}
                  max={168}
                  value={windowHours}
                  onChange={(event) =>
                    setWindowHours(
                      event.target.value
                    )
                  }
                  required
                />

                <div className="flex items-center rounded-xl bg-slate-100 px-4 text-sm font-semibold text-slate-600">
                  hours
                </div>

              </div>

            </div>


            <div className="rounded-2xl border border-slate-200 p-4">

              <div className="flex items-center justify-between gap-4">

                <div>

                  <p className="font-bold text-slate-800">
                    Push notifications
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Allow Aarogya to
                    send possible-cluster
                    alerts to subscribed
                    authority devices.
                  </p>

                </div>


                <button
                  type="button"
                  onClick={() =>
                    setNotificationsEnabled(
                      !notificationsEnabled
                    )
                  }
                  className={`relative h-7 w-12 rounded-full transition ${
                    notificationsEnabled
                      ? "bg-water-600"
                      : "bg-slate-300"
                  }`}
                  aria-label="Toggle notifications"
                >

                  <span
                    className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${
                      notificationsEnabled
                        ? "left-6"
                        : "left-1"
                    }`}
                  />

                </button>

              </div>

            </div>


            <button
              type="submit"
              className="btn-primary w-full py-3"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : "Save settings"}
            </button>

          </form>

        </section>


        <section className="card card-padding">

          <div className="mb-5 text-4xl">
            🔎
          </div>

          <h3 className="text-lg font-extrabold text-slate-900">
            How the rule works
          </h3>

          <div className="mt-5 space-y-4">

            <div className="rounded-xl bg-slate-50 p-4">

              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Step 1
              </p>

              <p className="mt-1 font-bold text-slate-800">
                Reports arrive
              </p>

              <p className="mt-1 text-sm leading-5 text-slate-500">
                CHWs submit observed
                illness reports.
              </p>

            </div>


            <div className="rounded-xl bg-slate-50 p-4">

              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Step 2
              </p>

              <p className="mt-1 font-bold text-slate-800">
                Same village
              </p>

              <p className="mt-1 text-sm leading-5 text-slate-500">
                Aarogya counts reports
                from the same village.
              </p>

            </div>


            <div className="rounded-xl bg-slate-50 p-4">

              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Step 3
              </p>

              <p className="mt-1 font-bold text-slate-800">
                Threshold crossed
              </p>

              <p className="mt-1 text-sm leading-5 text-slate-500">
                A possible-cluster alert
                is created.
              </p>

            </div>

          </div>


          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">

            <p className="text-sm font-bold text-amber-900">
              Demo limitation
            </p>

            <p className="mt-1 text-sm leading-5 text-amber-800">
              The threshold is a prototype
              rule and is not a medically
              validated outbreak threshold.
            </p>

          </div>

        </section>

      </div>

    </div>
  );
}


export default function AdminSettingsPage() {

  return (
    <AuthGuard
      allowedRoles={[
        "admin",
      ]}
    >

      <Shell
        title="System Settings"
      >
        <SettingsContent />
      </Shell>

    </AuthGuard>
  );
}