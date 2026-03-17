import React, { useState, useEffect, useRef } from "react";
import InputBox from "../components/InputBox";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
const APPOINTMENT_ANCHOR_PROMPT = "First Name?";

// Play notification sound
const playSound = (type) => {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const now = audioContext.currentTime;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.frequency.value = type === "sent" ? 700 : 900;
  gain.gain.setValueAtTime(0.3, now);
  gain.gain.exponentialRampToValueAtTime(
    0.01,
    now + (type === "sent" ? 0.1 : 0.15),
  );
  oscillator.start(now);
  oscillator.stop(now + (type === "sent" ? 0.1 : 0.15));
};

const Home = () => {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hello! I'm your Kyron Medical Assistant. How can I help you today?",
      status: "read",
      timestamp: new Date(),
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;

    playSound("sent");

    const newMessages = [
      ...messages,
      {
        role: "user",
        content: input,
        status: "delivered",
        timestamp: new Date(),
      },
    ];

    setMessages(newMessages);
    setInput("");
    setLoading(true);
    setIsTyping(true);

    // Keep enough context for flow state while still bounding payload size.
    let anchorIndex = -1;
    for (let i = newMessages.length - 1; i >= 0; i -= 1) {
      if (
        newMessages[i]?.role === "assistant" &&
        String(newMessages[i]?.content || "").includes(
          APPOINTMENT_ANCHOR_PROMPT,
        )
      ) {
        anchorIndex = i;
        break;
      }
    }

    const contextMessages =
      anchorIndex >= 0
        ? newMessages.slice(Math.max(0, anchorIndex - 1))
        : newMessages.slice(-20);

    // Simulate delivery status update
    setTimeout(() => {
      setMessages((prev) =>
        prev.map((msg, idx) =>
          idx === prev.length - 1 ? { ...msg, status: "read" } : msg,
        ),
      );
    }, 500);

    try {
      const res = await fetch(`${BACKEND_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: contextMessages }),
      });
      const data = await res.json();
      playSound("received");
      setMessages((prev) => {
        const nextMessages = [
          ...prev,
          {
            role: "assistant",
            content: data.message,
            status: "read",
            timestamp: new Date(),
          },
        ];

        if (data.followUpMessage) {
          nextMessages.push({
            role: "assistant",
            content: data.followUpMessage,
            status: "read",
            timestamp: new Date(),
          });
        }

        return nextMessages;
      });
    } catch {
      playSound("received");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
          status: "read",
          timestamp: new Date(),
        },
      ]);
    }

    setLoading(false);
    setIsTyping(false);
  };

  const startPhoneCall = async () => {
    const phone = messages.find(
      (m) => m.role === "user" && m.content.match(/\d{7,}/),
    );
    const phoneNumber = phone ? phone.content.match(/\d{7,}/)[0] : null;

    if (!phoneNumber) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Please provide your phone number first (e.g., '1234567890')",
          status: "read",
          timestamp: new Date(),
        },
      ]);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/start-call`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber }),
      });
      const data = await res.json();
      playSound("received");

      if (res.ok) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "📞 Phone call initiated! You should receive a call shortly.",
            status: "read",
            timestamp: new Date(),
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `❌ Call failed: ${data.error || "Unknown error"}`,
            status: "read",
            timestamp: new Date(),
          },
        ]);
      }
    } catch {
      playSound("received");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "❌ Network error. Please try again.",
          status: "read",
          timestamp: new Date(),
        },
      ]);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center p-4">
      {/* Chat Container - Premium Curved Box */}
      <div className="w-full max-w-2xl h-[85vh] bg-gradient-to-br from-slate-800/50 via-slate-850/50 to-slate-900/60 rounded-none shadow-xl flex flex-col border border-slate-600/30 backdrop-blur-2xl overflow-hidden relative">
        {/* Premium gradient overlay effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 via-transparent to-cyan-500/5 pointer-events-none" />

        {/* WhatsApp-style Header */}
        <div className="relative bg-gradient-to-r from-slate-800/80 via-slate-800/70 to-slate-800/80 backdrop-blur-xl border-b border-slate-600/20 text-white px-6 py-4 flex items-center justify-between flex-shrink-0 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-teal-400 via-cyan-500 to-cyan-600 rounded-full flex items-center justify-center text-xl font-bold shadow-lg shadow-cyan-500/40 relative">
              🏥
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-slate-800 shadow-lg" />
            </div>
            <div>
              <h2 className="font-bold text-lg leading-tight">Kyron Medical</h2>
              <p
                className={`text-xs font-semibold transition-colors duration-300 ${isTyping ? "text-amber-400" : "text-teal-300"}`}
              >
                {isTyping ? "typing..." : "Online"}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="p-2.5 rounded-full hover:bg-slate-700/40 transition-all duration-200 hover:shadow-md hover:shadow-cyan-500/20 text-lg">
              ☎️
            </button>
            <button className="p-2.5 rounded-full hover:bg-slate-700/40 transition-all duration-200 hover:shadow-md hover:shadow-cyan-500/20 text-lg">
              ⋮
            </button>
          </div>
        </div>

        {/* Messages Container - Premium WhatsApp Style */}
        <div
          className="flex-1 overflow-y-auto px-5 py-4 space-y-3 scroll-smooth"
          style={{
            backgroundImage:
              "linear-gradient(135deg, rgba(15, 23, 42, 0.4) 0%, rgba(2, 20, 36, 0.3) 100%)",
          }}
        >
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} mx-3 animate-in fade-in slide-in-from-bottom-3 duration-300`}
            >
              <div
                className={`text-left max-w-[65%] px-3.5 py-2.5 rounded-xl text-sm leading-[1.5] break-words overflow-hidden ${
                  msg.role === "user"
                    ? "bg-gradient-to-br from-teal-600 to-cyan-600 text-white shadow-sm"
                    : "bg-slate-700/70 text-slate-100 border border-slate-500/30 shadow-sm"
                }`}
              >
                <p className="font-normal leading-[1.5] break-words overflow-wrap-anywhere">
                  {msg.content}
                </p>
                <div
                  className={`flex items-center gap-2 mt-2.5 text-xs font-medium ${
                    msg.role === "user" ? "opacity-85" : "opacity-70"
                  }`}
                >
                  <span className="text-opacity-75">
                    {msg.timestamp?.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  {msg.role === "user" && (
                    <span className="ml-1 font-semibold text-opacity-90">
                      {msg.status === "delivered" && (
                        <span className="inline-block">✓</span>
                      )}
                      {msg.status === "read" && (
                        <span className="inline-block">✓✓</span>
                      )}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start animate-in fade-in slide-in-from-bottom-3 duration-300">
              <div className="px-3.5 py-2.5 rounded-xl bg-slate-700/70 text-slate-100 border border-slate-500/30 shadow-sm">
                <div className="flex gap-2 items-center py-1">
                  <div
                    className="w-2.5 h-2.5 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0s" }}
                  />
                  <div
                    className="w-2.5 h-2.5 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.15s" }}
                  />
                  <div
                    className="w-2.5 h-2.5 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.3s" }}
                  />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area - Premium WhatsApp Style */}
        <div className="relative bg-gradient-to-t from-slate-800/90 via-slate-800/80 to-slate-800/70 backdrop-blur-xl border-t border-slate-600/20 px-5 py-5 flex-shrink-0 shadow-lg">
          <InputBox
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onSend={handleSend}
            onCall={startPhoneCall}
            disabled={loading}
          />
        </div>
      </div>
    </div>
  );
};

export default Home;
