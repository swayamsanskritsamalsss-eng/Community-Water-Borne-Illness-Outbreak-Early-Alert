"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import AuthGuard from "../../components/AuthGuard";
import Shell from "../../components/Shell";

import {
  ChwDashboard,
  getChwDashboard,
  getMyReports,
  getVillages,
  Report,
  submitReport,
  Village,
} from "../../lib/api";

const SYMPTOMS = [
  "Diarrhoea",
  "Vomiting",
  "Fever",
  "Stomach pain",
  "Jaundice",
  "Dehydration",
  "Skin rash",
  "Other",
];

function ChwDashboardContent() {

  const [dashboard, setDashboard] =
    useState<ChwDashboard | null>(null);
  const [myReports, setMyReports] =
    useState<Report[]>([]);
  const [villages, setVillages] =
    useState<Village[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");

  const [villageId, setVillageId] = useState("");
  const [symptom, setSymptom] = useState(SYMPTOMS[0]);
  const [symptomOther, setSymptomOther] = useState("");
  const [waterSource, setWaterSource] = useState("");
  const [notes, setNotes] = useState("");

  const [occurredAt, setOccurredAt] = useState(() => {
    const now = new Date();
    now.setMinutes(
      now.getMinutes() - now.getTimezoneOffset(),
      0,
      0
    );
    return now.toISOString().slice(0, 16);
  });

  async function loadData() {
    try {
      setError("");
      const [dash, reports, villageData] =
        await Promise.all([
          getChwDashboard(),
          getMyReports(),
          getVillages(),
        ]);
      setDashboard(dash);
      setMyReports(reports);
      setVillages(villageData);
      setVillageId((current) => {
        if (current) return current;
        return villageData[0]?.id || "";
      });
    } catch (err: any) {
      setError(
        err?.message ||
          "Unable to load dashboard. Is the backend running?"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitError("");
    setSubmitSuccess("");
    setSubmitting(true);

    const finalSymptom =
      symptom === "Other"
        ? symptomOther.trim() || "Other"
        : symptom;

    try {
      if (!villageId) {
        throw new Error("Please select a village.");
      }
      if (!occurredAt) {
        throw new Error(
          "Please choose when the case was observed."
        );
      }

      await submitReport({
        village_id: villageId,
        symptom: finalSymptom,
        water_source: waterSource.trim() || undefined,
        notes: notes.trim() || undefined,
        occurred_at: new Date(occurredAt).toISOString(),
      });

      setSubmitSuccess("Report submitted successfully.");
      setWaterSource("");
      setNotes("");
      setSymptomOther("");
      await loadData();
    } catch (err: any) {
      setSubmitError(
        err?.message || "Unable to submit report."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="page-container">
        <div className="py-20 text-center">
          <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-water-600" />
          <p className="text-sm text-slate-500">
            Loading CHW dashboard...
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
        <button
          className="btn-secondary mt-4"
          onClick={() => {
            setLoading(true);
            loadData();
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="page-container">

      <div className="mb-6">
        <h2 className="text-2xl font-extrabold text-slate-900">
          Report an illness case
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Submit observed illness cases. Reports
          require an internet connection; the
          system flags possible clusters for
          investigation.
        </p>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="card card-padding">
          <p className="text-sm font-medium text-slate-500">
            My total reports
          </p>
          <p className="mt-2 text-3xl font-extrabold text-slate-900">
            {dashboard?.total_reports ?? 0}
          </p>
        </div>

        <div className="card card-padding">
          <p className="text-sm font-medium text-slate-500">
            Submitted last 24h
          </p>
          <p className="mt-2 text-3xl font-extrabold text-slate-900">
            {dashboard?.reports_last_24h ?? 0}
          </p>
        </div>

        <div className="card card-padding">
          <p className="text-sm font-medium text-slate-500">
            Villages available
          </p>
          <p className="mt-2 text-3xl font-extrabold text-slate-900">
            {villages.length}
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">

        <section className="card card-padding">
          <h3 className="section-title">New report</h3>
          <p className="mt-1 text-sm text-slate-500">
            All fields marked required must be
            filled before submitting.
          </p>

          {submitSuccess && (
            <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
              {submitSuccess}
            </div>
          )}

          {submitError && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {submitError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-5 space-y-5">

            <div>
              <label className="form-label">Village</label>
              <select
                className="form-input"
                value={villageId}
                onChange={(event) => setVillageId(event.target.value)}
                required
              >
                <option value="" disabled>
                  Select a village
                </option>
                {villages.map((village) => (
                  <option key={village.id} value={village.id}>
                    {village.name}
                    {village.region ? ` (${village.region})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Symptom</label>
              <select
                className="form-input"
                value={symptom}
                onChange={(event) => setSymptom(event.target.value)}
              >
                {SYMPTOMS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              {symptom === "Other" && (
                <input
                  className="form-input mt-3"
                  type="text"
                  placeholder="Describe the symptom"
                  value={symptomOther}
                  maxLength={100}
                  onChange={(event) =>
                    setSymptomOther(event.target.value)
                  }
                />
              )}
            </div>

            <div>
              <label className="form-label">
                Water source (optional)
              </label>
              <input
                className="form-input"
                type="text"
                placeholder="e.g. community well, hand pump, river"
                value={waterSource}
                maxLength={150}
                onChange={(event) =>
                  setWaterSource(event.target.value)
                }
              />
            </div>

            <div>
              <label className="form-label">Observed at</label>
              <input
                className="form-input"
                type="datetime-local"
                value={occurredAt}
                max={new Date().toISOString().slice(0, 16)}
                onChange={(event) => setOccurredAt(event.target.value)}
                required
              />
            </div>

            <div>
              <label className="form-label">Notes (optional)</label>
              <textarea
                className="form-textarea"
                placeholder="Additional observations..."
                value={notes}
                maxLength={1000}
                onChange={(event) => setNotes(event.target.value)}
              />
            </div>

            <button
              type="submit"
              className="btn-primary w-full py-3"
              disabled={submitting}
            >
              {submitting ? "Submitting..." : "Submit report"}
            </button>

          </form>
        </section>

        <section className="card overflow-hidden">
          <div className="border-b border-slate-200 px-5 py-4">
            <h3 className="section-title">My recent reports</h3>
            <p className="mt-1 text-xs text-slate-500">
              Latest cases you have submitted.
            </p>
          </div>

          {myReports.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <div className="text-4xl">📋</div>
              <p className="mt-3 font-semibold text-slate-700">
                No reports yet
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Submit your first case with the form.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {myReports.slice(0, 15).map((report) => (
                <div key={report.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-slate-900">
                        {report.symptom}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {report.village_name}
                        {report.water_source
                          ? ` • ${report.water_source}`
                          : ""}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-slate-400">
                      {new Date(report.occurred_at).toLocaleString()}
                    </span>
                  </div>
                  {report.notes && (
                    <p className="mt-2 text-sm leading-5 text-slate-600">
                      {report.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}

export default function ChwPage() {
  return (
    <AuthGuard allowedRoles={["chw"]}>
      <Shell title="CHW Dashboard">
        <ChwDashboardContent />
      </Shell>
    </AuthGuard>
  );
}
