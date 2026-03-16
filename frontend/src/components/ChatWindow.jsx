import React, { useRef, useEffect } from "react";
import MessageBubble from "./MessageBubble";

const ChatWindow = ({ messages }) => {
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-full overflow-y-auto p-4">
      {messages.map((msg, idx) => (
        <MessageBubble
          key={idx}
          message={msg.content}
          isUser={msg.role === "user"}
        />
      ))}
      <div ref={chatEndRef} />
    </div>
  );
};

export default ChatWindow;
