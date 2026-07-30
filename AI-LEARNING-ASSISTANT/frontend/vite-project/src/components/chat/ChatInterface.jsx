import React, { useState, useEffect, useRef } from "react";
import { Send, MessageSquare, Sparkles } from "lucide-react";
import { useParams } from "react-router-dom";
import aiService from "../../services/aiService";
import { useAuth } from "../../context/AuthContext";
import Spinner from "../common/Spinner";
import MarkdownRenderer from "../common/MarkdownRenderer";

const ChatInterface = () => {
  const { id: documentId } = useParams();
  const { user } = useAuth();

  const [history, setHistory] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const messageEndRef = useRef(null);

  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  };

  useEffect(() => {
    const fetchChatHistory = async () => {
      try {
        setInitialLoading(true);

        const response = await aiService.getChatHistory(documentId);

        setHistory(
          response.data.map((msg) => ({
            ...msg,
            source: msg.source || "document",
          })),
        );
      } catch (error) {
        console.error("Failed to fetch chat history:", error);
      } finally {
        setInitialLoading(false);
      }
    };

    fetchChatHistory();
  }, [documentId]);

  useEffect(() => {
    scrollToBottom();
  }, [history]);

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!message.trim()) return;

    const userMessage = {
      role: "user",
      content: message,
      timestamp: new Date(),
    };

    setHistory((prev) => [...prev, userMessage]);
    setMessage("");
    setLoading(true);

    try {
      const response = await aiService.chat(documentId, userMessage.content);

      const assistantMessage = {
        role: "assistant",
        content: response.data.answer,
        source: response.data.source, // NEW
        timestamp: new Date(),
        relevantChunks: response.data.relevantChunks || [],
      };

      setHistory((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat error:", error);

      const errorMessage = {
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      };

      setHistory((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = (msg, index) => {
    const isUser = msg.role === "user";
    return (
      <div
        key={index}
        className={`flex items-start gap-3 my-4 ${isUser ? "justify-end" : ""}`}
      >
        {!isUser && (
          <div className="w-9 h-9 rounded-xl bg-linear-to-br from-emerald-400 to-teal-500 shadow-lg shadow-emerald-500/25 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-white" strokeWidth={2} />
          </div>
        )}
        <div
          className={`max-w-lg p-4 rounded-2xl shadow-sm ${
            isUser
              ? "bg-linear-to-br from-emerald-500 to-teal-500 text-white rounded-br-md"
              : "bg-white border border-slate-200/60 text-slate-800 rounded-bl-md"
          }`}
        >
          {isUser ? (
            <p className="text-sm leading-relaxed">{msg.content}</p>
          ) : (
            <>
              {/* Source Badge */}

              {msg.source === "document" && (
                <div className="mb-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                  📄 Answer from Uploaded Document
                </div>
              )}

              {msg.source === "general" && (
                <div className="mb-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
                  🤖 Answer from General AI Knowledge
                </div>
              )}

              <div className="prose prose-sm max-w-none prose-slate">
                <MarkdownRenderer content={msg.content} />
              </div>
            </>
          )}
        </div>
        {isUser && (
          <div className="w-9 h-9 rounded-xl bg-linear-to-br from-slate-200 to-slate-300 flex items-center justify-center text-slate-700 font-semibold text-sm shrink-0 shadow-sm">
            {user?.username?.charAt(0)?.toUpperCase() || "U"}
          </div>
        )}
      </div>
    );
  };

  if (initialLoading) {
    return (
      <div className="flex flex-col h-[70vh] bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-2xl items-center justify-center shadow-xl shadow-slate-200/50">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center mb-4">
          <MessageSquare className="w-7 h-7 text-emerald-600" strokeWidth={2} />
        </div>

        <Spinner />

        <p className="text-sm text-slate-500 mt-3 font-medium">
          Loading chat history...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[70vh] bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-2xl shadow-xl shadow-slate-200/50 overflow-hidden">
      {/* Message Area */}

      <div className="flex-1 p-6 overflow-y-auto bg-gradient-to-br from-slate-50/50 via-white/50 to-slate-50/50">
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/10">
              <MessageSquare className="w-8 h-8" strokeWidth={2} />
            </div>

            <h3 className="text-base font-semibold text-slate-900 mb-2">
              Start a Conversation
            </h3>

            <p className="text-sm text-slate-500">
              Ask me anything about the document!
            </p>
          </div>
        ) : (
          history.map(renderMessage)
        )}

        <div ref={messageEndRef} />

        {loading && (
          <div className="flex items-center gap-3 my-4">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg shadow-emerald-500/25 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-white" strokeWidth={2} />
            </div>

            <div className="flex items-center gap-2 px-4 py-3 rounded-2xl rounded-bl-md bg-white border border-slate-200/60">
              <div className="flex gap-1">
                <span
                  className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0ms" }}
                />
                <span
                  className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                  style={{ animationDelay: "150ms" }}
                />
                <span
                  className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}

      <div className="p-5 border-t border-slate-200/60 bg-white/80">
        <form onSubmit={handleSendMessage} className="flex items-center gap-3">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask a follow-up question..."
            className="flex-1 h-12 px-4 border-2 border-slate-200 rounded-xl bg-slate-50/50 text-slate-900 placeholder-slate-400 text-sm font-medium transition-all duration-200 focus:outline-none focus:border-emerald-500 focus:bg-white focus:shadow-lg focus:shadow-emerald-500/30"
            disabled={loading}
          />

          <button
            type="submit"
            disabled={loading || !message.trim()}
            className="shrink-0 w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl transition-all duration-200 shadow-lg shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 flex items-center justify-center"
          >
            <Send className="w-5 h-5" strokeWidth={2} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;
