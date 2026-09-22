const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const crmRoutes = require("./routes/crmRoutes");
const stageRoutes = require("./routes/stageRoutes");
const workflowRoutes = require("./routes/workflowRoutes");
const formRoutes = require("./routes/formRoutes");
const leadRoutes = require("./routes/leadRoutes");
const userRoutes = require("./routes/users");
const teamRoutes = require("./routes/teams");
const automationRoutes = require("./routes/automationRoutes");
const reminderRoutes = require("./routes/reminderRoutes");
const {startScheduler} = require("./services/scheduler");
const http = require("http");
const { Server } = require("socket.io");
const {setIO} = require("./services/notificationService");
const notificationRoutes = require("./routes/notificationRoutes");

dotenv.config();
console.log("MONGO_URI exists:", !!process.env.MONGO_URI);
console.log(
  "MONGO_URI type:",
  typeof process.env.MONGO_URI
);
console.log(
  "MONGO_URI protocol:",
  process.env.MONGO_URI
    ? process.env.MONGO_URI.split("://")[0]
    : "missing"
);

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('API is running');
});

app.use('/api/auth', authRoutes);

app.use('/api/crms', crmRoutes);

app.use("/api/stages", stageRoutes);

app.use("/api/workflows", workflowRoutes);

app.use("/api/forms", formRoutes);

app.use("/api/leads", leadRoutes);

app.use("/api/users", userRoutes);

app.use("/api/teams", teamRoutes);

app.use("/api/automations", automationRoutes);

app.use("/api/reminders", reminderRoutes);

app.use("/api/notifications",notificationRoutes);


const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

setIO(io);

io.on("connection", (socket) => {
  console.log(
    "Socket connected:",
    socket.id
  );

  socket.on("join_user", (userId) => {
    socket.join(`user:${userId}`);

    console.log(
      `User ${userId} joined notification room`
    );
  });

  socket.on("disconnect", () => {
    console.log(
      "Socket disconnected:",
      socket.id
    );
  });
});

const startServer = async () => {
  try {
    await connectDB();

    startScheduler();

    server.listen(PORT, () => {
      console.log(
        `Server running on port ${PORT}`
      );
    });
  } catch (error) {
    console.error(
      "Server startup failed:",
      error.message
    );

    process.exit(1);
  }
};

startServer();