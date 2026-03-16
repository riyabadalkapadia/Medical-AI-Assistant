// doctors.js
// Hardcoded doctor list and matching logic

const doctors = [
  {
    name: "Dr. Smith",
    specialty: "Orthopedic",
    bodyPart: "knee",
    availability: ["2026-03-20 15:00", "2026-03-21 11:00", "2026-03-22 09:00"],
  },
  {
    name: "Dr. Lee",
    specialty: "Dermatology",
    bodyPart: "skin",
    availability: ["2026-03-20 10:00", "2026-03-23 13:00"],
  },
  {
    name: "Dr. Patel",
    specialty: "Cardiology",
    bodyPart: "heart",
    availability: ["2026-03-21 14:00"],
  },
  {
    name: "Dr. Adams",
    specialty: "ENT",
    bodyPart: "ear",
    availability: ["2026-03-24 16:00"],
  },
];

function getDoctors() {
  return doctors;
}

function matchDoctor(reason) {
  // Simple keyword matching
  const lowerReason = reason.toLowerCase();
  if (lowerReason.includes("knee")) return doctors[0];
  if (lowerReason.includes("skin")) return doctors[1];
  if (lowerReason.includes("heart")) return doctors[2];
  if (lowerReason.includes("ear")) return doctors[3];
  return null;
}

module.exports = {
  getDoctors,
  matchDoctor,
};
