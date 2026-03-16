import React from "react";

const MessageBubble = ({ message, isUser }) => {
  return (
    <div
      className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-2xl mb-2 shadow-md backdrop-blur-md bg-white/60 border border-white/30 ${
        isUser
          ? "self-end bg-gradient-to-r from-blue-400/60 to-blue-600/60 text-white"
          : "self-start bg-gradient-to-r from-gray-100/60 to-gray-300/60 text-gray-800"
      }`}
    >
      {message}
    </div>
  );
};

export default MessageBubble;
