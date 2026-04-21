"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Title,
  Text,
  Button,
  Icon,
  Skeleton,
  Badge,
  Spinner,
  Alert,
  AlertTitle,
  AlertDescription,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  type IconType,
} from "@kognitos/lattice";
import { getAutomationBySlug, type AutomationInput } from "@/lib/automations";
import { PageHeader } from "@/app/components/PageHeader";
import { RunStatusBadge } from "@/app/components/RunStatusBadge";
import type { RunState } from "@/lib/types";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

interface CandidateEntry {
  runId: string;
  runTime: string;
  name: string;
  score: string;
  status: string;
  applicantId?: string;
  email?: string;
  outputs: Record<string, unknown>;
}

function extractCandidateFromRun(run: HistoryRun): CandidateEntry | null {
  if (run.status !== "completed" || !run.outputs) return null;
  const o = run.outputs;
  const str = (key: string) => {
    const v = o[key];
    return typeof v === "string" ? v : v != null ? String(v) : "";
  };
  const name = str("candidate_name");
  const score = str("relevance_score");
  const status = str("candidate_status");
  if (!name && !score && !status) return null;
  return {
    runId: run.id,
    runTime: run.create_time,
    name: name || "Unknown",
    score: score || "—",
    status: status || "—",
    applicantId: str("applicant_id") || undefined,
    email: str("email") || str("candidate_email") || undefined,
    outputs: run.outputs,
  };
}

interface TestFile {
  name: string;
  sizeBytes: number;
  sizeLabel: string;
}

