import { useState, useRef, useEffect, memo, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    MessageCircle,
    X,
    Send,
    Bot,
    User,
    Loader2,
    ExternalLink,
    Compass,
    HelpCircle,
    ShieldCheck,
    Award,
    Minus,
    Maximize2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { API_CONFIG } from "@/config/api";
import { api } from "@/lib/api";
import "./chat-widget.css";

import { useAuth } from "@/hooks/useAuth";

const TRUST_AGENT_CHAT_URL = API_CONFIG.TRUST_AGENT_PROXY.CHAT;

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    sources?: { title: string; url: string }[];
}

const MemoizedMarkdown = memo(ReactMarkdown);

const QUICK_ACTIONS = [
    {
        id: 'onboarding',
        label: 'Getting Started',
        icon: Compass,
        action: 'start_onboarding',
        description: 'Step-by-step walkthrough of the platform.',
    },
    {
        id: 'issuance',
        label: 'Issue a Certificate',
        icon: Award,
        action: 'go_to_issuance',
        description: 'How to issue your first verifiable credential.',
    },
    {
        id: 'governance',
        label: 'Governance & Trust',
        icon: ShieldCheck,
        action: 'explain_governance',
        description: 'Institution approval and voting explained.',
    },
];

export function ChatWidget() {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [assistantOnline, setAssistantOnline] = useState<boolean | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();

    // Set welcome message when user changes
    useEffect(() => {
        const name = user?.name || "there";
        setMessages([{
            id: "welcome",
            role: "assistant",
            content: `Hi ${name}, I'm the EduCreds Assistant.\n\nI can help you issue credentials, understand governance, navigate the dashboard, or answer questions about the platform.\n\nWhat would you like to do?`,
        }]);
    }, [user?.name]);

    // Auto-scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    // Probe trust-agent availability
    useEffect(() => {
        let cancelled = false;
        api.trustAgentHealth()
            .then(() => { if (!cancelled) setAssistantOnline(true); })
            .catch(() => { if (!cancelled) setAssistantOnline(false); });
        return () => { cancelled = true; };
    }, []);

    const sendMessage = useCallback(async (text: string) => {
        const trimmed = text.trim();
        if (!trimmed || isLoading) return;

        const userMsg: Message = { id: Date.now().toString(), role: "user", content: trimmed };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setIsLoading(true);

        const assistantId = (Date.now() + 1).toString();
        setMessages(prev => [...prev, { id: assistantId, role: "assistant", content: "" }]);

        try {
            const response = await fetch(TRUST_AGENT_CHAT_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: trimmed }),
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const data = await response.json();
            setMessages(prev => prev.map(m =>
                m.id === assistantId
                    ? { ...m, content: data.response || "", sources: data.sources || [] }
                    : m
            ));
        } catch {
            setMessages(prev => prev.map(m =>
                m.id === assistantId
                    ? { ...m, content: "I'm having trouble connecting right now. Please try again in a moment." }
                    : m
            ));
        } finally {
            setIsLoading(false);
        }
    }, [isLoading]);

    const handleAction = useCallback((action: string, label: string) => {
        if (action === 'start_onboarding') {
            window.dispatchEvent(new CustomEvent('startOnboarding'));
            setIsOpen(false);
            toast({ title: "Guided tour started", description: "Follow the steps to get set up." });
        } else {
            sendMessage(`Tell me about: ${label}`);
        }
    }, [sendMessage, toast]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        sendMessage(input);
    };

    const onlineLabel = assistantOnline === true
        ? "Online" : assistantOnline === false
        ? "Offline" : "Connecting…";

    const onlineDot = assistantOnline === true
        ? "bg-emerald-500" : assistantOnline === false
        ? "bg-neutral-400" : "bg-amber-400";

    return (
        <div className="fixed z-[100] bottom-5 right-5 sm:bottom-6 sm:right-6 flex flex-col items-end gap-3 font-sans">

            {/* ── Chat panel ── */}
            {isOpen && (
                <div className={cn(
                    "w-[calc(100vw-2.5rem)] sm:w-[420px] rounded-[28px] shadow-2xl border border-[--border] flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-200",
                    isMinimized ? "max-h-[68px]" : "max-h-[80vh] sm:max-h-[640px]"
                )} style={{ background: "var(--card, #ffffff)", isolation: "isolate" }}>
                    {/* Header */}
                    <div className="px-5 py-4 flex items-center justify-between border-b border-[--border]" style={{ background: "var(--card, #ffffff)" }}>
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <Bot className="w-5 h-5 text-primary" />
                                </div>
                                <span className={cn("absolute -bottom-0.5 -right-0.5 block h-3 w-3 rounded-full border-2 border-[--card]", onlineDot)} />
                            </div>
                            <div>
                                <h3 className="font-black text-sm text-[--foreground] tracking-tight leading-none mb-0.5">
                                    EduCreds Assistant
                                </h3>
                                <p className="text-[10px] font-bold text-[--muted-foreground] uppercase tracking-widest">
                                    {onlineLabel}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost" size="icon"
                                className="h-8 w-8 rounded-xl text-[--muted-foreground] hover:text-[--foreground]"
                                onClick={() => setIsMinimized(v => !v)}
                            >
                                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
                            </Button>
                            <Button
                                variant="ghost" size="icon"
                                className="h-8 w-8 rounded-xl text-[--muted-foreground] hover:text-[--foreground]"
                                onClick={() => setIsOpen(false)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {!isMinimized && (
                        <>
                            {/* Messages */}
                            <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-5 py-6 space-y-5 bg-[--muted]/20">
                                {messages.map(msg => (
                                    <div key={msg.id} className={cn("flex items-start gap-3", msg.role === "user" ? "flex-row-reverse" : "flex-row")}>
                                        {/* Avatar */}
                                        {msg.role === "assistant" ? (
                                            <div className="h-8 w-8 rounded-xl bg-[--card] border border-[--border] shadow-sm flex items-center justify-center shrink-0">
                                                <Bot className="h-4 w-4 text-primary" />
                                            </div>
                                        ) : (
                                            <div className="h-8 w-8 rounded-xl bg-primary flex items-center justify-center shrink-0">
                                                <User className="h-4 w-4 text-white" />
                                            </div>
                                        )}

                                        {/* Bubble */}
                                        <div className={cn(
                                            "max-w-[82%] rounded-[18px] px-4 py-3 text-sm shadow-sm",
                                            msg.role === "user"
                                                ? "bg-[--foreground] text-[--background] rounded-tr-sm"
                                                : "bg-[--card] text-[--foreground] border border-[--border] rounded-tl-sm"
                                        )}>
                                            <div className="prose prose-sm max-w-none break-words leading-relaxed">
                                                <MemoizedMarkdown remarkPlugins={[remarkGfm]}>
                                                    {msg.content}
                                                </MemoizedMarkdown>
                                            </div>

                                            {/* Quick actions on welcome message */}
                                            {msg.role === "assistant" && msg.id === "welcome" && (
                                                <div className="mt-4 space-y-2">
                                                    <p className="text-[10px] font-black text-[--muted-foreground] uppercase tracking-widest mb-3">
                                                        Quick actions
                                                    </p>
                                                    {QUICK_ACTIONS.map(action => (
                                                        <button
                                                            key={action.id}
                                                            onClick={() => handleAction(action.action, action.label)}
                                                            className="w-full flex items-center gap-3 p-3 rounded-[14px] bg-[--muted]/60 border border-[--border] hover:border-primary/30 hover:bg-[--card] transition-all text-left"
                                                        >
                                                            <div className="size-8 rounded-lg bg-[--card] border border-[--border] flex items-center justify-center shrink-0">
                                                                <action.icon className="size-4 text-primary" />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-xs font-black text-[--foreground] tracking-tight">{action.label}</p>
                                                                <p className="text-[10px] text-[--muted-foreground] truncate">{action.description}</p>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Sources */}
                                            {msg.sources && msg.sources.length > 0 && (
                                                <div className="mt-3 pt-3 border-t border-[--border]">
                                                    <p className="text-[10px] font-black text-[--muted-foreground] uppercase tracking-widest mb-2">Sources</p>
                                                    <div className="space-y-1">
                                                        {msg.sources.map((src, idx) => (
                                                            <a key={idx} href={src.url} target="_blank" rel="noopener noreferrer"
                                                                className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">
                                                                <ExternalLink className="h-3 w-3 shrink-0" />
                                                                <span className="line-clamp-1">{src.title || src.url}</span>
                                                            </a>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {/* Typing indicator */}
                                {isLoading && (
                                    <div className="flex items-start gap-3">
                                        <div className="h-8 w-8 rounded-xl bg-[--card] border border-[--border] shadow-sm flex items-center justify-center shrink-0">
                                            <Bot className="h-4 w-4 text-primary" />
                                        </div>
                                        <div className="bg-[--card] border border-[--border] rounded-[18px] rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                            <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                            <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Input */}
                            <div className="p-4 border-t border-[--border]" style={{ background: "var(--card, #ffffff)" }}>
                                <form onSubmit={handleSubmit} className="flex gap-2 items-center">
                                    <div className="flex-1 relative">
                                        <Input
                                            value={input}
                                            onChange={e => setInput(e.target.value)}
                                            placeholder="Ask anything about EduCreds…"
                                            className="h-12 rounded-2xl bg-[--muted] border-none shadow-inner pl-4 pr-10 text-sm"
                                            disabled={isLoading}
                                        />
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                            <HelpCircle className="size-4 text-[--muted-foreground]/40" />
                                        </div>
                                    </div>
                                    <Button
                                        type="submit" size="icon"
                                        className="h-12 w-12 rounded-2xl bg-primary hover:bg-primary/90 text-white shadow-lg shrink-0"
                                        disabled={isLoading || !input.trim()}
                                    >
                                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                    </Button>
                                </form>
                                <p className="text-center text-[10px] text-[--muted-foreground] mt-2.5 uppercase tracking-widest font-bold">
                                    Powered by EduCreds Trust Agent
                                </p>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* ── Launcher button — standard professional size ── */}
            <Button
                onClick={() => { setIsOpen(v => !v); setIsMinimized(false); }}
                size="icon"
                className={cn(
                    "relative h-14 w-14 rounded-2xl shadow-2xl transition-all duration-200 hover:scale-105 active:scale-95",
                    isOpen
                        ? "bg-[--foreground] text-[--background] hover:bg-[--foreground]/90"
                        : "bg-primary hover:bg-primary/90 text-white"
                )}
            >
                {isOpen
                    ? <X className="h-5 w-5" />
                    : <MessageCircle className="h-6 w-6" />
                }
                {/* Unread dot (shows when closed) */}
                {!isOpen && assistantOnline === true && (
                    <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-white" />
                )}
            </Button>
        </div>
    );
}
