import React, { useState } from "react";

const InputBox = ({ value, onChange, onSend, onCall, disabled }) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      {/* Main Input Group - Premium Pill Shape */}
      <div
        className={`relative flex items-center gap-2 px-3 py-1 bg-slate-700/30 rounded-xl border transition-colors duration-200 ${
          isFocused ? "border-cyan-400/60" : "border-slate-500/30"
        }`}
      >
        {/* Input Field */}
        <input
          className="flex-1 px-3 py-3.5 bg-transparent text-slate-100 placeholder-slate-500 outline-none text-sm font-normal caret-cyan-400"
          type="text"
          placeholder="Type your message..."
          value={value}
          onChange={onChange}
          disabled={disabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !disabled) {
              onSend();
            }
          }}
        />

        {/* Send Button - Premium Style */}
        <button
          className={`px-5 py-2.5 rounded-lg font-semibold text-sm text-white transition-colors duration-200 flex-shrink-0 ${
            disabled
              ? "bg-slate-600/30 opacity-50 cursor-not-allowed"
              : "bg-teal-600/80 hover:bg-teal-600 active:bg-teal-700 border border-teal-500/40"
          }`}
          onClick={onSend}
          disabled={disabled}
          title="Send message (Enter)"
        >
          <span className="text-base">→</span>
        </button>
      </div>

      {/* Call Button - Premium Style */}
      <button
        className={`relative w-full px-4 py-3 rounded-xl font-semibold text-sm text-white transition-colors duration-200 ${
          disabled
            ? "bg-slate-600/30 opacity-50 cursor-not-allowed"
            : "bg-slate-600/50 hover:bg-slate-600/70 border border-slate-500/40 hover:border-slate-400/50"
        }`}
        onClick={onCall}
        disabled={disabled}
        title="Initiate voice call"
      >
        <span className="inline-flex items-center gap-2">
          <span className="text-lg">📞</span>
          <span>Call Me Now</span>
        </span>
      </button>
    </div>
  );
};

export default InputBox;
