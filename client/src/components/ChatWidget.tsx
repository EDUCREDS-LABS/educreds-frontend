import { useState, useRef, useEffect, memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, X, Send, Bot, User, Loader2, ExternalLink, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import "./chat-widget.css";

const TRUST_AGENT_BASE = (import.meta.env.VITE_TRUST_AGENT_BASE ?? "").replace(/\/$/, "");

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    sources?: { title: string; url: string }[];
}

const MemoizedMarkdown = memo(ReactMarkdown);

export function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "welcome",
            role: "assistant",
            content: "Hi! I'm the EduCreds Trust Agent. I can help with platform features, governance, and technical documentation. How can I assist you today?"
        }
    ]);
    const scrollRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    const handleStreamingSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: Message = { id: Date.now().toString(), role: "user", content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        const assistantMessageId = (Date.now() + 1).toString();
        setMessages(prev => [...prev, { id: assistantMessageId, role: "assistant", content: "" }]);

        try {
            // simple non-streaming call to /chat endpoint
            const response = await fetch(`${TRUST_AGENT_BASE}/api/trust-agent/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: input })
            });

            if (!response.ok) {
                throw new Error(`Chat request failed: ${response.status}`);
            }

            const data = await response.json();
            const content = data.response || "";
            const sources = data.sources || [];

            // update final message content and sources once
            setMessages(prev => prev.map(msg =>
                msg.id === assistantMessageId ? { ...msg, content, sources } : msg
            ));
        } catch (error) {
            console.error("Chat streaming error:", error);
            toast({
                title: "Error",
                description: "Failed to get response from Trust Agent.",
                variant: "destructive"
            });
            setMessages(prev => prev.map(msg =>
                msg.id === assistantMessageId
                    ? { ...msg, content: "Sorry, I encountered an error. Please try again." }
                    : msg
            ));
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[1000] flex flex-col items-end space-y-3 font-sans">
            {isOpen && (
                <div className="w-[calc(100vw-2rem)] sm:w-[440px] max-h-[85vh] sm:max-h-[650px] bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 fade-in-25 duration-300">
                    <div className="bg-white dark:bg-neutral-900 px-4 py-3 flex justify-between items-center border-b border-neutral-200 dark:border-neutral-800">
                        <div className="flex items-center space-x-3">
                            <div className="relative">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
                                    <Bot className="h-6 w-6 text-white" />
                                </div>
                                <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-white dark:border-neutral-900" />
                            </div>
                            <div>
                                <h3 className="font-bold text-base text-neutral-800 dark:text-neutral-100">EduCreds Assistant</h3>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400">Online</p>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" className="text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 h-8 w-8" onClick={() => setIsOpen(false)}>
                            <X className="h-5 w-5" />
                        </Button>
                    </div>

                    <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto p-4 space-y-5 bg-neutral-50 dark:bg-neutral-950/50">
                        {messages.map((msg) => (
                            <div key={msg.id} className={cn("flex items-start gap-3", msg.role === "user" ? "justify-end" : "justify-start")}>
                                {msg.role === "assistant" && (
                                    <div className="h-8 w-8 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center flex-shrink-0">
                                        <Bot className="h-5 w-5 text-neutral-600 dark:text-neutral-300" />
                                    </div>
                                )}
                                <div className={cn("max-w-[85%] sm:max-w-[80%] rounded-2xl px-4 py-2.5 shadow-sm", msg.role === "user" ? "bg-primary text-primary-foreground rounded-br-lg" : "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-bl-lg border border-neutral-200 dark:border-neutral-700")}>
                                    <div className="prose prose-sm dark:prose-invert max-w-none break-words">
                                        <MemoizedMarkdown remarkPlugins={[remarkGfm]}>
                                            {msg.content}
                                        </MemoizedMarkdown>
                                    </div>
                                     {msg.sources && msg.sources.length > 0 && (
                                        <div className="mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-700/50">
                                            <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-2 flex items-center"><Sparkles className="w-3.5 h-3.5 mr-1.5 text-primary"/>Sources:</p>
                                            <div className="flex flex-col space-y-1.5">
                                                {msg.sources.map((source, idx) => (
                                                    <a key={idx} href={source.url} target="_blank" rel="noopener noreferrer" className="text-xs font-medium flex items-center gap-1.5 text-blue-600 dark:text-blue-400 hover:underline" title={source.title || source.url}>
                                                        <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
                                                        <span className="line-clamp-1 break-all">{source.title || source.url}</span>
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                {msg.role === "user" && (
                                    <div className="h-8 w-8 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center flex-shrink-0">
                                        <User className="h-5 w-5 text-neutral-600 dark:text-neutral-300" />
                                    </div>
                                )}
                            </div>
                        ))}
                        {isLoading && messages[messages.length-1]?.role !== 'assistant' && (
                             <div className="flex items-start gap-3 justify-start">
                                <div className="h-8 w-8 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center flex-shrink-0">
                                    <Bot className="h-5 w-5 text-neutral-600 dark:text-neutral-300" />
                                </div>
                                <div className="bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-100 border border-neutral-200 dark:border-neutral-700 rounded-2xl rounded-bl-lg px-4 py-3 shadow-sm flex items-center space-x-2">
                                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                    <span className="text-sm">Thinking...</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-3 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800">
                        <form onSubmit={handleStreamingSubmit} className="flex gap-2 items-center">
                            <Input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask the AI assistant..."
                                className="flex-1 text-sm bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 rounded-lg focus-visible:ring-primary dark:focus-visible:ring-offset-neutral-900"
                                disabled={isLoading}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        handleStreamingSubmit(e);
                                    }
                                }}
                            />
                            <Button type="submit" size="icon" className="bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors flex-shrink-0" disabled={isLoading || !input.trim()}>
                                <Send className="h-4 w-4" />
                            </Button>
                        </form>
                         <p className="text-xs text-center text-neutral-400 dark:text-neutral-600 mt-2">
                            Powered by EduCreds Trust Agent.
                        </p>
                    </div>
                </div>
            )}

            <Button onClick={() => setIsOpen(!isOpen)} size="icon" className="rounded-full h-16 w-16 shadow-lg bg-gradient-to-br from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 text-white transition-all duration-300 hover:scale-105 flex-shrink-0">
                {isOpen ? <X className="h-7 w-7" /> : <MessageCircle className="h-7 w-7" />}
            </Button>
        </div>
    );
}
