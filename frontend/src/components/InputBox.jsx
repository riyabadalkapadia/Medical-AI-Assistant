import React from "react";

const InputBox = ({ value, onChange, onSend, disabled }) => {
  return (
    <div className="flex items-center gap-2 p-4 bg-white/40 rounded-xl backdrop-blur-md shadow-md">
      <input
        className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white/70"
        type="text"
        placeholder="Type your message..."
        value={value}
        onChange={onChange}
        disabled={disabled}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !disabled) onSend();
        }}
      />
      <button
        className="px-4 py-2 rounded-lg bg-blue-500 text-white font-semibold shadow-md hover:bg-blue-600 transition"
        onClick={onSend}
        disabled={disabled}
      >
        Send
      </button>
    </div>
  );
};

export default InputBox;
