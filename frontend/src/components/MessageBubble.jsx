import React from "react";

const MessageBubble = ({ message, isUser }) => {
  return (
    <div
      className={`max-w-xs md:max-w-md lg:max-w-lg px-5 py-4 rounded-2xl mb-5 shadow-lg backdrop-blur-sm border transition-all duration-300 animate-slideInRight ${
        isUser
          ? "self-end bg-gradient-to-br from-cyan-600 to-cyan-700 text-white border-cyan-500/50 ml-12 hover:shadow-cyan-500/30 hover:shadow-xl"
          : "self-start bg-slate-800/90 text-slate-100 border-slate-600/50 mr-12 hover:bg-slate-800 hover:shadow-xl"
      }`}
    >
      <div className="text-sm leading-relaxed whitespace-pre-line font-medium">
        {message}
      </div>
      <div
        className={`text-xs mt-3 opacity-60 font-light ${
          isUser ? "text-cyan-100" : "text-slate-400"
        }`}
      >
        {new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </div>
    </div>
  );
};

export default MessageBubble;