function TestFilePicker({
  inputKey,
  accept,
  disabled,
  selectedFile,
  onSelect,
}: {
  inputKey: string;
  accept?: string;
  disabled: boolean;
  selectedFile: File | null;
  onSelect: (key: string, file: File | null) => void;
}) {
  const [files, setFiles] = useState<TestFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [fetching, setFetching] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/test-files")
      .then((r) => r.json())
      .then((data) => {
        let list: TestFile[] = data.files ?? [];
        if (accept) {
          const exts = accept.split(",").map((e) => e.trim().toLowerCase());
          list = list.filter((f) =>
            exts.some((ext) => f.name.toLowerCase().endsWith(ext))
          );
        }
        setFiles(list);
      })
      .catch(() => setFiles([]))
      .finally(() => setLoading(false));
  }, [accept]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function selectFile(tf: TestFile) {
    setFetching(tf.name);
    setOpen(false);
    try {
      const res = await fetch(`/api/test-files/${encodeURIComponent(tf.name)}`);
      if (!res.ok) throw new Error("Failed to fetch file");
      const blob = await res.blob();
      const file = new File([blob], tf.name, { type: blob.type });
      onSelect(inputKey, file);
    } catch {
      onSelect(inputKey, null);
    } finally {
      setFetching(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-input bg-muted/20 px-4 py-2.5">
        <Spinner className="h-4 w-4" />
        <Text level="small" color="muted">Loading available files…</Text>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        disabled={disabled || !!fetching}
        onClick={() => setOpen(!open)}
        className={`flex w-full items-center justify-between rounded-lg border-2 border-dashed p-4 text-sm transition-all ${
          selectedFile
            ? "border-primary/40 bg-primary/5"
            : "border-input bg-muted/20 hover:border-primary/40 hover:bg-muted/30"
        } disabled:opacity-50`}
      >
        <div className="flex items-center gap-3">
          {fetching ? (
            <Spinner className="h-5 w-5" />
          ) : (
            <Icon
              type={selectedFile ? "FileCheck" : "Upload"}
              size="lg"
              className={selectedFile ? "text-primary" : "text-muted-foreground"}
            />
          )}
          <div className="text-left">
            <Text level="small" className="font-medium">
              {fetching
                ? `Loading ${fetching}…`
                : selectedFile
                  ? selectedFile.name
                  : "Pick a Resume"}
            </Text>
            <Text level="xSmall" color="muted">
              {selectedFile
                ? `${(selectedFile.size / 1024).toFixed(0)} KB`
                : `${files.length} file${files.length !== 1 ? "s" : ""} available`}
            </Text>
          </div>
        </div>
        <Icon
          type="ChevronDown"
          size="sm"
          className={`text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-background shadow-lg">
          <div className="max-h-64 overflow-y-auto p-1">
            {files.length === 0 ? (
              <div className="px-3 py-4 text-center">
                <Text level="small" color="muted">No test files found</Text>
              </div>
            ) : (
              files.map((f) => (
                <button
                  key={f.name}
                  type="button"
                  onClick={() => selectFile(f)}
                  className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors ${
                    selectedFile?.name === f.name
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-muted/50"
                  }`}
                >
                  <Icon type="FileText" size="sm" className="text-muted-foreground shrink-0" />
                  <div className="min-w-0 flex-1">
                    <span className="font-medium truncate block">{f.name}</span>
                    <span className="text-xs text-muted-foreground">{f.sizeLabel}</span>
                  </div>
                  {selectedFile?.name === f.name && (
                    <Icon type="CircleCheck" size="sm" className="text-primary shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface SelectOption {
  id: string;
  description: string;
}

function SelectInput({
  input,
  value,
  disabled,
  formValues,
  onChange,
}: {
  input: AutomationInput;
  value: string;
  disabled: boolean;
  formValues: Record<string, string>;
  onChange: (value: string) => void;
}) {
  const [options, setOptions] = useState<SelectOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!input.optionsEndpoint) return;
    setLoading(true);
    setError(null);

    const url = new URL(input.optionsEndpoint, window.location.origin);
    if (input.optionsDependsOn && formValues[input.optionsDependsOn]) {
      url.searchParams.set("baseUrl", formValues[input.optionsDependsOn]);
    }

    fetch(url.toString())
      .then(async (res) => {
        if (!res.ok) throw new Error(`Failed to load options (${res.status})`);
        const data = await res.json();
        setOptions(data.openings ?? []);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load options")
      )
      .finally(() => setLoading(false));
  }, [input.optionsEndpoint, input.optionsDependsOn, formValues]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selected = options.find((o) => o.id === value);
  const filtered = options.filter(
    (o) =>
      o.description.toLowerCase().includes(search.toLowerCase()) ||
      o.id.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-input bg-muted/20 px-4 py-2.5">
        <Spinner className="h-4 w-4" />
        <Text level="small" color="muted">
          Loading job openings…
        </Text>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2.5">
        <Text level="small" color="muted">
          {error}
        </Text>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between rounded-lg border border-input bg-background px-4 py-2.5 text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 hover:bg-muted/30"
      >
        {selected ? (
          <span className="flex items-center gap-2 text-left truncate">
            <span className="font-medium">{selected.id}</span>
            <span className="text-muted-foreground truncate">{selected.description}</span>
          </span>
        ) : (
          <span className="text-muted-foreground">
            {input.placeholder ?? "Select an option"}
          </span>
        )}
        <Icon
          type="ChevronDown"
          size="sm"
          className={`text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-background shadow-lg">
          {options.length > 5 && (
            <div className="border-b border-border p-2">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search openings…"
                className="w-full rounded-md border border-input bg-muted/20 px-3 py-1.5 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                autoFocus
              />
            </div>
          )}
          <div className="max-h-64 overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-center">
                <Text level="small" color="muted">
                  No job openings found
                </Text>
              </div>
            ) : (
              filtered.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    onChange(option.id);
                    setOpen(false);
                    setSearch("");
                  }}
                  className={`flex w-full flex-col gap-0.5 rounded-md px-3 py-2.5 text-left text-sm transition-colors ${
                    option.id === value
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-muted/50"
                  }`}
                >
                  <span className="font-medium">{option.id}</span>
                  <span className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                    {option.description}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface RunResult {
  runId: string;
  status: RunState;
  outputs: Record<string, unknown>;
  error?: string;
}

interface HistoryRun {
  id: string;
  status: RunState;
  create_time: string;
  outputs: Record<string, unknown>;
}

export default function AppPage() {
  const { slug } = useParams<{ slug: string }>();
  const config = getAutomationBySlug(slug);

  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [fileValues, setFileValues] = useState<Record<string, File | null>>({});
  const [running, setRunning] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [history, setHistory] = useState<HistoryRun[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [selectedHistory, setSelectedHistory] = useState<HistoryRun | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateEntry | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!config) return;
    const defaults: Record<string, string> = {};
    for (const input of config.inputs ?? []) {
      if (input.defaultValue) defaults[input.key] = input.defaultValue;
    }
    setFormValues(defaults);
  }, [config]);

  const fetchHistory = useCallback(async () => {
    if (!config) return;
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/automations/${config.id}/runs`);
      if (res.ok) {
        const data = await res.json();
        setHistory((data.runs ?? []).slice(0, 10));
      }
    } catch {
      /* ignore */
    } finally {
      setHistoryLoading(false);
    }
  }, [config]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  if (!config || !config.isApp) {
    return (
      <div className="flex-1 overflow-auto">
        <PageHeader
          title="App not found"
          breadcrumbs={[{ label: "Home", href: "/" }, { label: "Not Found" }]}
        />
        <div className="p-6 flex flex-col items-center justify-center h-[50vh] gap-4">
          <Icon type="CircleAlert" size="xl" className="text-destructive" />
          <Text color="muted">No app matches &ldquo;{slug}&rdquo;.</Text>
          <Button variant="outline" asChild>
            <Link href="/">
              <Icon type="ArrowLeft" size="sm" />
              Back to Home
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const inputs = config.inputs ?? [];
  const hasInputs = inputs.length > 0;
  const isRunning = running || polling;

  function setField(key: string, value: string) {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  }

  function setFile(key: string, file: File | null) {
    setFileValues((prev) => ({ ...prev, [key]: file }));
  }

  function isFormValid(): boolean {
    for (const input of inputs) {
      if (input.hidden) continue;
      if ((input.type === "text" || input.type === "select") && !formValues[input.key]?.trim()) return false;
      if (input.type === "file" && !fileValues[input.key]) return false;
    }
    return true;
  }

  async function pollRunStatus(automationId: string, runId: string) {
    setPolling(true);
    const deadline = Date.now() + 90_000;
    pollingRef.current = setInterval(async () => {
      if (Date.now() > deadline) {
        if (pollingRef.current) clearInterval(pollingRef.current);
        setPolling(false);
        setRunResult((prev) =>
          prev
            ? { ...prev, status: "failed" as RunState, error: "Polling timed out" }
            : null
        );
        return;
      }
      try {
        const res = await fetch(`/api/automations/${automationId}/runs`);
        if (!res.ok) return;
        const data = await res.json();
        const run = (data.runs ?? []).find((r: { id: string }) => r.id === runId);
        if (!run) return;
        if (
          run.status === "completed" ||
          run.status === "failed" ||
          run.status === "awaiting_guidance"
        ) {
          if (pollingRef.current) clearInterval(pollingRef.current);
          setPolling(false);
          setRunResult({ runId, status: run.status, outputs: run.outputs ?? {}, error: run.error });
          fetchHistory();
        } else {
          setRunResult((prev) => (prev ? { ...prev, status: run.status } : null));
        }
      } catch {
        /* ignore */
      }
    }, 2000);
  }

  async function handleProcess() {
    if (isRunning || !config) return;
    setRunning(true);
    setRunResult(null);
    setSelectedHistory(null);
    const automationId = config.id;

    try {
      const apiInputs: Record<string, unknown> = {};

      for (const input of inputs) {
        if (input.type === "text" || input.type === "select") {
          apiInputs[input.key] = { text: formValues[input.key] };
        } else if (input.type === "file" && fileValues[input.key]) {
          setUploadProgress(`Uploading ${fileValues[input.key]!.name}...`);
          const uploadForm = new FormData();
          uploadForm.append("file", fileValues[input.key]!);
          const uploadRes = await fetch("/api/files", { method: "POST", body: uploadForm });
          if (!uploadRes.ok) {
            const err = await uploadRes.json();
            setRunResult({ runId: "", status: "failed", outputs: {}, error: err.error ?? "File upload failed" });
            setUploadProgress(null);
            return;
          }
          const uploadData = await uploadRes.json();
          apiInputs[input.key] = { file: { remote: uploadData.remotePath } };
          setUploadProgress(null);
        }
      }

      const res = await fetch(`/api/automations/${automationId}/invoke`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputs: apiInputs }),
      });

      if (!res.ok) {
        const data = await res.json();
        setRunResult({ runId: "", status: "failed", outputs: {}, error: data.error ?? `Failed (${res.status})` });
        return;
      }

      const data = await res.json();
      setRunResult({ runId: data.runId, status: "pending", outputs: {} });
      pollRunStatus(automationId, data.runId);
    } catch (err) {
      setRunResult({ runId: "", status: "failed", outputs: {}, error: err instanceof Error ? err.message : "Network error" });
    } finally {
      setRunning(false);
    }
  }

  const statusLabel = uploadProgress
    ? uploadProgress
    : runResult?.status === "pending"
      ? "Starting..."
      : runResult?.status === "executing"
        ? "Analyzing..."
        : null;

  const displayOutputs = selectedHistory?.outputs ?? (runResult?.status === "completed" ? runResult.outputs : null);
  const displayStatus = selectedHistory?.status ?? runResult?.status;

  const APP_CONFIG: Record<string, { icon: string; action: string; resultTitle: string }> = {
    "resume-screener": { icon: "FileScan", action: "Screen Resume", resultTitle: "Candidate Analysis by Kognitos" },
    "servicenow-jira": { icon: "ChevronsRight", action: "Sync Now", resultTitle: "Sync Results" },
    "ticket-triage": { icon: "AlertTriangle", action: "Triage Now", resultTitle: "Triage Results" },
  };

  const appUi = APP_CONFIG[slug] ?? { icon: "Play", action: "Process", resultTitle: "Results" };

  /* ---- Resume Screener: redesigned layout ---- */
  if (slug === "resume-screener") {
    const visibleInputs = inputs.filter((i) => !i.hidden);
    return (
      <div className="flex-1 overflow-auto">
        <PageHeader
          title={config.name}
          subtitle={config.description}
          breadcrumbs={[
            { label: "Home", href: "/" },
            { label: "Apps" },
            { label: config.name },
          ]}
        />

        <div className="p-6 space-y-4">
          {/* Horizontal input bar */}
          <div className="rounded-lg border border-border bg-background p-4">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-end gap-4">
              {visibleInputs.map((input) =>
                input.type === "select" ? (
                  <div key={input.key} className="flex-1 min-w-0 space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block">{input.key}</label>
                    <SelectInput
                      input={input}
                      value={formValues[input.key] ?? ""}
                      disabled={isRunning}
                      formValues={formValues}
                      onChange={(val) => setField(input.key, val)}
                    />
                  </div>
                ) : input.type === "file" ? (
                  <div key={input.key} className="flex-1 min-w-0 space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block">{input.key}</label>
                    <TestFilePicker
                      inputKey={input.key}
                      accept={input.accept}
                      disabled={isRunning}
                      selectedFile={fileValues[input.key] ?? null}
                      onSelect={setFile}
                    />
                  </div>
                ) : (
                  <div key={input.key} className="flex-1 min-w-0 space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block">{input.key}</label>
                    <input
                      type="text"
                      value={formValues[input.key] ?? ""}
                      placeholder={input.placeholder}
                      disabled={isRunning}
                      onChange={(e) => setField(input.key, e.target.value)}
                      className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                    />
                  </div>
                )
              )}
              <Button
                size="lg"
                onClick={handleProcess}
                disabled={isRunning || (hasInputs && !isFormValid())}
                className="shrink-0 lg:w-auto w-full"
              >
                {isRunning ? (
                  <>
                    <Spinner className="h-4 w-4" />
                    {statusLabel ?? "Processing..."}
                  </>
                ) : (
                  <>
                    <Icon type="Play" size="sm" />
                    {appUi.action}
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Full-width progress indicator */}
          {isRunning && runResult && (() => {
            const steps = [
              { key: "pending", label: "Kognitos Invoking" },
              { key: "executing", label: "Kognitos Executing" },
              { key: "analyzing", label: "Kognitos Analyzing" },
            ];
            const activeIndex = runResult.status === "executing" ? 1
              : runResult.status === "pending" ? 0 : 0;
            const progressPct = uploadProgress ? 5
              : activeIndex === 0 ? 33 : activeIndex === 1 ? 66 : 100;

            return (
              <div className="rounded-lg border border-border bg-background px-6 py-4">
                <div className="flex items-center gap-6">
                  <Spinner className="h-5 w-5 text-primary shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Text level="small" className="font-medium">{statusLabel ?? "Processing..."}</Text>
                      <Text level="xSmall" color="muted">Run ID: {runResult.runId}</Text>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-700 ease-in-out"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                    <div className="flex justify-between">
                      {steps.map((step, i) => {
                        const isDone = i < activeIndex;
                        const isActive = i === activeIndex && !uploadProgress;
                        return (
                          <div key={step.key} className="flex items-center gap-1">
                            {isDone ? (
                              <Icon type="CircleCheck" size="xs" className="text-primary" />
                            ) : isActive ? (
                              <span className="block h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                            ) : (
                              <span className="block h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />
                            )}
                            <Text
                              level="xSmall"
                              color={isDone || isActive ? undefined : "muted"}
                              className={isDone || isActive ? "font-medium" : ""}
                            >
                              {step.label}
                            </Text>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Error / Awaiting alerts */}
          {runResult?.status === "failed" && !isRunning && (
            <Alert variant="destructive">
              <Icon type="CircleAlert" size="sm" />
              <AlertTitle>Processing Failed</AlertTitle>
              <AlertDescription>{runResult.error ?? "An unknown error occurred."}</AlertDescription>
            </Alert>
          )}
          {runResult?.status === "awaiting_guidance" && !isRunning && (
            <Alert>
              <Icon type="AlertTriangle" size="sm" />
              <AlertTitle>Needs Attention</AlertTitle>
              <AlertDescription>
                This run encountered an exception.{" "}
                <Link href="/exceptions" className="underline underline-offset-4 text-primary">
                  View in Awaiting Guidance
                </Link>
              </AlertDescription>
            </Alert>
          )}

          {/* Master/detail: candidate list + detail */}
          <ResumeScreenerPanel
            history={history}
            historyLoading={historyLoading}
            runResult={!isRunning ? runResult : null}
            selectedCandidate={selectedCandidate}
            onSelectCandidate={setSelectedCandidate}
          />
        </div>
      </div>
    );
  }

  /* ---- Default layout for other app slugs ---- */
  return (
    <div className="flex-1 overflow-auto">
      <PageHeader
        title={config.name}
        subtitle={config.description}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Apps" },
          { label: config.name },
        ]}
      />

      <div className="p-6">
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          {/* Left panel — Input + Action */}
          <div className="xl:col-span-2 space-y-6">
            <div className="rounded-lg border border-border bg-background p-6 space-y-5">
              {hasInputs ? (
                <>
                  {inputs.filter((i) => !i.hidden).map((input) =>
                    input.type === "file" ? (
                      <div key={input.key} className="space-y-2">
                        <label className="text-sm font-medium block">{input.key}</label>
                        <TestFilePicker
                          inputKey={input.key}
                          accept={input.accept}
                          disabled={isRunning}
                          selectedFile={fileValues[input.key] ?? null}
                          onSelect={setFile}
                        />
                      </div>
                    ) : input.type === "select" ? (
                      <div key={input.key} className="space-y-2">
                        <label className="text-sm font-medium block">{input.key}</label>
                        <SelectInput
                          input={input}
                          value={formValues[input.key] ?? ""}
                          disabled={isRunning}
                          formValues={formValues}
                          onChange={(val) => setField(input.key, val)}
                        />
                      </div>
                    ) : (
                      <div key={input.key} className="space-y-2">
                        <label className="text-sm font-medium block">{input.key}</label>
                        <input
                          type="text"
                          value={formValues[input.key] ?? ""}
                          placeholder={input.placeholder}
                          disabled={isRunning}
                          onChange={(e) => setField(input.key, e.target.value)}
                          className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                        />
                      </div>
                    )
                  )}
                </>
              ) : (
                <div className="text-center py-4">
                  <Icon type={appUi.icon as IconType} size="xl" className="text-primary mx-auto mb-3" />
                  <Text color="muted">
                    Ready to run. Click below to start processing.
                  </Text>
                </div>
              )}

              <Button
                className="w-full"
                size="lg"
                onClick={handleProcess}
                disabled={isRunning || (hasInputs && !isFormValid())}
              >
                {isRunning ? (
                  <>
                    <Spinner className="h-4 w-4" />
                    {statusLabel ?? "Processing..."}
                  </>
                ) : (
                  <>
                    <Icon type="Play" size="sm" />
                    {appUi.action}
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Right panel — Results */}
          <div className="xl:col-span-3 space-y-4">
            {displayOutputs && displayStatus === "completed" && (
              <div className="rounded-lg border border-border bg-background overflow-hidden">
                <div className="px-6 py-4 border-b border-border bg-muted/30 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon type="CircleCheck" size="sm" className="text-success" />
                    <Title level="h4">{appUi.resultTitle}</Title>
                  </div>
                  {selectedHistory && (
                    <Text level="xSmall" color="muted">
                      {dayjs(selectedHistory.create_time).format("MMM D, YYYY h:mm A")}
                    </Text>
                  )}
                </div>
                {slug === "servicenow-jira" ? (
                  <SyncResults outputs={displayOutputs} />
                ) : (
                  <GenericResults outputs={displayOutputs} />
                )}
              </div>
            )}

            <div className="rounded-lg border border-border bg-background p-4 space-y-3">
              <Text level="xSmall" color="muted" className="font-medium uppercase tracking-wider">
                Past Runs
              </Text>
              {historyLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-10 rounded" />
                  ))}
                </div>
              ) : history.length === 0 ? (
                <Text level="xSmall" color="muted">No runs yet.</Text>
              ) : (
                <div className="space-y-1">
                  {history.map((run) => (
                    <button
                      key={run.id}
                      onClick={() => {
                        setSelectedHistory(selectedHistory?.id === run.id ? null : run);
                        setRunResult(null);
                      }}
                      className={`w-full text-left rounded-md px-3 py-2 text-sm transition-colors ${
                        selectedHistory?.id === run.id
                          ? "bg-primary/10 border border-primary/30"
                          : "hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <Text level="xSmall">
                          {dayjs(run.create_time).format("MMM D, h:mm A")}
                        </Text>
                        <RunStatusBadge status={run.status} />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {!displayOutputs && !isRunning && !runResult && (
              <div className="rounded-lg border border-border bg-background p-8">
                <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                  <Icon type="BarChart3" size="xl" className="text-muted-foreground" />
                  <Title level="h4" className="text-muted-foreground">No results yet</Title>
                  <Text level="small" color="muted" className="max-w-sm">
                    {hasInputs
                      ? "Fill in the form and click Process to see results here."
                      : `Click "${appUi.action}" to start and results will appear here.`}
                  </Text>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Resume Screener: combined list + detail panel                     */
/* ------------------------------------------------------------------ */

function ResumeScreenerPanel({
  history,
  historyLoading,
  runResult,
  selectedCandidate,
  onSelectCandidate,
}: {
  history: HistoryRun[];
  historyLoading: boolean;
  runResult: RunResult | null;
  selectedCandidate: CandidateEntry | null;
  onSelectCandidate: (c: CandidateEntry | null) => void;
}) {
  const candidates: CandidateEntry[] = [];
  const seenRunIds = new Set<string>();

  if (runResult?.status === "completed" && runResult.outputs) {
    const c = extractCandidateFromRun({
      id: runResult.runId,
      status: "completed",
      create_time: new Date().toISOString(),
      outputs: runResult.outputs,
    });
    if (c) {
      candidates.push(c);
      seenRunIds.add(runResult.runId);
    }
  }

  for (const run of history) {
    if (seenRunIds.has(run.id)) continue;
    const c = extractCandidateFromRun(run);
    if (c) candidates.push(c);
  }

  const awaitingCount = history.filter((r) => r.status === "awaiting_guidance").length;
  const failedCount = history.filter((r) => r.status === "failed").length;

  return (
    <>
      {/* Full-width candidate list */}
      <div className="rounded-lg border border-border bg-background overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon type="Users" size="sm" className="text-primary" />
              <Title level="h4">Candidates</Title>
            </div>
            <div className="flex items-center gap-2">
              {awaitingCount > 0 && (
                <Link href="/exceptions" className="flex items-center gap-1 text-xs text-warning hover:underline">
                  <Icon type="AlertTriangle" size="xs" />
                  {awaitingCount}
                </Link>
              )}
              {failedCount > 0 && (
                <span className="flex items-center gap-1 text-xs text-destructive">
                  <Icon type="CircleAlert" size="xs" />
                  {failedCount}
                </span>
              )}
              <Badge variant="outline" className="text-xs">
                {candidates.length}
              </Badge>
            </div>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(100vh-340px)]">
          {historyLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-14 rounded" />
              ))}
            </div>
          ) : candidates.length === 0 ? (
            <div className="p-6 flex flex-col items-center justify-center gap-2 text-center py-12">
              <Icon type="FileScan" size="lg" className="text-muted-foreground" />
              <Text level="small" color="muted">No candidates screened yet</Text>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {candidates.map((c) => {
                const isSelected = selectedCandidate?.runId === c.runId;
                const scoreVariant: "success" | "destructive" | "warning" =
                  c.score.toLowerCase() === "high" ? "success"
                    : c.score.toLowerCase() === "low" ? "destructive"
                      : "warning";

                return (
                  <button
                    key={c.runId}
                    onClick={() => onSelectCandidate(c)}
                    className={`w-full text-left px-4 py-3 transition-colors ${
                      isSelected
                        ? "bg-primary/5 border-l-2 border-l-primary"
                        : "hover:bg-muted/30 border-l-2 border-l-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`rounded-full p-1.5 shrink-0 ${isSelected ? "bg-primary/20" : "bg-muted/50"}`}>
                        <Icon type="User" size="xs" className={isSelected ? "text-primary" : "text-muted-foreground"} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <Text level="small" className="font-medium truncate block">{c.name}</Text>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant={scoreVariant} className="text-[10px] px-1.5 py-0">
                            {c.score}
                          </Badge>
                          <Text level="xSmall" color="muted" className="truncate">
                            {c.status}
                          </Text>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Text level="xSmall" color="muted">
                          {dayjs(c.runTime).fromNow()}
                        </Text>
                        <Icon type="ChevronRight" size="xs" className="text-muted-foreground" />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Slide-in detail sheet */}
      <Sheet
        open={!!selectedCandidate}
        onOpenChange={(open) => { if (!open) onSelectCandidate(null); }}
      >
        <SheetContent side="right" className="w-full sm:max-w-xl p-0 overflow-y-auto">
          <SheetHeader className="px-6 py-4 pr-12 border-b border-border bg-muted/30">
            <div className="flex items-center gap-2">
              <Icon type="CircleCheck" size="sm" className="text-success" />
              <SheetTitle>Candidate Analysis by Kognitos</SheetTitle>
            </div>
            <SheetDescription>
              {selectedCandidate
                ? dayjs(selectedCandidate.runTime).format("MMM D, YYYY h:mm A")
                : ""}
            </SheetDescription>
          </SheetHeader>
          {selectedCandidate && (
            <ResumeScreenerResults outputs={selectedCandidate.outputs} />
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

function ResumeScreenerResults({ outputs }: { outputs: Record<string, unknown> }) {
  const str = (key: string) => {
    const v = outputs[key];
    if (typeof v === "string") return v;
    if (v != null) return String(v);
    return undefined;
  };

  const name = str("candidate_name");
  const score = str("relevance_score");
  const status = str("candidate_status");
  const applicantId = str("applicant_id");
  const email = str("email") ?? str("candidate_email");
  const phone = str("phone") ?? str("candidate_phone") ?? str("phone_number");
  const experience = str("experience") ?? str("years_of_experience") ?? str("total_experience");
  const education = str("education") ?? str("degree") ?? str("highest_education");
  const skills = str("skills") ?? str("key_skills") ?? str("matched_skills");
  const summary = str("summary") ?? str("analysis") ?? str("screening_summary") ?? str("assessment");
  const recommendation = str("recommendation") ?? str("next_steps") ?? str("routing_reason");
  const reviewReason = str("review_reason");
  const jobTitle = str("job_title") ?? str("position") ?? str("role");
  const location = str("location") ?? str("candidate_location");
  const currentCompany = str("current_company") ?? str("company");
  const jobOpeningId = str("job_opening_id") ?? str("Job Opening ID");

  const heroFields = new Set([
    "candidate_name", "relevance_score", "candidate_status", "applicant_id",
    "email", "candidate_email", "phone", "candidate_phone", "phone_number",
    "experience", "years_of_experience", "total_experience",
    "education", "degree", "highest_education",
    "skills", "key_skills", "matched_skills",
    "summary", "analysis", "screening_summary", "assessment",
    "recommendation", "next_steps", "routing_reason",
    "review_reason",
    "job_title", "position", "role",
    "location", "candidate_location",
    "current_company", "company",
    "job_opening_id", "Job Opening ID",
  ]);

  const extraFields = Object.entries(outputs).filter(([k]) => !heroFields.has(k));

  const scoreVariant: "success" | "destructive" | "warning" =
    score?.toLowerCase() === "high"
      ? "success"
      : score?.toLowerCase() === "low"
        ? "destructive"
        : "warning";

  const statusVariant: "success" | "destructive" | "warning" =
    status?.toLowerCase() === "open" || status?.toLowerCase() === "accepted"
      ? "success"
      : status?.toLowerCase().includes("reject")
        ? "destructive"
        : "warning";

  const scoreIcon: IconType =
    score?.toLowerCase() === "high" ? "CircleCheck" : score?.toLowerCase() === "low" ? "CircleAlert" : "AlertTriangle";

  const contactDetails = [email, phone, location].filter(Boolean);
  const profileDetails = [
    currentCompany && { label: "Company", value: currentCompany },
    experience && { label: "Experience", value: experience },
    education && { label: "Education", value: education },
    jobTitle && { label: "Applied For", value: jobTitle },
    jobOpeningId && { label: "Opening ID", value: jobOpeningId },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <div className="divide-y divide-border">
      {/* Header — Candidate identity + verdict */}
      <div className="p-6">
        <div className="flex items-start gap-4">
          <div className="rounded-full bg-primary/10 p-3 shrink-0">
            <Icon type="User" size="lg" className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Title level="h3">{name ?? "Unknown Candidate"}</Title>
                {applicantId && (
                  <Text level="xSmall" color="muted" className="font-mono mt-0.5">{applicantId}</Text>
                )}
              </div>
              {score && (
                <Badge variant={scoreVariant} className="text-sm px-3 py-1 shrink-0">
                  <Icon type={scoreIcon} size="xs" className="mr-1" />
                  {score} Relevance
                </Badge>
              )}
            </div>
            {contactDetails.length > 0 && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
                {email && (
                  <Text level="xSmall" color="muted" className="flex items-center gap-1">
                    <Icon type="Mail" size="xs" className="text-muted-foreground" />
                    {email}
                  </Text>
                )}
                {phone && (
                  <Text level="xSmall" color="muted" className="flex items-center gap-1">
                    <Icon type="Phone" size="xs" className="text-muted-foreground" />
                    {phone}
                  </Text>
                )}
                {location && (
                  <Text level="xSmall" color="muted" className="flex items-center gap-1">
                    <Icon type="MapPin" size="xs" className="text-muted-foreground" />
                    {location}
                  </Text>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Verdict cards */}
      <div className="p-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border border-border p-4 space-y-2">
            <Text level="xSmall" color="muted" className="uppercase tracking-wider font-medium">
              Relevance Score
            </Text>
            <div className="flex items-center gap-2">
              <Badge variant={scoreVariant} className="text-base px-3 py-1">
                {score ?? "—"}
              </Badge>
            </div>
          </div>
          <div className="rounded-lg border border-border p-4 space-y-2">
            <Text level="xSmall" color="muted" className="uppercase tracking-wider font-medium">
              Routing Decision
            </Text>
            <div className="flex items-center gap-2">
              <Badge variant={statusVariant} className="text-base px-3 py-1">
                {status ?? "—"}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Review reason — shown only for Manual Review Needed */}
      {reviewReason && status?.toLowerCase().includes("manual") && (
        <div className="p-6">
          <div className="rounded-lg border border-warning/30 bg-warning/5 p-4 flex items-start gap-3">
            <Icon type="AlertTriangle" size="sm" className="text-warning mt-0.5 shrink-0" />
            <div>
              <Text level="xSmall" color="muted" className="uppercase tracking-wider font-medium mb-1">
                Why Manual Review Is Needed
              </Text>
              <Text level="small" className="leading-relaxed">{reviewReason}</Text>
            </div>
          </div>
        </div>
      )}

      {/* Profile details */}
      {profileDetails.length > 0 && (
        <div className="p-6">
          <Text level="xSmall" color="muted" className="uppercase tracking-wider font-medium mb-3">
            Candidate Profile
          </Text>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3">
            {profileDetails.map((d) => (
              <div key={d.label}>
                <Text level="xSmall" color="muted">{d.label}</Text>
                <Text level="small" className="font-medium mt-0.5">{d.value}</Text>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills */}
      {skills && (
        <div className="p-6">
          <Text level="xSmall" color="muted" className="uppercase tracking-wider font-medium mb-3">
            Key Skills
          </Text>
          <div className="flex flex-wrap gap-2">
            {skills.split(/[,;|]/).map((s) => s.trim()).filter(Boolean).map((skill) => (
              <span key={skill} className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Summary / Assessment */}
      {summary && (
        <div className="p-6">
          <Text level="xSmall" color="muted" className="uppercase tracking-wider font-medium mb-3">
            <Icon type="FileText" size="xs" className="inline mr-1 align-text-bottom" />
            Screening Summary
          </Text>
          <div className="rounded-lg bg-muted/30 p-4">
            <Text level="small" className="leading-relaxed whitespace-pre-wrap">{summary}</Text>
          </div>
        </div>
      )}

      {/* Recommendation / Next Steps */}
      {recommendation && (
        <div className="p-6">
          <Text level="xSmall" color="muted" className="uppercase tracking-wider font-medium mb-3">
            <Icon type="Sparkles" size="xs" className="inline mr-1 align-text-bottom" />
            Recommendation
          </Text>
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
            <Text level="small" className="leading-relaxed whitespace-pre-wrap">{recommendation}</Text>
          </div>
        </div>
      )}

      {/* Remaining fields not covered above */}
      {extraFields.length > 0 && (
        <div className="p-6">
          <Text level="xSmall" color="muted" className="uppercase tracking-wider font-medium mb-3">
            Additional Details
          </Text>
          <div className="space-y-2">
            {extraFields.map(([k, v]) => {
              const display = typeof v === "string" ? v : JSON.stringify(v, null, 2);
              const isLong = typeof display === "string" && display.length > 120;
              return (
                <div key={k} className={isLong ? "space-y-1" : "flex items-baseline justify-between gap-4 py-1.5"}>
                  <Text level="xSmall" color="muted" className="capitalize shrink-0">
                    {k.replace(/_/g, " ")}
                  </Text>
                  {isLong ? (
                    <div className="rounded-lg bg-muted/30 p-3 mt-1">
                      <Text level="small" className="whitespace-pre-wrap break-words">{display}</Text>
                    </div>
                  ) : (
                    <Text level="small" className="font-medium text-right break-words">{display}</Text>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function SyncResults({ outputs }: { outputs: Record<string, unknown> }) {
  const entries = Object.entries(outputs);

  return (
    <div className="p-6">
      {entries.length === 0 ? (
        <Text color="muted">Sync completed with no output data.</Text>
      ) : (
        <div className="space-y-3">
          {entries.map(([key, val]) => (
            <div key={key} className="flex items-center justify-between py-3 border-b border-border last:border-0">
              <Text level="small" color="muted" className="capitalize">
                {key.replace(/_/g, " ")}
              </Text>
              <Text className="font-semibold text-lg">
                {typeof val === "string" ? val : JSON.stringify(val)}
              </Text>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function GenericResults({ outputs }: { outputs: Record<string, unknown> }) {
  const entries = Object.entries(outputs);

  return (
    <div className="p-6">
      {entries.length === 0 ? (
        <Text color="muted">Completed with no output data.</Text>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {entries.map(([key, val]) => (
            <div key={key} className="rounded-lg border border-border p-4 space-y-1">
              <Text level="xSmall" color="muted" className="uppercase tracking-wider font-medium">
                {key.replace(/_/g, " ")}
              </Text>
              <Text level="small" className="font-medium break-words">
                {typeof val === "string" ? val : JSON.stringify(val, null, 2)}
              </Text>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
