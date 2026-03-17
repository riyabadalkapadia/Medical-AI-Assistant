// email.js
// Placeholder email service
function sendAppointmentEmail(patientEmail, appointmentDetails) {
  // Simulate sending email
  console.log(
    `Email sent to ${patientEmail}: Appointment confirmed with ${appointmentDetails.doctor.name} on ${appointmentDetails.time}`,
  );
}

module.exports = { sendAppointmentEmail };
