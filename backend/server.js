const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

const chatRoutes = require("./routes/chat");
const scheduleRoutes = require("./routes/schedule");
const callRoutes = require("./routes/call");
const startCallRoutes = require("./routes/start-call");
const doctorsService = require("./services/doctors");

const app = express();
app.use(cors());
app.use(express.json());

// API Endpoints
app.use("/chat", chatRoutes);
app.use("/schedule", scheduleRoutes);
app.use("/call", callRoutes);
app.use("/start-call", startCallRoutes);

// GET /doctors - returns doctor list
app.get("/doctors", (req, res) => {
  res.json(doctorsService.getDoctors());
});

// Health check
app.get("/", (req, res) => {
  res.send("AI Healthcare Scheduling Assistant Backend");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
