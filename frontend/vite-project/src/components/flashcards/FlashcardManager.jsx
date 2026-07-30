import React, { useState, useEffect } from "react";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Trash2,
  ArrowLeft,
  Sparkles,
  Brain,
} from "lucide-react";
import toast from "react-hot-toast";
import moment from "moment";

import flashcardService from "../../services/flashcardService";
import aiService from "../../services/aiService";
import Spinner from "../common/Spinner";
import Modal from "../common/Modal";
import Flashcard from "./Flashcard";

const FlashcardManager = ({ documentId }) => {
  const [flashcardSets, setFlashcardSets] = useState([]);
  const [selectedSet, setSelectedSet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [setToDelete, setSetToDelete] = useState(null);

  // =============================
  // Fetch Flashcard Sets
  // =============================
  const fetchFlashcardSets = async () => {
    setLoading(true);

    try {
      const sets =
        await flashcardService.getFlashcardForDocument(documentId);

      const safeSets = Array.isArray(sets) ? sets : [];
      setFlashcardSets(safeSets);

      if (selectedSet) {
        const updatedSet = safeSets.find(
          (s) => s._id === selectedSet._id
        );
        setSelectedSet(updatedSet ? { ...updatedSet } : (safeSets[0] ? { ...safeSets[0] } : null));
        setCurrentCardIndex(0);
      } else if (safeSets.length === 1) {
        setSelectedSet({ ...safeSets[0] });
        setCurrentCardIndex(0);
      }
    } catch (error) {
      console.error(error);

      toast.error(error.message || "Failed to fetch flashcard sets.");
      setFlashcardSets([]);
    } finally {
      setLoading(false);
    }
  };

  // =============================
  // Load Flashcards
  // =============================
  useEffect(() => {
    if (documentId) {
      fetchFlashcardSets();
    }
  }, [documentId]);

  useEffect(() => {
    if (!selectedSet) return;

    const card = selectedSet.cards[currentCardIndex];

    if (!card?._id) return;

    const reviewCard = async () => {
      try {
        await flashcardService.reviewFlashcard(card._id);
      } catch (error) {
        console.error(error);
      }
    };

    reviewCard();
  }, [currentCardIndex]);

  // =============================
  // Generate Flashcards
  // =============================
  const handleGenerateFlashcards = async () => {
    try {
      setGenerating(true);

      const createdSet = await aiService.generateFlashcards(documentId);

      toast.success("Flashcards generated successfully.");

      if (createdSet && createdSet._id) {
        setCurrentCardIndex(0);
        setSelectedSet(
          createdSet.cards ? { ...createdSet } : null
        );
      }

      await fetchFlashcardSets();
    } catch (error) {
      toast.error(error.message || "Failed to generate flashcards.");
    } finally {
      setGenerating(false);
    }
  };

  // =============================
  // Next Card
  // =============================
  const handleNextCard = () => {
    if (!selectedSet || !Array.isArray(selectedSet.cards) || selectedSet.cards.length === 0) return;

    setCurrentCardIndex((prev) => {
      const next = (prev + 1) % selectedSet.cards.length;
      return next;
    });
  };

  const handlePrevCard = () => {
    if (!selectedSet || !Array.isArray(selectedSet.cards) || selectedSet.cards.length === 0) return;

    setCurrentCardIndex((prev) => {
      return (prev - 1 + selectedSet.cards.length) % selectedSet.cards.length;
    });
  };

  // =============================
  // Review Flashcard
  // =============================

  // =============================
  // Toggle Star
  // =============================
  const handleToggleStar = async (cardId) => {
    try {
      await flashcardService.toggleStar(cardId);

      const updatedSets = flashcardSets.map((set) => {
        if (set._id !== selectedSet._id) return set;

        return {
          ...set,
          cards: set.cards.map((card) =>
            card._id === cardId
              ? {
                  ...card,
                  isStarred: !card.isStarred,
                }
              : card,
          ),
        };
      });

      setFlashcardSets(updatedSets);

      const updatedSelectedSet = updatedSets.find(
        (set) => set._id === selectedSet._id,
      );

      setSelectedSet(updatedSelectedSet);

      toast.success("Flashcard updated successfully.");
    } catch (error) {
      console.error(error);

      toast.error(error.message || "Failed to update flashcard.");
    }
  };

  // =============================
  // Select Flashcard Set
  // =============================
  const handleSelectSet = (set) => {
    setCurrentCardIndex(0);
    setSelectedSet({ ...set });
  };

  // =============================
  // Delete Request
  // =============================
  const handleDeleteRequest = (e, set) => {
    e.stopPropagation();

    setSetToDelete(set);
    setIsDeleteModalOpen(true);
  };

  // =============================
  // Confirm Delete
  // =============================
  const handleConfirmDelete = async () => {
    if (!setToDelete) return;

    try {
      setDeleting(true);

      await flashcardService.deleteFlashcardSet(setToDelete._id);

      toast.success("Flashcard set deleted successfully.");

      const updatedSets = flashcardSets.filter(
        (set) => set._id !== setToDelete._id,
      );

      setFlashcardSets(updatedSets);

      if (selectedSet?._id === setToDelete._id) {
        setSelectedSet(null);
        setCurrentCardIndex(0);
      }

      setIsDeleteModalOpen(false);
      setSetToDelete(null);
    } catch (error) {
      console.error(error);

      toast.error(error.message || "Failed to delete flashcard set.");
    } finally {
      setDeleting(false);
    }
  };

  const renderFlashcardViewer = () => {
    const currentCard = selectedSet?.cards?.[currentCardIndex];

    if (!currentCard) {
      return (
        <div className="flex items-center justify-center py-20">
          <p className="text-slate-500">No flashcards available.</p>
        </div>
      );
    }

    return (
      <div className="space-y-8">
        {/* Back Button */}
        <button
          onClick={() => setSelectedSet(null)}
          className="group inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors duration-200"
        >
          <ArrowLeft
            className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-200"
            strokeWidth={2}
          />
          Back to Sets
        </button>

        {/* Flashcard Display */}
        <div className="flex flex-col items-center space-y-8">
          <div className="w-full max-w-2xl">
            <Flashcard
              flashcard={currentCard}
              onToggleStar={handleToggleStar}
            />
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-6">
            <button
              onClick={handlePrevCard}
              disabled={selectedSet.cards.length <= 1}
              className="group flex items-center gap-2 px-5 h-11 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm rounded-xl transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-slate-100"
            >
              <ChevronLeft
                className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform duration-200"
                strokeWidth={2.5}
              />
              Previous
            </button>

            <div className="px-4 py-2 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-sm font-semibold text-slate-700">
                {currentCardIndex + 1}{" "}
                <span className="text-slate-400 font-normal">of</span>{" "}
                {selectedSet.cards.length}
              </span>
            </div>

            <button
              onClick={handleNextCard}
              disabled={selectedSet.cards.length <= 1}
              className="group flex items-center gap-2 px-5 h-11 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm rounded-xl transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-slate-100"
            >
              Next
              <ChevronRight
                className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200"
                strokeWidth={2.5}
              />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderSetList = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-20">
          <Spinner />
        </div>
      );
    }

    const safeSets = Array.isArray(flashcardSets) ? flashcardSets : [];

    if (safeSets.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16 px-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 mb-6">
            <Brain className="w-8 h-8 text-emerald-600" strokeWidth={2} />
          </div>

          <h3 className="text-xl font-semibold text-slate-900 mb-2">
            No flashcards yet.
          </h3>

          <p className="text-sm text-slate-500 mb-8 text-center max-w-sm">
            Generate flashcards from your document to start learning and
            reinforce your knowledge.
          </p>

          <button
            onClick={handleGenerateFlashcards}
            disabled={generating}
            className="group inline-flex items-center gap-2 px-6 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold text-sm rounded-xl transition-all duration-200 shadow-lg shadow-emerald-500/25 active:scale-95 disabled:opacity-50"
          >
            {generating ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" strokeWidth={2} />
                Generate Flashcards
              </>
            )}
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                Your Flashcard Sets
              </h3>

              <p className="text-sm text-slate-500 mt-1">
                {safeSets.length}{" "}
                {safeSets.length === 1 ? "set" : "sets"} available
              </p>
            </div>

          <button
            onClick={handleGenerateFlashcards}
            disabled={generating}
            className="group inline-flex items-center gap-2 px-5 h-11 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold text-sm rounded-xl transition-all duration-200 shadow-lg shadow-emerald-500/25 active:scale-95 disabled:opacity-50"
          >
            {generating ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" strokeWidth={2.5} />
                Generate New Set
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {safeSets.map((set) => (
            <div
              key={set?._id || `${set?.documentId || 'set'}-${Math.random()}`}
              onClick={() => handleSelectSet(set)}
              className="group relative bg-white/80 backdrop-blur-xl border-2 border-slate-200 hover:border-emerald-300 rounded-2xl p-6 cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-emerald-500/10"
            >
              <button
                onClick={(e) => handleDeleteRequest(e, set)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-4 h-4" strokeWidth={2} />
              </button>

              <div className="space-y-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100">
                  <Brain className="w-6 h-6 text-emerald-600" strokeWidth={2} />
                </div>

                <div>
                  <h4 className="text-base font-semibold text-slate-900 mb-1">
                    Flashcard Set
                  </h4>

                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Created {moment(set?.createdAt).format("MMM D, YYYY")}
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <span className="text-sm font-semibold text-emerald-700">
                      {(set?.cards?.length || 0)}{" "}
                      {(set?.cards?.length || 0) === 1 ? "card" : "cards"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl shadow-xl shadow-slate-200/50 p-8">
        {selectedSet ? renderFlashcardViewer() : renderSetList()}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          if (!deleting) {
            setIsDeleteModalOpen(false);
            setSetToDelete(null);
          }
        }}
        title="Delete Flashcard Set"
      >
        <div className="space-y-6">
          <p className="text-sm text-slate-600">
            Are you sure you want to delete this flashcard set? This action
            cannot be undone and all cards will be permanently removed.
          </p>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setSetToDelete(null);
              }}
              disabled={deleting}
              className="px-5 h-11 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="px-5 h-11 bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600 text-white font-semibold text-sm rounded-xl transition-all duration-200 shadow-lg shadow-rose-500/25 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deleting ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Deleting...
                </span>
              ) : (
                "Delete Set"
              )}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default FlashcardManager;
