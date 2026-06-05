"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { aiApi } from "@/lib/api";
import { MessageSquare, Send, BookOpen, Sparkles, FileText, Bot, User } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: { article: string; extrait: string }[];
  confiance?: number;
}

export default function ChatbotRAGPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Bonjour, je suis l'assistant juridique SmartAcademicFlow. Je peux repondre a vos questions sur le reglement interieur en citant les articles de reference.", sources: [] },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const suggestedQuestions = [
    "Que dit l'Article 39 sur les absences injustifiees ?",
    "Quelles sont les regles de rachat de notes ?",
    "Comment fonctionne la deliberation ?",
    "Quels justificatifs sont acceptes pour une absence ?",
  ];

  const handleSend = async (question?: string) => {
    const q = question || input;
    if (!q.trim()) return;
    setMessages((prev) => [...prev, { role: "user", content: q }]);
    setInput("");
    setLoading(true);
    try {
      const response = await aiApi.post("/api/rag/query", { question: q });
      const data = response.data;
      setMessages((prev) => [...prev, { role: "assistant", content: data.reponse, sources: data.sources, confiance: data.confiance }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Desole, une erreur est survenue. Veuillez reessayer." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
            <MessageSquare size={20} className="text-orange-600" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-slate-900 text-xl font-bold">Assistant Juridique RAG</h1>
            <p className="text-slate-500 text-xs">Interrogez le reglement interieur en langage naturel</p>
          </div>
        </div>

        <div className="card p-0 overflow-hidden flex flex-col" style={{ height: "calc(100vh - 220px)" }}>
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
                    <Bot size={16} className="text-orange-600" strokeWidth={1.5} />
                  </div>
                )}
                <div className={`max-w-[75%]`}>
                  <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${msg.role === "user" ? "text-white ml-auto" : "bg-slate-50 text-slate-700 border border-slate-100"}`} style={msg.role === "user" ? { background: "linear-gradient(135deg, #ee2927, #ff8848)" } : undefined}>
                    {msg.content}
                  </div>
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {msg.sources.map((source, sIdx) => (
                        <div key={sIdx} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-orange-50 border border-orange-100">
                          <FileText size={11} className="text-orange-500" strokeWidth={2} />
                          <span className="text-orange-700 text-[11px] font-medium">{source.article}</span>
                        </div>
                      ))}
                      {msg.confiance !== undefined && (
                        <div className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg bg-emerald-50 border border-emerald-100">
                          <Sparkles size={10} className="text-emerald-500" strokeWidth={2} />
                          <span className="text-emerald-700 text-[10px] font-medium">Confiance: {Math.round(msg.confiance * 100)}%</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {msg.role === "user" && (
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, #ee2927, #ff8848)" }}>
                    <User size={16} className="text-white" strokeWidth={1.5} />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
                  <Bot size={16} className="text-orange-600" strokeWidth={1.5} />
                </div>
                <div className="px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" />
                    <div className="w-2 h-2 rounded-full bg-slate-300 animate-bounce [animation-delay:0.15s]" />
                    <div className="w-2 h-2 rounded-full bg-slate-300 animate-bounce [animation-delay:0.3s]" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {messages.length <= 1 && (
            <div className="px-6 pb-4">
              <p className="text-slate-400 text-[11px] font-medium mb-2 flex items-center gap-1">
                <BookOpen size={11} strokeWidth={1.5} />Questions suggerees
              </p>
              <div className="flex flex-wrap gap-2">
                {suggestedQuestions.map((q, idx) => (
                  <button key={idx} onClick={() => handleSend(q)} className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-orange-50 hover:text-orange-700 text-slate-600 text-xs transition-colors">
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="p-4 border-t border-slate-100">
            <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex items-center gap-3">
              <input type="text" value={input} onChange={(e) => setInput(e.target.value)} className="input-field flex-1" placeholder="Posez votre question sur le reglement..." disabled={loading} />
              <button type="submit" disabled={loading || !input.trim()} className="btn-primary px-4">
                <Send size={16} strokeWidth={1.5} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
