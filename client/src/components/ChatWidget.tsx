import { useState, useRef, useEffect, memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
    MessageCircle, 
    X, 
    Send, 
    Bot, 
    User, 
    Loader2, 
    ExternalLink, 
    Sparkles, 
    Zap, 
    Compass, 
    HelpCircle,
    LayoutDashboard,
    ShieldCheck,
    Award
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import "./chat-widget.css";

import { useAuth } from "@/hooks/useAuth";

const TRUST_AGENT_BASE = (import.meta.env.VITE_TRUST_AGENT_BASE ?? "").replace(/\/$/, "");

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
        label: 'Start Guided Tour', 
        icon: Compass, 
        action: 'start_onboarding',
        description: 'Get a step-by-step walkthrough of the platform features.'
    },
    { 
        id: 'issuance', 
        label: 'Issue Certificate', 
        icon: Award, 
        action: 'go_to_issuance',
        description: 'Learn how to issue your first blockchain-verified certificate.'
    },
    { 
        id: 'governance', 
        label: 'Governance Info', 
        icon: ShieldCheck, 
        action: 'explain_governance',
        description: 'Understand how decentralized approval and voting works.'
    }
];

export function ChatWidget() {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    
    // Initial messages state is empty, we populate it in useEffect when user changes
    const [messages, setMessages] = useState<Message[]>([]);

    useEffect(() => {
        const welcomeName = user?.name || "Institution";
        setMessages([
            {
                id: "welcome",
                role: "assistant",
                content: `Welcome to **EduCreds**, ${welcomeName}. I'm your dedicated **Institutional Assistant**.\n\nI'm here to ensure your onboarding is seamless and to help you navigate our decentralized infrastructure. Whether you need to set up your profile, manage templates, or understand governance, I have the answers.\n\nHow can I help you excel today?`
            }
        ]);
    }, [user?.name]);
    const scrollRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    const handleStreamingSubmit = async (e?: React.FormEvent, customInput?: string) => {
        if (e) e.preventDefault();
        const finalInput = customInput || input;
        if (!finalInput.trim() || isLoading) return;

        const userMessage: Message = { id: Date.now().toString(), role: "user", content: finalInput };
        setMessages(prev => [...prev, userMessage]);
        if (!customInput) setInput("");
        setIsLoading(true);

        const assistantMessageId = (Date.now() + 1).toString();
        setMessages(prev => [...prev, { id: assistantMessageId, role: "assistant", content: "" }]);

        try {
            const response = await fetch(`${TRUST_AGENT_BASE}/api/trust-agent/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: finalInput })
            });

            if (!response.ok) {
                throw new Error(`Chat request failed: ${response.status}`);
            }

            const data = await response.json();
            const content = data.response || "";
            const sources = data.sources || [];

            setMessages(prev => prev.map(msg =>
                msg.id === assistantMessageId ? { ...msg, content, sources } : msg
            ));
        } catch (error) {
            console.error("Chat streaming error:", error);
            toast({
                title: "Assistant Connectivity",
                description: "I'm having trouble reaching the main protocol. Retrying...",
                variant: "destructive"
            });
            setMessages(prev => prev.map(msg =>
                msg.id === assistantMessageId
                    ? { ...msg, content: "I apologize, but I've lost connection to the EduCreds network. Please try again in a moment." }
                    : msg
            ));
        } finally {
            setIsLoading(false);
        }
    };

    const handleAction = (action: string, label: string) => {
        if (action === 'start_onboarding') {
            window.dispatchEvent(new CustomEvent('startOnboarding'));
            setIsOpen(false);
            toast({
                title: "Protocol Initialized",
                description: "Launching the EduCreds Guided Onboarding Tour.",
            });
        } else {
            handleStreamingSubmit(undefined, `Tell me about: ${label}`);
        }
    };

    return (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[100] flex flex-col items-end space-y-3 font-sans">
            {isOpen && (
                <div className="w-[calc(100vw-2rem)] sm:w-[480px] max-h-[85vh] sm:max-h-[700px] bg-white dark:bg-neutral-900 rounded-[32px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] border border-neutral-200 dark:border-neutral-800 flex flex-col overflow-hidden animate-in slide-in-from-bottom-8 fade-in duration-500 ease-out">
                    {/* Header */}
                    <div className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl px-6 py-5 flex justify-between items-center border-b border-neutral-100 dark:border-neutral-800 relative z-10">
                        <div className="flex items-center space-x-4">
                            <div className="relative">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary via-indigo-500 to-purple-600 flex items-center justify-center overflow-hidden shadow-lg shadow-primary/20">
                                    <Bot className="w-7 h-7 text-white" />
                                </div>
                                <span className="absolute -bottom-1 -right-1 block h-4 w-4 rounded-full bg-emerald-500 border-4 border-white dark:border-neutral-900 shadow-sm" />
                            </div>
                            <div>
                                <h3 className="font-black text-lg text-neutral-900 dark:text-neutral-100 tracking-tight flex items-center gap-2">
                                    EduCreds Assistant
                                    <Badge className="bg-primary/10 text-primary border-none text-[10px] px-1.5 py-0 font-black uppercase tracking-widest">Protocol v2</Badge>
                                </h3>
                                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 flex items-center gap-1.5">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                    </span>
                                    Authority Synchronized
                                </p>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 h-10 w-10 rounded-xl transition-all" onClick={() => setIsOpen(false)}>
                            <X className="h-6 w-6" />
                        </Button>
                    </div>

                    {/* Messages Area */}
                    <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-6 py-8 space-y-8 bg-neutral-50/50 dark:bg-neutral-950/50">
                        {messages.map((msg) => (
                            <div key={msg.id} className={cn("flex items-start gap-4", msg.role === "user" ? "flex-row-reverse" : "flex-row")}>
                                {msg.role === "assistant" ? (
                                    <div className="h-10 w-10 rounded-xl bg-white dark:bg-neutral-800 shadow-md flex items-center justify-center flex-shrink-0 border border-neutral-100 dark:border-neutral-700">
                                        <Bot className="h-6 w-6 text-primary" />
                                    </div>
                                ) : (
                                    <div className="h-10 w-10 rounded-xl bg-primary shadow-lg shadow-primary/20 flex items-center justify-center flex-shrink-0">
                                        <User className="h-6 w-6 text-white" />
                                    </div>
                                )}
                                <div className={cn(
                                    "max-w-[85%] rounded-[24px] px-5 py-4 shadow-sm relative group transition-all",
                                    msg.role === "user" 
                                        ? "bg-neutral-900 text-white rounded-tr-none" 
                                        : "bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-100 rounded-tl-none border border-neutral-100 dark:border-neutral-700"
                                )}>
                                    <div className="prose prose-sm dark:prose-invert max-w-none break-words font-medium leading-relaxed">
                                        <MemoizedMarkdown remarkPlugins={[remarkGfm]}>
                                            {msg.content}
                                        </MemoizedMarkdown>
                                    </div>
                                    
                                    {msg.role === "assistant" && msg.id === "welcome" && (
                                        <div className="mt-6 space-y-3">
                                            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-4">Institutional Quick Actions</p>
                                            <div className="grid grid-cols-1 gap-3">
                                                {QUICK_ACTIONS.map((action) => (
                                                    <button
                                                        key={action.id}
                                                        onClick={() => handleAction(action.action, action.label)}
                                                        className="flex items-center gap-4 p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 hover:border-primary/30 hover:bg-white dark:hover:bg-neutral-800 transition-all text-left group/btn"
                                                    >
                                                        <div className="size-10 rounded-xl bg-white dark:bg-neutral-800 shadow-sm flex items-center justify-center text-primary group-hover/btn:scale-110 transition-transform">
                                                            <action.icon className="size-5" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs font-black text-neutral-900 dark:text-neutral-100 uppercase tracking-tight">{action.label}</p>
                                                            <p className="text-[10px] text-neutral-500 font-medium truncate">{action.description}</p>
                                                        </div>
                                                        <Zap className="size-4 text-neutral-300 group-hover/btn:text-primary transition-colors" />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {msg.sources && msg.sources.length > 0 && (
                                        <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-700/50">
                                            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-3 flex items-center">
                                                <Sparkles className="w-3.5 h-3.5 mr-2 text-primary"/>
                                                Protocol Knowledge Base
                                            </p>
                                            <div className="flex flex-col space-y-2">
                                                {msg.sources.map((source, idx) => (
                                                    <a key={idx} href={source.url} target="_blank" rel="noopener noreferrer" className="text-xs font-bold flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:opacity-70 transition-opacity" title={source.title || source.url}>
                                                        <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
                                                        <span className="line-clamp-1">{source.title || source.url}</span>
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {isLoading && messages[messages.length-1]?.role !== 'assistant' && (
                             <div className="flex items-start gap-4 justify-start">
                                <div className="h-10 w-10 rounded-xl bg-white dark:bg-neutral-800 shadow-md flex items-center justify-center flex-shrink-0 border border-neutral-100 dark:border-neutral-700">
                                    <Bot className="h-6 w-6 text-primary" />
                                </div>
                                <div className="bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-100 border border-neutral-100 dark:border-neutral-700 rounded-[24px] rounded-tl-none px-5 py-4 shadow-sm flex items-center space-x-3">
                                    <div className="flex space-x-1">
                                        <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                                        <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
                                        <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
                                    </div>
                                    <span className="text-xs font-black uppercase tracking-widest text-neutral-400">Processing...</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input Area */}
                    <div className="p-6 bg-white dark:bg-neutral-900 border-t border-neutral-100 dark:border-neutral-800">
                        <form onSubmit={(e) => handleStreamingSubmit(e)} className="flex gap-3 items-center">
                            <div className="flex-1 relative">
                                <Input
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Ask about protocol operations..."
                                    className="h-14 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border-none shadow-inner pl-6 pr-12 text-sm font-medium focus-visible:ring-primary/20"
                                    disabled={isLoading}
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                    <HelpCircle className="size-5 text-neutral-300" />
                                </div>
                            </div>
                            <Button type="submit" size="icon" className="h-14 w-14 bg-neutral-900 hover:bg-black text-white rounded-2xl shadow-xl shadow-neutral-900/20 transition-all flex-shrink-0" disabled={isLoading || !input.trim()}>
                                <Send className="h-5 w-5" />
                            </Button>
                        </form>
                         <div className="flex items-center justify-center gap-2 mt-4 opacity-40">
                            <ShieldCheck className="size-3" />
                            <p className="text-[10px] font-black uppercase tracking-widest">
                                Institutional Grade AI Support
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Floating Button */}
            <div className="relative group">
                <div className="absolute -inset-4 bg-primary/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <Button onClick={() => setIsOpen(!isOpen)} size="icon" className="relative rounded-[24px] h-20 w-20 shadow-2xl bg-neutral-900 hover:bg-black text-white transition-all duration-500 hover:scale-105 active:scale-95 z-10 flex flex-col items-center justify-center gap-1">
                    {isOpen ? <X className="h-8 w-8" /> : (
                        <>
                            <div className="relative">
                                <Bot className="h-9 w-9" />
                                <span className="absolute -top-1 -right-1 h-3 w-3 bg-primary rounded-full border-2 border-neutral-900" />
                            </div>
                            <span className="text-[8px] font-black uppercase tracking-widest">Assistant</span>
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
