"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Upload, Check, Loader2, Play, FileVideo, Trash2, Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";
import axios, { AxiosProgressEvent } from "axios";
import { toast } from "sonner";
import CircularProgress from "@/components/progress";

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL;
if (!SERVER_URL) throw new Error("'SERVER_URL' not configured in environment variables");

const RESOLUTIONS = [
  { id: "144p", label: "144p", width: 256, height: 144 },
  { id: "240p", label: "240p", width: 426, height: 240 },
  { id: "360p", label: "360p", width: 640, height: 360 },
  { id: "480p", label: "480p", width: 854, height: 480 },
  { id: "720p", label: "720p", width: 1280, height: 720 },
  { id: "1080p", label: "1080p", width: 1920, height: 1080 },
  { id: "1440p", label: "1440p", width: 2560, height: 1440 },
  { id: "2160p", label: "2160p", width: 3840, height: 2160 },
];

interface FileState {
  name: string;
  size: number;
  key: string;
}

export default function TranscodeApp() {
  const [file, setFile] = useState<FileState>({ name: "", size: 0, key: "" });
  const [originalRes, setOriginalRes] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [selectedResolutions, setSelectedResolutions] = useState<string[]>([]);
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isStarting, setIsStarting] = useState(false);

  const router = useRouter();

  const uploadComplete = Boolean(file.key);

  const resetUploadState = useCallback(() => {
    setIsUploading(false);
    setUploadProgress(0);
  }, []);

  const detectResolution = useCallback((videoFile: File) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      setOriginalRes({ width: video.videoWidth, height: video.videoHeight });
      window.URL.revokeObjectURL(video.src);
    };
    video.src = URL.createObjectURL(videoFile);
  }, []);

  const handleFileUpload = useCallback(
    async (selectedFile: File) => {
      if (!selectedFile.type.startsWith("video/")) {
        return toast.warning("Only video files are allowed");
      }
      if (selectedFile.size > 500 * 1024 * 1024) {
        return toast.warning("File size must be under 500MB");
      }

      // Reset state for new upload
      setFile({ name: selectedFile.name, size: selectedFile.size, key: "" });
      setSelectedResolutions([]);
      setIsAllSelected(false);
      setOriginalRes(null);

      // Detect video resolution
      detectResolution(selectedFile);

      try {
        setIsUploading(true);
        const fileType = selectedFile.type;

        const res = await axios.get(
          `${SERVER_URL}/api/s3/upload-url?fileType=${encodeURIComponent(fileType)}`
        );

        if (res.statusText !== "OK") {
          toast.error("Failed to get presigned URL");
          return resetUploadState();
        }

        const { url, key } = res.data;
        console.log(url, key);

        const uploadResponse = await axios.put(url, selectedFile, {
          headers: { "Content-Type": fileType },
          onUploadProgress: (e: AxiosProgressEvent) => {
            const total = e.total ?? selectedFile.size;
            setUploadProgress(Math.round((e.loaded / total) * 100));
          },
        });

        if (uploadResponse.status !== 200) {
          toast.error("Failed to upload video");
          return resetUploadState();
        }

        setFile((prev) => ({ ...prev, key }));
        toast.success("Video uploaded successfully");
      } catch (err) {
        console.error("Upload error:", err);
        toast.error("An error occurred during upload");
        setFile({ name: "", size: 0, key: "" });
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
    },
    [detectResolution, resetUploadState]
  );

  const onFileDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragActive(false);
      const droppedFile = e.dataTransfer.files?.[0];
      if (droppedFile) handleFileUpload(droppedFile);
    },
    [handleFileUpload]
  );

  const onFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile) handleFileUpload(selectedFile);
      e.target.value = "";
    },
    [handleFileUpload]
  );

  const removeFile = useCallback(() => {
    setFile({ name: "", size: 0, key: "" });
    setOriginalRes(null);
    setSelectedResolutions([]);
    setIsAllSelected(false);
    toast.success("File removed");
  }, []);

  const toggleResolution = (id: string) => {
    if (isAllSelected) return;
    setSelectedResolutions((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (isAllSelected) {
      setIsAllSelected(false);
      setSelectedResolutions([]);
    } else {
      setIsAllSelected(true);
      const available = RESOLUTIONS.filter(
        (r) => originalRes && r.height <= originalRes.height
      ).map((r) => r.id);
      setSelectedResolutions(available);
    }
  };

  const handleStartTranscoding = async () => {
    if (!file.key || selectedResolutions.length === 0) return;

    setIsStarting(true);
    try {
      const res = await fetch(`${SERVER_URL}/api/transcode`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: file.key,
          resolutions: selectedResolutions,
        }),
      });

      if (!res.ok) throw new Error("Failed to start transcoding");
      const data = await res.json();
      toast.success("Transcoding started!");
      router.push(`/status/${data.jobId}`);
    } catch (err) {
      console.error("Transcoding error:", err);
      toast.error("Failed to start transcoding");
      setIsStarting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-emerald-500/30">
      <div className="max-w-4xl mx-auto px-6 py-20">
        {/* Header */}
        <header className="mb-16 text-center">
          <h1 className="text-6xl font-bold tracking-tighter mb-4 bg-linear-to-b from-white to-white/40 bg-clip-text text-transparent">
            CloudTranscode
          </h1>
          <p className="text-zinc-500 text-lg max-w-xl mx-auto">
            High-performance video transcoding. Select your source, choose your
            resolutions, and let our cloud handle the rest.
          </p>
        </header>

        <div className="space-y-8">
          {/* Step 1: File Selection & Upload */}
          <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-8 backdrop-blur-xl">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <FileVideo size={24} />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Source Video</h2>
                <p className="text-zinc-500 text-sm">
                  Upload the video you want to process
                </p>
              </div>
            </div>

            <input
              type="file"
              accept="video/*"
              className="hidden"
              id="video-input"
              onChange={onFileSelect}
            />

            {!file.name ? (
              /* Drag-and-Drop / Upload Area */
              <div
                className={cn(
                  "border-2 border-dashed rounded-2xl transition-colors p-8 text-center",
                  dragActive
                    ? "border-emerald-500 bg-emerald-500/5"
                    : "border-white/10 hover:border-white/20"
                )}
                onDrop={onFileDrop}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
              >
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                    <Upload size={24} className="text-zinc-400" />
                  </div>
                  <div>
                    <p className="text-zinc-300 font-medium mb-1">
                      Drop your video here
                    </p>
                    <p className="text-zinc-500 text-sm">or</p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      document.getElementById("video-input")?.click()
                    }
                    className="px-6 py-3 rounded-full font-medium bg-white text-black hover:bg-zinc-200 transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <Paperclip size={18} />
                    Browse Files
                  </button>
                  <p className="text-zinc-600 text-xs">
                    Supported: MP4, MOV, AVI, MKV — Max 500MB
                  </p>
                </div>
              </div>
            ) : (
              /* File Display — Uploading or Uploaded */
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                  {/* Left: Progress indicator or icon */}
                  {isUploading ? (
                    <CircularProgress progress={uploadProgress} />
                  ) : uploadComplete ? (
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                      <Check size={20} className="text-emerald-500" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                      <Play size={16} className="text-zinc-400" />
                    </div>
                  )}

                  {/* Center: File info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{file.name}</p>
                    <p className="text-xs text-zinc-500">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                      {originalRes &&
                        ` • ${originalRes.width}×${originalRes.height}`}
                      {!originalRes && " • Detecting resolution..."}
                    </p>
                  </div>

                  {/* Right: Remove button (only when not uploading) */}
                  {!isUploading && (
                    <button
                      onClick={removeFile}
                      className={cn(
                        "p-2 rounded-full transition-colors cursor-pointer",
                        "text-zinc-500 hover:text-red-400 hover:bg-red-500/10"
                      )}
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>

                {/* Upload progress bar */}
                {isUploading && (
                  <div className="space-y-2 animate-in fade-in">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-400 flex items-center gap-2">
                        <Loader2 className="animate-spin" size={14} />
                        Uploading to cloud...
                      </span>
                      <span className="text-zinc-500 font-mono">
                        {uploadProgress}%
                      </span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 transition-all duration-300 ease-out rounded-full"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Upload complete indicator */}
                {uploadComplete && (
                  <div className="flex items-center gap-2 text-sm text-emerald-500 animate-in fade-in">
                    <Check size={14} />
                    <span>
                      Upload complete — choose your target resolutions below
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Step 2: Resolution Selection (shown after upload is complete) */}
          {uploadComplete && (
            <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-8 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4">
              <h2 className="text-xl font-semibold mb-6">
                Target Resolutions
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-8">
                {/* All button */}
                <button
                  onClick={toggleAll}
                  className={cn(
                    "px-4 py-3 rounded-2xl border transition-all text-sm font-medium cursor-pointer",
                    isAllSelected
                      ? "bg-emerald-500 border-emerald-500 text-white"
                      : "bg-white/5 border-white/5 text-zinc-400 hover:border-white/20"
                  )}
                >
                  All
                </button>

                {/* Individual resolution buttons */}
                {RESOLUTIONS.map((res) => {
                  const isDisabled = originalRes
                    ? res.height > originalRes.height
                    : true;
                  const isSelected = selectedResolutions.includes(res.id);
                  return (
                    <button
                      key={res.id}
                      disabled={isDisabled || isAllSelected}
                      onClick={() => toggleResolution(res.id)}
                      className={cn(
                        "px-4 py-3 rounded-2xl border transition-all text-sm font-medium relative overflow-hidden cursor-pointer",
                        isSelected
                          ? "bg-white text-black border-white"
                          : "bg-white/5 border-white/5 text-zinc-400 hover:border-white/20",
                        isDisabled && "opacity-30 cursor-not-allowed grayscale",
                        isAllSelected &&
                          isSelected &&
                          "bg-white/10 border-white/10 text-zinc-500"
                      )}
                    >
                      {res.label}
                      {isSelected && !isAllSelected && (
                        <div className="absolute top-1 right-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Start Transcoding button */}
              <button
                disabled={selectedResolutions.length === 0 || isStarting}
                onClick={handleStartTranscoding}
                className={cn(
                  "w-full mt-4 py-4 rounded-2xl font-semibold text-lg transition-all flex items-center justify-center gap-3 cursor-pointer",
                  selectedResolutions.length > 0 && !isStarting
                    ? "bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/20"
                    : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                )}
              >
                {isStarting ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    Start Transcoding
                    <Upload size={20} />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
