const ASK_FIRST_NAME = "First Name?";
const ASK_LAST_NAME = "Last Name?";
const ASK_DOB = "Date of Birth? (DD/MM/YYYY)";
const ASK_PHONE = "Phone Number?";
const ASK_EMAIL = "Email Address?";
const ASK_REASON = "Reason for visit?";
const ASK_PREFERRED_TIME = "What day and time would you prefer for your appointment?";
const ASK_SMS_UPDATES = "Would you like SMS confirmation as well, in addition to email? Reply Yes or No.";
const BOOKING_CANCELLED = "Appointment booking cancelled.";
const UNSUPPORTED_PROMPT =
  "Sorry, we currently do not treat this condition at Kyron Medical. Please consult a relevant specialist.";
const SMS_OPT_IN_CONFIRMED = "Email confirmation has been sent. SMS preference saved. The message has been marked as delivered to your phone number. Note: this is a simulated SMS because the free Twilio and Vapi trial has ended. Thank you for confirming with us.";
const SMS_OPT_IN_DECLINED = "Email confirmation has been sent. Okay, we will send the appointment details by email only. Thank you for confirming with us.";
const doctorsService = require("./doctors");

const DEPARTMENT_TO_SPECIALTY = {
  Orthopedics: "Orthopedic",
  Cardiology: "Cardiology",
  Dermatology: "Dermatology",
};

const CLINIC_LOCATION = {
  street: "1026 Oakmound Road",
  city: "Chicago",
  state: "IL",
  zip: "60616",
};

const APPOINTMENT_START_KEYWORDS = [
  "appointment",
  "book",
  "doctor",
  "schedule",
  "checkup",
  "1",
  "1.",
  "option 1",
  "first option",
  "schedule an appointment",
];

const DEPARTMENT_KEYWORDS = {
  Cardiology: ["heart", "chest pain", "palpitation", "cardiac"],
  Dermatology: ["skin", "rash", "acne", "eczema", "itch"],
  Orthopedics: ["bone", "bones", "joint", "joints", "knee", "shoulder", "elbow", "back pain"],
  "General Medicine": ["fever", "cold", "cough", "headache", "flu", "infection", "stomach", "general", "checkup"],
};

function normalize(text) {
  return String(text || "")
    .trim()
    .replaceAll(/\s+/g, " ");
}

function toLower(text) {
  return normalize(text).toLowerCase();
}

function hasAny(text, values) {
  return values.some((value) => text.includes(value));
}

function isYes(text) {
  const value = toLower(text);
  return ["yes", "y", "yeah", "yep", "ok", "okay", "confirm"].includes(value);
}

function isNo(text) {
  const value = toLower(text);
  return ["no", "n", "nope"].includes(value);
}

function isCancel(text) {
  const value = toLower(text);
  return value === "cancel" || value.includes("cancel booking") || value.includes("stop booking");
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalize(email));
}

function isValidPhone(phone) {
  return /^\+?[0-9\s()-]{7,20}$/.test(normalize(phone));
}

