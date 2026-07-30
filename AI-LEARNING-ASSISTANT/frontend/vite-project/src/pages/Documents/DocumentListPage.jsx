import React, { useState, useEffect } from "react";
import {
  Plus,
  Upload,
  Trash2,
  FileText,
  X,
  CloudUpload,
  File,
} from "lucide-react";
import toast from "react-hot-toast";

import documentService from "../../services/documentService";
import Spinner from "../../components/common/Spinner";
import Button from "../../components/common/Button";
import DocumentCard from "../../components/documents/DocumentCard";

const DocumentListPage = () => {
  /* ===========================
      STATES
  =========================== */

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const [uploadFile, setUploadFile] = useState(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploading, setUploading] = useState(false);

  const [dragActive, setDragActive] = useState(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [deleting, setDeleting] = useState(false);

  /* ===========================
      FETCH DOCUMENTS
  =========================== */

  const fetchDocuments = async () => {
    try {
      setLoading(true);

      const data = await documentService.getDocuments();

      setDocuments(data || []);
    } catch (error) {
      console.error(error);

      toast.error(
        error.message ||
        "Failed to fetch documents."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  /* ===========================
      FILE SIZE
  =========================== */

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 B";

    const sizes = ["B", "KB", "MB", "GB"];

    const i = Math.floor(
      Math.log(bytes) / Math.log(1024)
    );

    return `${(
      bytes /
      Math.pow(1024, i)
    ).toFixed(2)} ${sizes[i]}`;
  };

  /* ===========================
      FILE CHANGE
  =========================== */

  const handleFileChange = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("Only PDF files are allowed.");
      return;
    }

    setUploadFile(file);

    if (!uploadTitle) {
      setUploadTitle(
        file.name.replace(/\.[^/.]+$/, "")
      );
    }
  };

  /* ===========================
      DRAG & DROP
  =========================== */

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (
      e.type === "dragenter" ||
      e.type === "dragover"
    ) {
      setDragActive(true);
    }

    if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();

    setDragActive(false);

    const file = e.dataTransfer.files[0];

    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("Only PDF files are allowed.");
      return;
    }

    setUploadFile(file);

    if (!uploadTitle) {
      setUploadTitle(
        file.name.replace(/\.[^/.]+$/, "")
      );
    }
  };

  /* ===========================
      UPLOAD
  =========================== */

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!uploadFile) {
      toast.error("Please select a PDF.");
      return;
    }

    if (!uploadTitle.trim()) {
      toast.error("Please enter title.");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();

      formData.append("file", uploadFile);
      formData.append("title", uploadTitle);

      await documentService.uploadDocument(
        formData
      );

      toast.success(
        "Document uploaded successfully!"
      );

      setUploadFile(null);
      setUploadTitle("");

      setIsUploadModalOpen(false);

      fetchDocuments();
    } catch (error) {
      toast.error(
        error.message ||
        "Upload failed."
      );
    } finally {
      setUploading(false);
    }
  };

  /* ===========================
      DELETE
  =========================== */

  const handleDeleteRequest = (doc) => {
    setSelectedDoc(doc);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedDoc) return;

    try {
      setDeleting(true);

      await documentService.deleteDocument(
        selectedDoc._id
      );

      toast.success("Document deleted.");

      setDocuments((prev) =>
        prev.filter(
          (d) => d._id !== selectedDoc._id
        )
      );

      setSelectedDoc(null);

      setIsDeleteModalOpen(false);
    } catch (error) {
      toast.error(
        error.message ||
        "Delete failed."
      );
    } finally {
      setDeleting(false);
    }
  };

    /* ===========================
      RENDER CONTENT
  =========================== */

  const renderContent = () => {
    if (loading) {
      return <Spinner />;
    }

    if (documents.length === 0) {
      return (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-lg p-12 text-center">

          <div className="mx-auto w-24 h-24 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
            <FileText className="w-10 h-10 text-white" />
          </div>

          <h2 className="mt-8 text-3xl font-bold text-slate-900">
            No Documents Found
          </h2>

          <p className="mt-3 text-slate-500 max-w-md mx-auto">
            Upload your first PDF and start creating AI-powered flashcards,
            quizzes and summaries.
          </p>

          <Button
            className="mt-8"
            onClick={() => setIsUploadModalOpen(true)}
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload First Document
          </Button>

        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {documents.map((doc) => (
          <DocumentCard
            key={doc._id}
            document={doc}
            onDelete={handleDeleteRequest}
          />
        ))}
      </div>
    );
  };

  /* ===========================
      RETURN
  =========================== */

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">

      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:18px_18px] opacity-40 pointer-events-none"></div>

      <div className="relative max-w-7xl mx-auto p-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-10">

          <div>
            <h1 className="text-4xl font-bold text-slate-900">
              My Documents
            </h1>

            <p className="mt-2 text-slate-500">
              Upload and manage your learning materials
            </p>
          </div>

          <Button
            onClick={() => setIsUploadModalOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Upload Document
          </Button>

        </div>

        {renderContent()}

      </div>

      {/* ===========================
            Upload Modal
      =========================== */}

      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">

          <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden">

            {/* Header */}

            <div className="flex items-center justify-between px-6 py-5 border-b">

              <div>

                <h2 className="text-2xl font-bold text-slate-900">
                  Upload Document
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  Upload a PDF and let AI generate study material.
                </p>

              </div>

              <button
                onClick={() => {
                  setIsUploadModalOpen(false);
                  setUploadFile(null);
                  setUploadTitle("");
                }}
                className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-red-50 hover:text-red-500 transition flex items-center justify-center"
              >
                <X size={20} />
              </button>

            </div>

            <form
              onSubmit={handleUpload}
              className="p-6 space-y-6"
            >

              {/* Drag Area */}

              <label
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer transition

                ${
                  dragActive
                    ? "border-emerald-500 bg-emerald-50"
                    : "border-slate-300 hover:border-emerald-500 hover:bg-slate-50"
                }`}
              >

                <input
                  hidden
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                />

                <CloudUpload
                  size={60}
                  className="text-emerald-500 mb-4"
                />

                <h3 className="font-semibold text-slate-800">
                  Drag & Drop PDF Here
                </h3>

                <p className="text-sm text-slate-500 mt-2">
                  or click to browse
                </p>

              </label>

              {/* Selected File */}

              {uploadFile && (

                <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 flex items-center gap-4">

                  <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center text-white">

                    <File size={24} />

                  </div>

                  <div className="flex-1">

                    <p className="font-semibold text-slate-800">
                      {uploadFile.name}
                    </p>

                    <p className="text-sm text-slate-500">
                      {formatFileSize(uploadFile.size)}
                    </p>

                  </div>

                </div>

              )}

              {/* Title */}

              <div>

                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Document Title
                </label>

                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="Enter document title"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                />

              </div>

              <div className="flex justify-end gap-3">

                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  disabled={uploading}
                >
                  {uploading ? "Uploading..." : "Upload Document"}
                </Button>

              </div>

            </form>

          </div>

        </div>
      )}

            {/* ===========================
            Delete Modal
      =========================== */}

      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">

          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">

            <div className="p-8 text-center">

              <div className="mx-auto w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mb-6">
                <Trash2
                  className="w-10 h-10 text-red-500"
                  strokeWidth={2}
                />
              </div>

              <h2 className="text-2xl font-bold text-slate-900">
                Delete Document?
              </h2>

              <p className="mt-3 text-slate-500">
                This action cannot be undone.
              </p>

              {selectedDoc && (
                <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">

                  <div className="flex items-center gap-3">

                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-400 flex items-center justify-center text-white">
                      <FileText size={22} />
                    </div>

                    <div className="text-left flex-1">

                      <h4 className="font-semibold text-slate-900">
                        {selectedDoc.title}
                      </h4>

                      <p className="text-xs text-slate-500">
                        This document and all related flashcards &
                        quizzes will be removed.
                      </p>

                    </div>

                  </div>

                </div>
              )}

              <div className="flex gap-3 mt-8">

                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setSelectedDoc(null);
                  }}
                >
                  Cancel
                </Button>

                <Button
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                  onClick={handleConfirmDelete}
                  disabled={deleting}
                >
                  {deleting ? (
                    <>
                      <Spinner />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2
                        size={18}
                        className="mr-2"
                      />
                      Delete
                    </>
                  )}
                </Button>

              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
};

export default DocumentListPage;