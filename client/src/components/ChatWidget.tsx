import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, X, Send, Bot, User, Loader2, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    sources?: { title: string; url: string }[];
}

export function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "welcome",
            role: "assistant",
            content: "Hi! I'm the EduCreds Trust Agent. Ask me anything about the platform, documentation, or governance!"
        }
    ]);
    const scrollRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();

    // Scroll to bottom when messages change
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content: input
        };

        setMessages(prev => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        try {
            // Assuming layout or proxy sets up the correct base URL, 
            // otherwise we might need an environment variable or config.
            // For now, we'll try hitting the trust agent direct if on same domain or proxy.
            // If run locally, trust agent is on port 3010. 
            // In production/docker, it might be routed differently.
            // We will try to use the relative path if proxy is set up or absolute if not.
            // Since frontend is usually 5173 and backend 3010, we likely need a full URL locally.

            // Proxy via custom server is failing, using direct absolute path.
            // In a real deployed env, this should be env var.
            const API_URL = "http://localhost:3010";

            const response = await axios.post(`${API_URL}/api/trust-agent/chat`, {
                message: userMessage.content
            });

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const data = response.data as any;
            console.log("Chat response data:", data);

            // Safer access to response content
            const content = data.response
                ? (typeof data.response === 'string' ? data.response : data.response.summary)
                : (data.message || "No response received from agent.");

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: content,
                sources: data.sources
            };

            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            console.error("Chat error:", error);
            toast({
                title: "Error",
                description: "Failed to get response from Trust Agent.",
                variant: "destructive"
            });
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: "Sorry, I encountered an error while processing your request. Please try again later."
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end space-y-4 font-sans">
            {/* Chat Window */}
            {isOpen && (
                <div className="w-screen sm:w-[420px] md:w-[500px] max-h-[90vh] sm:max-h-[600px] bg-white rounded-2xl sm:rounded-xl shadow-2xl border border-neutral-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-300 mx-4 sm:mx-0">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-primary to-primary/90 px-4 sm:px-6 py-4 flex justify-between items-center text-white shadow-sm">
                        <div className="flex items-center space-x-3">
                            <div className="bg-white/20 p-2 rounded-lg">
                                <Bot className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-base sm:text-lg">EduCreds Assistant</h3>
                                <p className="text-xs text-white/80">Online & Ready to Help</p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-white hover:bg-white/20 h-8 w-8 flex-shrink-0"
                            onClick={() => setIsOpen(false)}
                        >
                            <X className="h-5 w-5" />
                        </Button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 sm:p-5 bg-neutral-50/50 scroll-smooth">
                        <div className="space-y-4">
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                                >
                                    <div
                                        className={`flex items-start gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                                    >
                                        {/* Avatar */}
                                        <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === "user"
                                            ? "bg-primary/20"
                                            : "bg-slate-200"
                                            }`}>
                                            {msg.role === "user" ? (
                                                <User className="h-4 w-4 text-primary" />
                                            ) : (
                                                <Bot className="h-4 w-4 text-slate-600" />
                                            )}
                                        </div>

                                        {/* Message Bubble */}
                                        <div
                                            className={`max-w-xs sm:max-w-sm md:max-w-md rounded-2xl px-4 py-3 shadow-sm transition-all ${msg.role === "user"
                                                ? "bg-primary text-primary-foreground rounded-tr-sm"
                                                : "bg-white text-slate-900 border border-slate-200 rounded-tl-sm"
                                                }`}
                                        >
                                            <div className="break-words text-sm leading-relaxed mb-2 whitespace-pre-wrap">
                                                {msg.content}
                                            </div>

                                            {/* Sources */}
                                            {msg.sources && msg.sources.length > 0 && (
                                                <div className="mt-3 pt-3 border-t border-slate-100/50">
                                                    <p className="text-xs font-semibold text-slate-500 mb-2">📚 Sources:</p>
                                                    <div className="flex flex-col space-y-1.5">
                                                        {msg.sources.map((source, idx) => (
                                                            <a
                                                                key={idx}
                                                                href={source.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className={`text-xs font-medium flex items-center gap-1.5 group ${msg.role === "user"
                                                                    ? "text-white/90 hover:text-white"
                                                                    : "text-blue-600 hover:text-blue-700"
                                                                    } transition-colors`}
                                                                title={source.title || source.url}
                                                            >
                                                                <ExternalLink className="h-3.5 w-3.5 flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
                                                                <span className="line-clamp-1 break-all">
                                                                    {source.title || source.url}
                                                                </span>
                                                            </a>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start animate-in fade-in duration-300">
                                    <div className="flex items-start gap-2">
                                        <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                                            <Bot className="h-4 w-4 text-slate-600" />
                                        </div>
                                        <div className="bg-white text-slate-800 border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center space-x-2">
                                            <Loader2 className="h-4 w-4 animate-spin text-primary flex-shrink-0" />
                                            <span className="text-sm text-slate-600">Thinking...</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={scrollRef} />
                        </div>
                    </div>

                    {/* Input Area */}
                    <div className="p-3 sm:p-4 bg-white border-t border-slate-200">
                        <form onSubmit={handleSubmit} className="flex gap-2">
                            <Input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask anything..."
                                className="flex-1 text-sm placeholder:text-slate-400 focus-visible:ring-primary rounded-lg border-slate-300"
                                disabled={isLoading}
                            />
                            <Button
                                type="submit"
                                size="icon"
                                className="bg-primary hover:bg-primary/90 text-white flex-shrink-0 rounded-lg transition-all duration-200"
                                disabled={isLoading || !input.trim()}
                            >
                                <Send className="h-4 w-4" />
                            </Button>
                        </form>
                    </div>
                </div>
            )}

            {/* Toggle Button */}
            <Button
                onClick={() => setIsOpen(!isOpen)}
                size="lg"
                className="rounded-full h-14 w-14 shadow-lg bg-gradient-to-br from-primary to-primary/90 hover:bg-primary/85 text-white transition-all duration-300 hover:scale-110 flex-shrink-0"
            >
                {isOpen ? (
                    <X className="h-6 w-6" />
                ) : (
                    <MessageCircle className="h-6 w-6" />
                )}
            </Button>
        </div>
    );
}
