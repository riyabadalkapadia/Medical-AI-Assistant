import React, { useState } from "react";
import ChatWindow from "../components/ChatWindow";
import InputBox from "../components/InputBox";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

const Home = () => {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hello! I am your virtual medical receptionist. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;
    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });
      const data = await res.json();
      setMessages([
        ...newMessages,
        { role: "assistant", content: data.message },
      ]);
    } catch (err) {
      setMessages([
        ...newMessages,
        { role: "assistant", content: "Sorry, something went wrong." },
      ]);
    }
    setLoading(false);
  };

  // New function for Vapi integration
  const startPhoneCall = async () => {
    // Find the last phone number entered by the user
    const phone = messages.find(
      (m) => m.role === "user" && m.content.match(/\+?\d{10,}/),
    );
    const phoneNumber = phone ? phone.content.match(/\+?\d{10,}/)[0] : null;
    if (!phoneNumber) {
      setMessages([
        ...messages,
        {
          role: "assistant",
          content:
            "Please provide your phone number in the chat before continuing via phone.",
        },
      ]);
      return;
    }
    setLoading(true);
    try {
      console.log("Calling /start-call with", phoneNumber);
      const res = await fetch(`${BACKEND_URL}/start-call`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessages([
          ...messages,
          {
            role: "assistant",
            content: "Phone call started! Check your phone.",
          },
        ]);
        console.log("Vapi API response:", data);
      } else {
        setMessages([
          ...messages,
          {
            role: "assistant",
            content: `Failed to start phone call: ${data.error || "Unknown error"}`,
          },
        ]);
        console.error("Vapi API error:", data);
      }
    } catch (err) {
      setMessages([
        ...messages,
        { role: "assistant", content: "Sorry, could not start phone call." },
      ]);
      console.error("Network error:", err);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-200 via-purple-200 to-pink-200">
      <div className="w-full max-w-xl h-[70vh] flex flex-col rounded-3xl shadow-xl bg-white/40 backdrop-blur-lg border border-white/30 p-6">
        <div className="flex-1 overflow-y-auto">
          <ChatWindow messages={messages} />
        </div>
        <InputBox
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onSend={handleSend}
          disabled={loading}
        />
        <button
          className="mt-4 px-4 py-2 rounded-lg bg-pink-500 text-white font-semibold shadow-md hover:bg-pink-600 transition backdrop-blur-md"
          onClick={startPhoneCall}
          disabled={loading}
        >
          Continue on Phone
        </button>
      </div>
    </div>
  );
};

export default Home;
