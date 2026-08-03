import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, FileText } from "lucide-react";
import toast from "react-hot-toast";

import documentService from "../../services/documentService";

import Spinner from "../../components/common/Spinner";
import PageHeader from "../../components/common/PageHeader";
import Tabs from "../../components/common/Tabs";

import ChatInterface from "../../components/chat/ChatInterface";
import AIActions from "../../components/ai/AIActions";
import FlashcardManager from "../../components/flashcards/FlashcardManager";
import QuizManager from "../../components/quizzes/QuizManager";
import { BASE_URL } from "../../utils/apiPaths";

const DocumentDetailPage = () => {
  const { id } = useParams();

  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("Content");

  useEffect(() => {
    let active = true;
    let pollTimer = null;
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

        const message =
          err?.message || "Failed to fetch document";

        setError(message);

        if (!document) {
          toast.error(message);
        }
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
        const next =
          await documentService.getDocumentById(id);

        if (!active) return;

        setDocument((prev) => {
          if (
            prev?.status === "processing" &&
            next?.status !== "processing"
          ) {
            clearInterval(pollTimer);
            pollTimer = null;
          }

          return next;
        });
      } catch (e) {}
    }, 4000);

    return () => {
      active = false;

      if (pollTimer) {
        clearInterval(pollTimer);
      }
    };
  }, [id]);

  const getPdfUrl = () => {
    if (!document?.filePath) return null;

    const raw = String(document.filePath);

    if (
      raw.startsWith("http://") ||
      raw.startsWith("https://")
    ) {
      return raw;
    }

    const baseUrl = BASE_URL;

    return `${baseUrl}${
      raw.startsWith("/") ? "" : "/"
    }${raw}`;
  };

  const openPDF = () => {
    const pdf = getPdfUrl();

    if (!pdf) {
      toast.error("PDF not found");
      return;
    }

    window.open(pdf, "_blank");
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
  const documentFileName = document?.fileName || "document.pdf";

  if (!pdfUrl) {
    return (
      <div className="bg-white rounded-xl border p-10 text-center">
        <FileText className="mx-auto w-12 h-12 text-gray-400 mb-4" />

        <h3 className="text-lg font-semibold">
          PDF Not Found
        </h3>

        <p className="text-gray-500 mt-2">
          This document doesn't have a PDF attached.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow border">

      {/* Header */}

      <div className="flex justify-between items-center p-4 border-b">

        <h2 className="text-lg font-semibold">
          Document Viewer
        </h2>

        <div className="flex gap-3">

          <button
            onClick={openPDF}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          >
            Open PDF
          </button>

          <a
            href={pdfUrl}
            download={documentFileName}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700"
          >
            Download PDF
          </a>

        </div>

      </div>

      {/* PDF */}

      <iframe
        src={pdfUrl}
        title="PDF Viewer"
        className="w-full h-[80vh]"
        style={{
          border: "none"
        }}
      />

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
    content:
      activeTab === "Chat" ? (
        <ChatInterface documentId={id} />
      ) : null,
  },
  {
    name: "AI Actions",
    label: "AI Actions",
    content:
      activeTab === "AI Actions" ? (
        <AIActions documentId={id} />
      ) : null,
  },
  {
    name: "Flashcards",
    label: "Flashcards",
    content:
      activeTab === "Flashcards" ? (
        <FlashcardManager documentId={id} />
      ) : null,
  },
  {
    name: "Quizzes",
    label: "Quizzes",
    content:
      activeTab === "Quizzes" ? (
        <QuizManager documentId={id} />
      ) : null,
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
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-black"
      >
        <ArrowLeft size={16} />
        Back to Documents
      </Link>

      <div className="bg-white rounded-xl border p-12 text-center">
        <FileText className="mx-auto w-12 h-12 text-gray-400 mb-4" />

        <h2 className="text-2xl font-bold">
          Document Not Found
        </h2>

        <p className="text-gray-500 mt-3">
          {error ||
            "This document may have been deleted or you don't have permission to access it."}
        </p>
      </div>
    </div>
  );
}

const statusBanner = (status) => {
  switch (status) {
    case "processing":
      return (
        <div className="rounded-xl bg-blue-50 border border-blue-200 p-4">
          <p className="text-blue-700 font-medium">
            ⏳ Document is processing...
          </p>

          <p className="text-sm text-blue-600 mt-1">
            AI features will be available once processing is complete.
          </p>
        </div>
      );

    case "ready":
      return (
        <div className="rounded-xl bg-green-50 border border-green-200 p-4">
          <p className="text-green-700 font-medium">
            ✅ Document processed successfully.
          </p>
        </div>
      );

    case "error":
      return (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4">
          <p className="text-red-700 font-medium">
            ❌ Document processing failed.
          </p>

          <p className="text-sm text-red-600 mt-1">
            Please upload the PDF again.
          </p>
        </div>
      );

    default:
      return null;
  }
};

return (
  <div className="space-y-6">

    <Link
      to="/documents"
      className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-black"
    >
      <ArrowLeft size={16} />
      Back to Documents
    </Link>

    <div className="space-y-3">
      <PageHeader
        title={document?.title || "Document"}
      />

      {document?.status &&
        statusBanner(document.status)}
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