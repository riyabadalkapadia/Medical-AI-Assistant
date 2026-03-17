const START_PROMPT =
  "Sure. I can help book your appointment. What is your concern or body part?";
const UNSUPPORTED_PROMPT =
  "Sorry, we currently handle only heart, skin, knee, and ear concerns at Kyron Medical.";
const ASK_FIRST_NAME = "First name?";
const ASK_LAST_NAME = "Last name?";
const ASK_DOB = "Date of birth? (DD/MM/YYYY)";
const ASK_CONTACT = "Contact number?";
const ASK_CONFIRM_SUFFIX = "Proceed with booking? (Yes/No)";
const BOOKED_PROMPT = "Done. Your appointment request is submitted.";
const CANCELLED_PROMPT = "Booking cancelled. Say 'book appointment' to start again.";

const INTENT_KEYWORDS = ["appointment", "book", "doctor", "schedule", "checkup"];

const DEPARTMENT_KEYWORDS = {
  Cardiology: ["heart", "chest pain", "palpitation", "cardiac"],
  Dermatology: ["skin", "rash", "acne", "eczema", "itch"],
  Orthopedic: ["knee"],
  ENT: ["ear"],
};

function normalize(text) {
  return String(text || "")
    .trim()
    .replaceAll(/\s+/g, " ");
}

function toLower(text) {
  return normalize(text).toLowerCase();
}

function hasIntent(text) {
  const t = toLower(text);
  return INTENT_KEYWORDS.some((k) => t.includes(k));
}

function isYes(text) {
  const t = toLower(text);
  return ["yes", "y", "yeah", "yep", "proceed", "confirm", "ok", "okay"].some((w) =>
    t === w || t.includes(`${w} `) || t.includes(` ${w}`),
  );
}

function isNo(text) {
  const t = toLower(text);
  return ["no", "n", "nope", "not now", "cancel"].some((w) =>
    t === w || t.includes(`${w} `) || t.includes(` ${w}`),
  );
}

function isCancel(text) {
  const t = toLower(text);
  return t === "cancel" || t.includes("cancel booking") || t.includes("stop booking");
}

function inferDepartment(concern) {
  const c = toLower(concern);
  for (const [department, keywords] of Object.entries(DEPARTMENT_KEYWORDS)) {
    if (keywords.some((k) => c.includes(k))) {
      return department;
    }
  }
  return null;
}

function findLatestAssistantIndex(messages, exactText, minIndex = 0) {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (i < minIndex) {
      break;
    }
    if (messages[i]?.role === "assistant" && normalize(messages[i].content) === exactText) {
      return i;
    }
  }
  return -1;
}

function findFirstUserAfter(messages, index) {
  for (let i = index + 1; i < messages.length; i += 1) {
    if (messages[i]?.role === "user") {
      return normalize(messages[i].content);
    }
  }
  return null;
}

function findLastUserMessage(messages) {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i]?.role === "user") {
      return normalize(messages[i].content);
    }
  }
  return "";
}

function buildConfirmation({ firstName, lastName, dob, phone, concern }) {
  return [
    "Please confirm:",
    `- Name: ${firstName} ${lastName}`,
    `- DOB: ${dob}`,
    `- Contact: ${phone}`,
    `- Concern: ${concern}`,
    "",
    ASK_CONFIRM_SUFFIX,
  ].join("\n");
}

function getFlowStartIndex(messages) {
  return findLatestAssistantIndex(messages, START_PROMPT);
}

function isFlowTerminalAfterStart(messages, startIndex) {
  if (startIndex < 0) return false;
  for (let i = startIndex + 1; i < messages.length; i += 1) {
    const m = messages[i];
    if (m?.role !== "assistant") continue;
    const text = normalize(m.content);
    if (text === UNSUPPORTED_PROMPT || text === BOOKED_PROMPT || text === CANCELLED_PROMPT) {
      return true;
    }
  }
  return false;
}

function getFlowState(messages) {
  const startIndex = getFlowStartIndex(messages);
  if (startIndex < 0) {
    return { active: false };
  }
  if (isFlowTerminalAfterStart(messages, startIndex)) {
    return { active: false };
  }

  const concern = findFirstUserAfter(messages, startIndex);
  const department = concern ? inferDepartment(concern) : null;

  const firstPromptIndex = findLatestAssistantIndex(messages, ASK_FIRST_NAME, startIndex);
  const firstName = firstPromptIndex >= 0 ? findFirstUserAfter(messages, firstPromptIndex) : null;
  const lastPromptIndex =
    firstPromptIndex >= 0 ? findLatestAssistantIndex(messages, ASK_LAST_NAME, firstPromptIndex) : -1;
  const lastName = lastPromptIndex >= 0 ? findFirstUserAfter(messages, lastPromptIndex) : null;
  const dobPromptIndex =
    firstPromptIndex >= 0 ? findLatestAssistantIndex(messages, ASK_DOB, firstPromptIndex) : -1;
  const dob = dobPromptIndex >= 0 ? findFirstUserAfter(messages, dobPromptIndex) : null;
  const contactPromptIndex =
    firstPromptIndex >= 0 ? findLatestAssistantIndex(messages, ASK_CONTACT, firstPromptIndex) : -1;
  const phone = contactPromptIndex >= 0 ? findFirstUserAfter(messages, contactPromptIndex) : null;

  return {
    active: true,
    concern,
    department,
    firstName,
    lastName,
    dob,
    phone,
  };
}

function handleAppointmentFlow(messages) {
  if (!Array.isArray(messages) || messages.length === 0) {
    return null;
  }

  const lastUserMessage = findLastUserMessage(messages);
  const state = getFlowState(messages);

  if (!state.active) {
    if (hasIntent(lastUserMessage)) {
      return START_PROMPT;
    }
    return null;
  }

  if (isCancel(lastUserMessage)) {
    return CANCELLED_PROMPT;
  }

  if (!state.concern) {
    return START_PROMPT;
  }

  if (!state.department) {
    return UNSUPPORTED_PROMPT;
  }

  if (!state.firstName) {
    return ASK_FIRST_NAME;
  }

  if (!state.lastName) {
    return ASK_LAST_NAME;
  }

  if (!state.dob) {
    return ASK_DOB;
  }

  if (!state.phone) {
    return ASK_CONTACT;
  }

  const confirmationText = buildConfirmation(state);
  const latestConfirmationPromptIndex = messages
    .map((m) => (m?.role === "assistant" ? normalize(m.content) : ""))
    .lastIndexOf(normalize(confirmationText));

  if (latestConfirmationPromptIndex === -1) {
    return confirmationText;
  }

  const decision = findFirstUserAfter(messages, latestConfirmationPromptIndex);
  if (!decision) {
    return confirmationText;
  }

  if (isYes(decision)) {
    return BOOKED_PROMPT;
  }

  if (isNo(decision)) {
    return ASK_FIRST_NAME;
  }

  return "Please reply Yes or No.";
}

module.exports = {
  handleAppointmentFlow,
};