"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Copy, RefreshCw, Trash2, Puzzle, CheckCircle, ShieldCheck, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const [hasToken, setHasToken] = useState<boolean | null>(null);
  const [tokenPreview, setTokenPreview] = useState<string | null>(null);
  const [newToken, setNewToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [healthChecking, setHealthChecking] = useState(false);
  const [healthResult, setHealthResult] = useState<{ checked: number; dead: number } | null>(null);

  useEffect(() => {
    fetch("/api/extension/token")
      .then((r) => r.json())
      .then((d) => {
        setHasToken(d.has_token);
        setTokenPreview(d.token_preview);
      })
      .catch(() => setHasToken(false));
  }, []);

  async function handleGenerate() {
    setLoading(true);
    try {
      const res = await fetch("/api/extension/token", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to generate token");
      setNewToken(data.token);
      setHasToken(true);
      setTokenPreview(`****${data.token.slice(-8)}`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to generate token");
    } finally {
      setLoading(false);
    }
  }

  async function handleRevoke() {
    if (!confirm("Revoke this token? The extension will stop working until you reconnect it.")) return;
    setLoading(true);
    try {
      const res = await fetch("/api/extension/token", { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to revoke token");
      setHasToken(false);
      setTokenPreview(null);
      setNewToken(null);
      toast.success("Token revoked");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to revoke token");
    } finally {
      setLoading(false);
    }
  }

  async function handleHealthCheck() {
    setHealthChecking(true);
    setHealthResult(null);
    try {
      const res = await fetch("/api/links/health-check", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Health check failed");
      setHealthResult(data);
      toast.success(`Checked ${data.checked} links — ${data.dead} broken`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Health check failed");
    } finally {
      setHealthChecking(false);
    }
  }

  async function handleCopy(token: string) {
    await navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Token copied to clipboard");
  }

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-semibold text-text-primary mb-6">Settings</h1>

        {/* Browser Extension Card */}
        <div className="bg-white rounded-xl border border-border p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-10 h-10 rounded-xl bg-brand-purple-light flex items-center justify-center flex-shrink-0">
              <Puzzle className="w-5 h-5 text-brand-purple" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-text-primary">Browser Extension</h2>
              <p className="text-sm text-text-muted mt-0.5">
                Save links directly from any page without opening the app. Generate an API token
                and paste it into the extension.
              </p>
            </div>
          </div>

          {hasToken === null ? (
            <div className="h-10 bg-slate-100 rounded-lg animate-pulse" />
          ) : newToken ? (
            /* Show the newly generated token once */
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-border font-mono text-sm text-text-primary overflow-hidden">
                <span className="flex-1 truncate">{newToken}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 flex-shrink-0"
                  onClick={() => handleCopy(newToken)}
                >
                  {copied ? (
                    <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-amber-600 font-medium">
                Copy this token now — it won&apos;t be shown again.
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={handleGenerate}
                  disabled={loading}
                >
                  <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
                  Regenerate
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-destructive hover:text-destructive"
                  onClick={handleRevoke}
                  disabled={loading}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Revoke
                </Button>
              </div>
            </div>
          ) : hasToken ? (
            /* Token exists but we don't show the full value */
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-border">
                <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                <span className="font-mono text-sm text-text-secondary flex-1">
                  {tokenPreview}
                </span>
                <span className="text-xs text-green-600 font-medium">Active</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={handleGenerate}
                  disabled={loading}
                >
                  <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
                  Regenerate token
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-destructive hover:text-destructive"
                  onClick={handleRevoke}
                  disabled={loading}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Revoke
                </Button>
              </div>
            </div>
          ) : (
            /* No token yet */
            <Button
              className="bg-brand-purple hover:bg-brand-purple-dark gap-2"
              onClick={handleGenerate}
              disabled={loading}
            >
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
              Generate API Token
            </Button>
          )}
        </div>

        {/* Link Health Check */}
        <div className="mt-6 bg-white rounded-xl border border-border p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-10 h-10 rounded-xl bg-brand-purple-light flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-5 h-5 text-brand-purple" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-text-primary">Link Health Check</h2>
              <p className="text-sm text-text-muted mt-0.5">
                Scan all your saved links to find broken or dead URLs. Cards will be marked with a warning indicator.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="gap-2"
              onClick={handleHealthCheck}
              disabled={healthChecking}
            >
              <ShieldCheck className={cn("w-4 h-4", healthChecking && "animate-pulse")} />
              {healthChecking ? "Checking links…" : "Check all links"}
            </Button>
            {healthResult && (
              <span className={cn("text-sm flex items-center gap-1.5", healthResult.dead > 0 ? "text-destructive" : "text-brand-teal")}>
                {healthResult.dead > 0
                  ? <><AlertTriangle className="w-3.5 h-3.5" />{healthResult.dead} broken of {healthResult.checked}</>
                  : <><CheckCircle className="w-3.5 h-3.5" />All {healthResult.checked} links are healthy</>
                }
              </span>
            )}
          </div>
        </div>

        {/* How to use */}
        <div className="mt-6 bg-white rounded-xl border border-border p-6">
          <h2 className="text-base font-semibold text-text-primary mb-4">How to use the extension</h2>
          <ol className="space-y-3 text-sm text-text-secondary">
            <li className="flex gap-3">
              <span className="w-5 h-5 rounded-full bg-brand-purple-light text-brand-purple text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
              <span>Generate an API token above.</span>
            </li>
            <li className="flex gap-3">
              <span className="w-5 h-5 rounded-full bg-brand-purple-light text-brand-purple text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
              <span>
                Load the extension in Chrome: open <code className="font-mono bg-slate-100 px-1 rounded">chrome://extensions</code>, enable{" "}
                <strong>Developer mode</strong>, click <strong>Load unpacked</strong>, and select the{" "}
                <code className="font-mono bg-slate-100 px-1 rounded">extension/</code> folder from the project.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="w-5 h-5 rounded-full bg-brand-purple-light text-brand-purple text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
              <span>Click the Digested extension icon, paste your token, and save it.</span>
            </li>
            <li className="flex gap-3">
              <span className="w-5 h-5 rounded-full bg-brand-purple-light text-brand-purple text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">4</span>
              <span>On any page you want to save, click the extension icon and hit <strong>Save to Digested</strong>.</span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