function inferDepartment(reason) {
  const value = toLower(reason);
  for (const [department, keywords] of Object.entries(DEPARTMENT_KEYWORDS)) {
    if (keywords.some((keyword) => value.includes(keyword))) {
      return department;
    }
  }
  return null;
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

function findLatestAssistantPrefix(messages, prefix, minIndex = 0) {
  for (let index = messages.length - 1; index >= minIndex; index -= 1) {
    const message = messages[index];
    if (message?.role === "assistant" && normalize(message.content).startsWith(prefix)) {
      return index;
    }
  }
  return -1;
}

function findLatestAssistantContaining(messages, needle, minIndex = 0) {
  for (let index = messages.length - 1; index >= minIndex; index -= 1) {
    const message = messages[index];
    if (message?.role === "assistant" && normalize(message.content).includes(needle)) {
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

function findLastUserAfter(messages, index) {
  for (let cursor = messages.length - 1; cursor > index; cursor -= 1) {
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

function getNextOccurrenceOfWeekday(targetDay) {
  const now = new Date();
  const result = new Date(now);
  const currentDay = result.getDay();
  let delta = (targetDay - currentDay + 7) % 7;
  if (delta === 0) {
    delta = 0;
  }
  result.setDate(result.getDate() + delta);
  return result;
}

function parseWeekdayTime(input) {
  const weekdayTimePattern = /(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\s*(?:at)?\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i;
  const match = weekdayTimePattern.exec(toLower(input));
  if (!match) return null;

  const weekdayMap = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
  };

  const target = getNextOccurrenceOfWeekday(weekdayMap[match[1]]);
  let hour = Number(match[2]);
  const minute = Number(match[3] || 0);
  const meridiem = match[4];

  if (meridiem === "pm" && hour < 12) hour += 12;
  if (meridiem === "am" && hour === 12) hour = 0;

  target.setHours(hour, minute, 0, 0);
  return target;
}

function parseDateTime(input) {
  const normalized = normalize(input);
  const isoCandidate = normalized.replace(" ", "T");
  const parsed = new Date(isoCandidate);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed;
  }
  return parseWeekdayTime(normalized);
}

function formatDateTime(date) {
  const weekday = date.toLocaleDateString("en-US", { weekday: "long" });
  const datePart = date.toLocaleDateString("en-CA");
  const timePart = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return `${weekday}, ${datePart} at ${timePart}`;
}

function isWithinClinicHours(date) {
  const day = date.getDay();
  if (day === 0 || day === 6) return false;

  const hour = date.getHours();
  const minute = date.getMinutes();
  const totalMinutes = hour * 60 + minute;

  if (totalMinutes < 9 * 60 || totalMinutes >= 16 * 60) {
    return false;
  }

  if (day === 1 && totalMinutes >= 13 * 60 && totalMinutes < 15 * 60) {
    return false;
  }

  if (day === 2 && totalMinutes >= 14 * 60 && totalMinutes < 16 * 60) {
    return false;
  }

  return true;
}

function getAlternativeSlots() {
  const targets = [
    { day: 2, hour: 10, minute: 0 },
    { day: 2, hour: 11, minute: 30 },
    { day: 3, hour: 14, minute: 0 },
  ];

  return targets.map((target) => {
    const date = getNextOccurrenceOfWeekday(target.day);
    date.setHours(target.hour, target.minute, 0, 0);
    return formatDateTime(date);
  });
}

function buildUnavailablePrompt() {
  const alternatives = getAlternativeSlots();
  return [
    "That time is not available. Here are some available options:",
    `- ${alternatives[0]}`,
    `- ${alternatives[1]}`,
    `- ${alternatives[2]}`,
  ].join("\n");
}

function buildConfirmation(state, selectedSlot) {
  const treatingDoctor = getTreatingDoctorName(state.department);

  return [
    "Your appointment is confirmed!",
    "",
    "Details:",
    `- Name: ${state.firstName} ${state.lastName}`,
    `- DOB: ${state.dob}`,
    `- Reason: ${state.reason}`,
    `- Treating Doctor: ${treatingDoctor}`,
    `- Date & Time: ${selectedSlot}`,
  ].join("\n");
}

function buildEmailDetails(state, selectedSlot) {
  const treatingDoctor = getTreatingDoctorName(state.department);

  return {
    patientName: `${state.firstName} ${state.lastName}`,
    dob: state.dob,
    reason: state.reason,
    doctor: { name: treatingDoctor },
    time: selectedSlot,
    location: CLINIC_LOCATION,
  };
}

function getTreatingDoctorName(department) {
  if (department === "General Medicine") {
    return "General Medicine Team";
  }

  const specialty = DEPARTMENT_TO_SPECIALTY[department];
  if (!specialty) {
    return department || "General Medicine Team";
  }

  const doctors = doctorsService.getDoctors();
  const doctor = doctors.find((entry) => entry?.specialty === specialty);
  return doctor?.name || specialty;
}

function getConfirmedSlot(messages, minIndex) {
  const confirmationIndex = findLatestAssistantPrefix(messages, "Your appointment is confirmed!", minIndex);
  if (confirmationIndex < 0) return null;

  const confirmationText = normalize(messages[confirmationIndex]?.content || "");
  const match = /- Date & Time:\s*(.+)$/i.exec(confirmationText);
  return match ? normalize(match[1]) : null;
}

function toDateFromDoctorSlot(slot) {
  const parsed = new Date(String(slot || "").replace(" ", "T"));
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function getDoctorSlotsForDepartment(department) {
  const specialty = DEPARTMENT_TO_SPECIALTY[department];
  if (!specialty) return [];

  const doctors = doctorsService.getDoctors();
  const slots = [];

  for (const doctor of doctors) {
    if (doctor?.specialty !== specialty) continue;
    for (const slot of doctor.availability || []) {
      const date = toDateFromDoctorSlot(slot);
      if (!date) continue;
      slots.push(date);
    }
  }

  slots.sort((a, b) => a.getTime() - b.getTime());
  return slots;
}

function hasMatchingDoctorSlot(department, selected) {
  if (department === "General Medicine") {
    return true;
  }

  const slots = getDoctorSlotsForDepartment(department);
  if (slots.length === 0) {
    return true;
  }

  const selectedTime = selected.getTime();
  return slots.some((slot) => slot.getTime() === selectedTime);
}

function buildDoctorUnavailablePrompt(department) {
  const slots = getDoctorSlotsForDepartment(department)
    .slice(0, 3)
    .map((slot) => `- ${formatDateTime(slot)}`);

  if (slots.length === 0) {
    return buildUnavailablePrompt();
  }

  return [
    "That time is not available with the doctor schedule. Here are available options:",
    ...slots,
    "Reply with one of the above date/time options, or reply YES to choose the first option.",
  ].join("\n");
}

function getFlowState(messages) {
  const firstNameField = getFieldValue(messages, ASK_FIRST_NAME, 0);
  if (firstNameField.promptIndex < 0) {
    return { active: false };
  }

  const minIndex = firstNameField.promptIndex;
  const lastNameField = getFieldValue(messages, ASK_LAST_NAME, minIndex);
  const dobField = getFieldValue(messages, ASK_DOB, minIndex);
  const phoneField = getFieldValue(messages, ASK_PHONE, minIndex);
  const emailField = getFieldValue(messages, ASK_EMAIL, minIndex);
  const reasonField = getFieldValue(messages, ASK_REASON, minIndex);
  const preferredTimeField = getFieldValue(messages, ASK_PREFERRED_TIME, minIndex);
  const unsupportedPromptIndex = findLatestAssistantIndex(messages, UNSUPPORTED_PROMPT, minIndex);
  const unavailablePromptIndex = findLatestAssistantPrefix(messages, "That time is not available", minIndex);
  const confirmationIndex = findLatestAssistantPrefix(messages, "Your appointment is confirmed!", minIndex);
  const smsPromptIndex = findLatestAssistantContaining(messages, ASK_SMS_UPDATES, minIndex);
  const smsDecision = smsPromptIndex >= 0 ? findLastUserAfter(messages, smsPromptIndex) : null;
  const confirmedSlot = getConfirmedSlot(messages, minIndex);

  let reason = reasonField.value;
  if (unsupportedPromptIndex >= 0 && unsupportedPromptIndex > reasonField.promptIndex) {
    const correctedReason = findLastUserAfter(messages, unsupportedPromptIndex);
    if (correctedReason) {
      reason = correctedReason;
    }
  }

  let preferredTime = preferredTimeField.value;
  const shouldUseUnavailableRetry =
    unavailablePromptIndex >= 0 &&
    (confirmationIndex < 0 || unavailablePromptIndex > confirmationIndex) &&
    (smsPromptIndex < 0 || unavailablePromptIndex > smsPromptIndex);

  if (shouldUseUnavailableRetry) {
    const retryTime = findLastUserAfter(messages, unavailablePromptIndex);
    if (retryTime) {
      preferredTime = retryTime;
    }
  }

  return {
    active: true,
    firstName: firstNameField.value,
    lastName: lastNameField.value,
    dob: dobField.value,
    phone: phoneField.value,
    email: emailField.value,
    reason,
    department: reason ? inferDepartment(reason) : null,
    preferredTime,
    confirmedSlot,
    unavailablePromptIndex,
    awaitingSmsDecision: smsPromptIndex >= 0 && !smsDecision,
    smsPromptIndex,
  };
}

function hasAppointmentIntent(message) {
  return hasAny(toLower(message), APPOINTMENT_START_KEYWORDS);
}

function lastAssistantMentionsAppointment(messages) {
  if (!Array.isArray(messages)) return false;

  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message?.role !== "assistant") continue;

    const text = toLower(message.content);
    return (
      text.includes("schedule an appointment") ||
      text.includes("book your appointment") ||
      text.includes("how can i assist you today") ||
      text.includes("1. schedule an appointment")
    );
  }

  return false;
}

function looksLikeMedicalConcern(message) {
  return Boolean(inferDepartment(message));
}

function getInitialResponse(messages, lastUserMessage) {
  if (hasAppointmentIntent(lastUserMessage)) {
    return ASK_FIRST_NAME;
  }

  if (lastAssistantMentionsAppointment(messages) && looksLikeMedicalConcern(lastUserMessage)) {
    return ASK_FIRST_NAME;
  }

  return null;
}

function getFieldPrompt(state) {
  if (!state.firstName) return ASK_FIRST_NAME;
  if (!state.lastName) return ASK_LAST_NAME;
  if (!state.dob) return ASK_DOB;
  if (!state.phone) return ASK_PHONE;
  if (!isValidPhone(state.phone)) return "Please enter a valid phone number.";
  if (!state.email) return ASK_EMAIL;
  if (!isValidEmail(state.email)) return "Please enter a valid email address.";
  if (!state.reason) return ASK_REASON;
  if (!state.department) return UNSUPPORTED_PROMPT;
  if (!state.preferredTime) return ASK_PREFERRED_TIME;
  return null;
}

function getSelectedSlotReply(state) {
  if (state.unavailablePromptIndex >= 0 && isYes(state.preferredTime)) {
    const departmentSlots = getDoctorSlotsForDepartment(state.department);
    if (departmentSlots.length > 0) {
      return formatDateTime(departmentSlots[0]);
    }
  }

  if (state.unavailablePromptIndex >= 0 && isNo(state.preferredTime)) {
    return ASK_PREFERRED_TIME;
  }

  const parsed = parseDateTime(state.preferredTime);
  if (!parsed) {
    return "Please share your preferred day and time, for example Tuesday at 10:00 AM.";
  }

  if (!isWithinClinicHours(parsed)) {
    if (state.department && state.department !== "General Medicine") {
      return buildDoctorUnavailablePrompt(state.department);
    }
    return buildUnavailablePrompt();
  }

  if (!hasMatchingDoctorSlot(state.department, parsed)) {
    return buildDoctorUnavailablePrompt(state.department);
  }

  return formatDateTime(parsed);
}

function handleSmsStep(messages, state) {
  const decision = findLastUserAfter(messages, state.smsPromptIndex);
  if (!decision) {
    return { message: ASK_SMS_UPDATES };
  }
  const normalizedDecision = toLower(decision);

  if (
    isYes(decision) ||
    normalizedDecision.includes("sms") ||
    normalizedDecision.includes("both")
  ) {
    const emailSlot = state.confirmedSlot || state.preferredTime;
    return {
      message: SMS_OPT_IN_CONFIRMED,
      sendEmail: {
        patientEmail: state.email,
        details: buildEmailDetails(state, emailSlot),
      },
      sendSms: {
        phone: state.phone,
      },
    };
  }

  if (
    isNo(decision) ||
    normalizedDecision.includes("email only") ||
    normalizedDecision.includes("just email") ||
    normalizedDecision.includes("only email")
  ) {
    const emailSlot = state.confirmedSlot || state.preferredTime;
    return {
      message: SMS_OPT_IN_DECLINED,
      sendEmail: {
        patientEmail: state.email,
        details: buildEmailDetails(state, emailSlot),
      },
    };
  }

  return { message: "Please reply with SMS, Email only, Yes, or No." };
}

function handleAppointmentFlow(messages) {
  if (!Array.isArray(messages) || messages.length === 0) {
    return null;
  }

  const lastUserMessage = findLastUserMessage(messages);
  const state = getFlowState(messages);

  if (!state.active) {
    const initialResponse = getInitialResponse(messages, lastUserMessage);
    return initialResponse ? { message: initialResponse } : null;
  }

  if (isCancel(lastUserMessage)) {
    return { message: BOOKING_CANCELLED };
  }

  if (state.smsPromptIndex >= 0) {
    return handleSmsStep(messages, state);
  }

  const fieldPrompt = getFieldPrompt(state);
  if (fieldPrompt) {
    return { message: fieldPrompt };
  }

  const selectedSlot = getSelectedSlotReply(state);
  if (selectedSlot.startsWith("That time is not available") || selectedSlot.startsWith("Please share your preferred") || selectedSlot.startsWith("Please enter")) {
    return { message: selectedSlot };
  }

  const confirmationMessage = buildConfirmation(state, selectedSlot);
  const smsPromptIndex = findLatestAssistantContaining(messages, ASK_SMS_UPDATES, 0);
  if (smsPromptIndex < 0) {
    return {
      message: confirmationMessage,
      followUpMessage: ASK_SMS_UPDATES,
    };
  }

  return handleSmsStep(messages, state);
}

module.exports = {
  handleAppointmentFlow,
};
