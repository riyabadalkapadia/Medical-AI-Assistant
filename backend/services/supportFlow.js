function normalize(text) {
  return String(text || "")
    .trim()
    .toLowerCase()
    .replaceAll(/\s+/g, " ");
}

function getLastUserMessage(messages) {
  if (!Array.isArray(messages)) return "";
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i]?.role === "user") {
      return normalize(messages[i].content);
    }
  }
  return "";
}

function hasAny(text, keywords) {
  return keywords.some((k) => text.includes(k));
}

function handleSupportFlow(messages) {
  const message = getLastUserMessage(messages);
  if (!message) return null;

  const isGreeting = hasAny(message, ["hi", "hello", "hey", "good morning", "good evening", "start"]);
  if (isGreeting) {
    return [
      "Hello! How can I assist you today?",
      "",
      "1. Schedule an appointment",
      "2. Prescription refill",
      "3. Check clinic address & hours",
    ].join("\n");
  }

  const isAddressHours =
    ["3", "3.", "option 3", "address", "location", "hours", "timing", "open", "close"].includes(message) ||
    hasAny(message, ["address", "location", "hours", "timing", "open", "close"]);
  if (isAddressHours) {
    return [
      "Kyron Medical Clinic",
      "Address: 123 Maple Street, Springfield, IL 62704",
      "Hours: Monday to Friday, 9:00 AM - 4:00 PM",
    ].join("\n");
  }

  return null;
}

module.exports = {
  handleSupportFlow,
};
