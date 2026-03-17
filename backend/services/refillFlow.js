const ASK_FIRST_NAME = "Please provide your First Name.";
const ASK_LAST_NAME = "Last Name?";
const ASK_DOB = "Date of Birth?";
const ASK_MEDICATION = "Which medication do you need refilled?";
const ASK_PHARMACY = "Preferred pharmacy (optional)?";
const COMPLETE_MESSAGE =
  "Thank you. Your prescription refill request has been submitted. Our team will review and notify you shortly.";

function normalize(text) {
  return String(text || "")
    .trim()
    .replaceAll(/\s+/g, " ");
}

function toLower(text) {
  return normalize(text).toLowerCase();
}

function findLastUserMessage(messages) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (messages[index]?.role === "user") {
      return normalize(messages[index].content);
    }
  }
  return "";
}

function findLatestAssistantIndex(messages, exactText, minIndex = 0) {
  for (let index = messages.length - 1; index >= minIndex; index -= 1) {
    const message = messages[index];
    if (message?.role === "assistant" && normalize(message.content) === exactText) {
      return index;
    }
  }
  return -1;
}

function findFirstUserAfter(messages, index) {
  for (let cursor = index + 1; cursor < messages.length; cursor += 1) {
    if (messages[cursor]?.role === "user") {
      return normalize(messages[cursor].content);
    }
  }
  return null;
}

function getFieldValue(messages, prompt, minIndex) {
  const promptIndex = findLatestAssistantIndex(messages, prompt, minIndex);
  return {
    promptIndex,
    value: promptIndex >= 0 ? findFirstUserAfter(messages, promptIndex) : null,
  };
}

function getFlowState(messages) {
  const firstNameField = getFieldValue(messages, ASK_FIRST_NAME, 0);
  if (firstNameField.promptIndex < 0) {
    return { active: false };
  }

  const minIndex = firstNameField.promptIndex;
  const lastNameField = getFieldValue(messages, ASK_LAST_NAME, minIndex);
  const dobField = getFieldValue(messages, ASK_DOB, minIndex);
  const medicationField = getFieldValue(messages, ASK_MEDICATION, minIndex);
  const pharmacyField = getFieldValue(messages, ASK_PHARMACY, minIndex);

  return {
    active: true,
    firstName: firstNameField.value,
    lastName: lastNameField.value,
    dob: dobField.value,
    medication: medicationField.value,
    pharmacy: pharmacyField.value,
  };
}

function handleRefillFlow(messages) {
  if (!Array.isArray(messages) || messages.length === 0) {
    return null;
  }

  const lastUserMessage = toLower(findLastUserMessage(messages));
  const state = getFlowState(messages);

  if (!state.active) {
    if (["2", "2.", "option 2", "prescription refill", "refill", "prescription"].includes(lastUserMessage) ||
      lastUserMessage.includes("refill") ||
      lastUserMessage.includes("prescription")) {
      return { message: ASK_FIRST_NAME };
    }
    return null;
  }

  if (!state.firstName) return { message: ASK_FIRST_NAME };
  if (!state.lastName) return { message: ASK_LAST_NAME };
  if (!state.dob) return { message: ASK_DOB };
  if (!state.medication) return { message: ASK_MEDICATION };
  if (!state.pharmacy) return { message: ASK_PHARMACY };
  return { message: COMPLETE_MESSAGE };
}

module.exports = {
  handleRefillFlow,
};
