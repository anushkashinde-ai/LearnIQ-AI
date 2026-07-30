import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ExternalLink, FileText } from "lucide-react";
import toast from "react-hot-toast";

import documentService from "../../services/documentService";

import Spinner from "../../components/common/Spinner";
import PageHeader from "../../components/common/PageHeader";
import Tabs from "../../components/common/Tabs";

import ChatInterface from "../../components/chat/ChatInterface";
import AIActions from "../../components/ai/AIActions";
import FlashcardManager from "../../components/flashcards/FlashcardManager";
import QuizManager from "../../components/quizzes/QuizManager";

const DocumentDetailPage = () => {
  const { id } = useParams();

  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("Content");
  const [pdfLoadFailed, setPdfLoadFailed] = useState(false);
  const [useGoogleDocsViewer, setUseGoogleDocsViewer] = useState(false);

  useEffect(() => {
    setPdfLoadFailed(false);
    setUseGoogleDocsViewer(false);
  }, [id]);

  useEffect(() => {
    let active = true;
    let pollTimer = null;
    let pdfWatchdogTimer = null;
    let firstLoad = true;

    const fetchDocumentDetails = async () => {
      try {
        if (firstLoad) {
          setLoading(true);
        }
        setError(null);

        const data = await documentService.getDocumentById(id);
        if (!active) return;

        setDocument(data);

        if (data.status && data.status !== "processing") {
          clearInterval(pollTimer);
          pollTimer = null;
        }
      } catch (err) {
        if (!active) return;
        const message = err?.message || "Failed to fetch document";
        setError(message);
        if (!document) toast.error(message);
      } finally {
        if (active && firstLoad) {
          setLoading(false);
          firstLoad = false;
        }
      }
    };

    if (id) {
      fetchDocumentDetails();
    }

    pollTimer = setInterval(async () => {
      if (!active || !id) return;
      try {
        const next = await documentService.getDocumentById(id);
        if (!active) return;

        setDocument((prev) => {
          const prevStatus = prev?.status;
          const nextStatus = next?.status;
          if (
            nextStatus &&
            nextStatus !== "processing" &&
            prevStatus === "processing" &&
            pollTimer
          ) {
            clearInterval(pollTimer);
            pollTimer = null;
          }
          return next;
        });

        if (next.status && next.status !== "processing") {
          clearInterval(pollTimer);
          pollTimer = null;
        }
      } catch (_pollErr) {
        // swallow poll errors, retry on next tick
      }
    }, 4000);

    // Safety: if PDF viewer hasn't rendered anything after 12s, show fallback UI
    pdfWatchdogTimer = setTimeout(() => {
      if (!active) return;
      setPdfLoadFailed((alreadyFailed) => {
        if (alreadyFailed) return alreadyFailed;
        setUseGoogleDocsViewer((gdocs) => {
          if (!gdocs && !alreadyFailed) {
            setPdfLoadFailed(true);
          }
          return gdocs;
        });
        return alreadyFailed;
      });
    }, 12000);

    return () => {
      active = false;
      if (pollTimer) clearInterval(pollTimer);
      if (pdfWatchdogTimer) clearTimeout(pdfWatchdogTimer);
    };
  }, [id]);

  const getPdfUrl = () => {
    if (!document?.filePath) return null;

    const raw = String(document.filePath || "");

    const m = raw.match(/\/uploads\/.+$/);
    if (m && m[0]) {
      return m[0];
    }

    if (raw.startsWith("http://") || raw.startsWith("https://")) {
      return raw;
    }

    const baseUrl =
      import.meta.env.VITE_API_URL || "http://localhost:8000";

    return `${baseUrl}${raw.startsWith("/") ? "" : "/"}${raw}`;
  };

  const getAbsolutePdfUrl = () => {
    const relative = getPdfUrl();
    if (!relative) return null;
    if (relative.startsWith("http://") || relative.startsWith("https://")) {
      return relative;
    }
    const origin =
      (typeof window !== "undefined" && window.location?.origin) ||
      import.meta.env.VITE_API_URL ||
      "http://localhost:8000";
    return `${origin}${relative.startsWith("/") ? "" : "/"}${relative}`;
  };

  const renderContent = () => {
    if (loading && !document) {
      return (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      );
    }

    const pdfUrl = getPdfUrl();
    const absolutePdfUrl = getAbsolutePdfUrl();
    const documentFileName = document?.fileName || "document.pdf";

    if (!pdfUrl) {
      return (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-100 mb-3">
            <FileText className="w-7 h-7 text-slate-400" />
          </div>
          <p className="text-sm text-slate-500">
            PDF file is not available for this document.
          </p>
        </div>
      );
    }

    const viewerSrc = useGoogleDocsViewer
      ? `https://docs.google.com/viewer?url=${encodeURIComponent(absolutePdfUrl || pdfUrl)}&embedded=true`
      : pdfUrl;

    return (
      <div className="bg-white rounded-xl shadow border overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 justify-between p-4 border-b bg-gray-50">
          <span className="font-medium text-slate-700">
            Document Viewer
          </span>

          <div className="flex flex-wrap items-center gap-3">
            {!useGoogleDocsViewer ? (
              <button
                type="button"
                onClick={() => {
                  setPdfLoadFailed(false);
                  setUseGoogleDocsViewer(true);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 transition-colors border border-slate-200 px-2.5 py-1 rounded-md bg-white"
              >
                <ExternalLink size={14} />
                Use Google Docs viewer
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setPdfLoadFailed(false);
                  setUseGoogleDocsViewer(false);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 transition-colors border border-slate-200 px-2.5 py-1 rounded-md bg-white"
              >
                <FileText size={14} />
                Use native PDF viewer
              </button>
            )}

            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              download={documentFileName}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors text-sm"
            >
              <ExternalLink size={16} />
              Open / download PDF
            </a>
          </div>
        </div>

        {pdfLoadFailed && !useGoogleDocsViewer ? (
          <div className="p-10 space-y-4 text-center border-t">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-50 mb-1 border border-amber-200">
              <FileText className="w-7 h-7 text-amber-500" />
            </div>
            <p className="text-sm text-slate-600 max-w-md mx-auto">
              The embedded PDF viewer could not load this file in your browser.
              Try the Google Docs viewer below, or open the PDF directly.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setPdfLoadFailed(false);
                  setUseGoogleDocsViewer(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700 text-white text-sm font-medium hover:bg-slate-800 transition-colors"
              >
                <ExternalLink size={16} />
                Try Google Docs viewer
              </button>
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                download={documentFileName}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                <ExternalLink size={16} />
                Open PDF in new tab
              </a>
            </div>
          </div>
        ) : (
          <object
            data={viewerSrc}
            type={useGoogleDocsViewer ? "text/html" : "application/pdf"}
            title="PDF Viewer"
            className="w-full h-[75vh] bg-white"
            onError={() => setPdfLoadFailed(true)}
          >
            <div className="p-10 space-y-4 text-center border-t">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-50 mb-1 border border-amber-200">
                <FileText className="w-7 h-7 text-amber-500" />
              </div>
              <p className="text-sm text-slate-600 max-w-md mx-auto">
                Your browser cannot display this PDF inline. Use one of the
                options below to open or download it.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={documentFileName}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  <ExternalLink size={16} />
                  Open PDF in new tab
                </a>
              </div>
            </div>
          </object>
        )}
      </div>
    );
  };

  const tabs = [
    {
      name: "Content",
      label: "Content",
      content: renderContent(),
    },
    {
      name: "Chat",
      label: "Chat",
      content: <ChatInterface documentId={id} />,
    },
    {
      name: "AI Actions",
      label: "AI Actions",
      content: <AIActions documentId={id} />,
    },
    {
      name: "Flashcards",
      label: "Flashcards",
      content: <FlashcardManager documentId={id} />,
    },
    {
      name: "Quizzes",
      label: "Quizzes",
      content: <QuizManager documentId={id} />,
    },
  ];

  if (loading && !document) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Spinner />
      </div>
    );
  }

  if (!loading && !document) {
    return (
      <div className="space-y-6">
        <Link
          to="/documents"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-black transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Documents
        </Link>
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-100 mb-4">
            <FileText className="w-7 h-7 text-slate-400" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">
            Document not found
          </h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            {error || "This document may have been deleted or you don't have access to it."}
          </p>
        </div>
      </div>
    );
  }

  const statusBanner = (status) => {
    if (status === "processing") {
      return (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4 flex items-start gap-3">
          <div className="w-5 h-5 mt-0.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <div>
            <h4 className="text-sm font-semibold text-blue-800">
              Document is still processing
            </h4>
            <p className="text-xs text-blue-700 mt-1">
              AI features like flashcards, quizzes, summary and chat are unavailable until processing finishes.
              Refresh in a minute to check the latest status.
            </p>
          </div>
        </div>
      );
    }

    if (status === "error") {
      return (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 flex items-start gap-3">
          <div className="w-6 h-6 mt-0.5 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 font-semibold">
            !
          </div>
          <div>
            <h4 className="text-sm font-semibold text-rose-800">
              Document failed to process
            </h4>
            <p className="text-xs text-rose-700 mt-1">
              PDF parsing or text extraction failed. Please re-upload the file or try a different PDF.
            </p>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-6">
      <Link
        to="/documents"
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-black transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Documents
      </Link>

      <div className="space-y-3">
        <PageHeader title={document?.title || "Document"} />
        {document?.status && statusBanner(document.status)}
      </div>

      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
    </div>
  );
};

export default DocumentDetailPage;