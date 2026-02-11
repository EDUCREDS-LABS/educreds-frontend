import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
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
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end space-y-4 font-sans">
            {/* Chat Window */}
            {isOpen && (
                <div className="w-[380px] h-[500px] bg-white rounded-xl shadow-2xl border border-neutral-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-300">
                    {/* Header */}
                    <div className="bg-primary p-4 flex justify-between items-center text-white">
                        <div className="flex items-center space-x-2">
                            <Bot className="h-5 w-5" />
                            <span className="font-semibold">EduCreds Assistant</span>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-white hover:bg-primary-foreground/20 h-8 w-8"
                            onClick={() => setIsOpen(false)}
                        >
                            <X className="h-5 w-5" />
                        </Button>
                    </div>

                    {/* Messages Area */}
                    <ScrollArea className="flex-1 p-4 bg-slate-50">
                        <div className="space-y-4">
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                                >
                                    <div
                                        className={`max-w-[85%] rounded-lg p-3 text-sm shadow-sm ${msg.role === "user"
                                            ? "bg-primary text-primary-foreground rounded-tr-none"
                                            : "bg-white text-slate-800 border border-slate-200 rounded-tl-none"
                                            }`}
                                    >
                                        <div className="whitespace-pre-wrap">{msg.content}</div>

                                        {/* Sources */}
                                        {msg.sources && msg.sources.length > 0 && (
                                            <div className="mt-3 pt-2 border-t border-slate-100">
                                                <p className="text-xs font-semibold text-slate-500 mb-1">Sources:</p>
                                                <div className="flex flex-col space-y-1">
                                                    {msg.sources.map((source, idx) => (
                                                        <a
                                                            key={idx}
                                                            href={source.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-xs text-blue-600 hover:underline flex items-center truncate"
                                                        >
                                                            <ExternalLink className="h-3 w-3 mr-1 flex-shrink-0" />
                                                            <span className="truncate">{source.title || source.url}</span>
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-white text-slate-800 border border-slate-200 rounded-lg p-3 rounded-tl-none shadow-sm flex items-center space-x-2">
                                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                        <span className="text-sm text-slate-500">Thinking...</span>
                                    </div>
                                </div>
                            )}
                            <div ref={scrollRef} />
                        </div>
                    </ScrollArea>

                    {/* Input Area */}
                    <div className="p-3 bg-white border-t border-slate-200">
                        <form onSubmit={handleSubmit} className="flex space-x-2">
                            <Input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask about EduCreds..."
                                className="flex-1 focus-visible:ring-primary"
                                disabled={isLoading}
                            />
                            <Button
                                type="submit"
                                size="icon"
                                className="bg-primary hover:bg-primary/90"
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
                className="rounded-full h-14 w-14 shadow-lg bg-primary hover:bg-primary/90 transition-all duration-300 hover:scale-105"
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
