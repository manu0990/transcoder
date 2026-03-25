"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, Download } from "lucide-react";
import { cn } from "@/lib/utils";

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL;
if(!SERVER_URL) throw new Error("'SERVER_URL' not configured in environment variables");

export default function StatusPage() {
  const params = useParams();
  const jobId = params.jobId as string;
  const [job, setJob] = useState<{
    status: string;
    resolutions: string[];
    progress: Record<string, number>;
  } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const poll = setInterval(async () => {
      try {
        const res = await fetch(`${SERVER_URL}/api/status/${jobId}`);
        const data = await res.json();
        setJob(data);
        if (data.status === "completed") clearInterval(poll);
      } catch (err) {
        console.error(err);
      }
    }, 2000);
    return () => clearInterval(poll);
  }, [jobId]);

  if (!job)
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="animate-spin text-emerald-500" size={48} />
      </div>
    );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans">
      <div className="max-w-4xl mx-auto px-6 py-20">
        <button
          onClick={() => router.push("/")}
          className="mb-12 text-zinc-500 hover:text-white transition-colors flex items-center gap-2"
        >
          ← Back to Dashboard
        </button>

        <header className="mb-12">
          <div className="flex items-center gap-4 mb-4">
            <h1 className="text-4xl font-bold tracking-tight">Job Status</h1>
            <div
              className={cn(
                "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest",
                job.status === "completed"
                  ? "bg-emerald-500/10 text-emerald-500"
                  : "bg-blue-500/10 text-blue-500 animate-pulse"
              )}
            >
              {job.status}
            </div>
          </div>
          <p className="text-zinc-500 font-mono text-sm">ID: {jobId}</p>
        </header>

        <div className="grid gap-4">
          {job.resolutions.map((res: string) => (
            <div
              key={res}
              className="bg-zinc-900/50 border border-white/5 rounded-3xl p-6 flex items-center justify-between group"
            >
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-semibold">{res}</span>
                  <span className="text-sm font-mono text-zinc-500">
                    {job.progress[res]}%
                  </span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-500 ease-out"
                    style={{ width: `${job.progress[res]}%` }}
                  />
                </div>
              </div>
              <div className="ml-8">
                <button
                  disabled={job.progress[res] < 100}
                  className={cn(
                    "p-4 rounded-2xl transition-all",
                    job.progress[res] === 100
                      ? "bg-white text-black hover:scale-105 active:scale-95"
                      : "bg-white/5 text-zinc-700 cursor-not-allowed"
                  )}
                >
                  <Download size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
