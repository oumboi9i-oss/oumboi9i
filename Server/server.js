const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

// ✅ Socket.io Setup
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
});

// ✅ Make io available globally (for use in routes)
global.io = io;

// ✅ Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  }),
);

// ✅ Database Connection
const mongoUri =
  process.env.MONGODB_URI ||
  process.env.MONGO_URI ||
  "mongodb://127.0.0.1:27017/User";
mongoose
  .connect(mongoUri)
  .then(() => console.log("✅ MongoDB Connected Successfully"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// ✅ Socket.io Connection Handler
io.on("connection", (socket) => {
  console.log("✅ مستخدم متصل:", socket.id);

  socket.on("join_room", (userId) => {
    socket.join(userId);
    console.log(`🔗 المستخدم ${userId} انضم إلى غرفته`);
  });

  socket.on("send_message", (data) => {
    socket.to(data.receiverId).emit("receive_message", data);
  });

  socket.on("disconnect", () => {
    console.log("❌ مستخدم غير متصل");
  });
});

// ✅ Account Routes
app.use("/api/account/login", require("./routes/accountRoutes/Login"));
app.use("/api/account/register", require("./routes/accountRoutes/Register"));
app.use("/api/account/admin-register", require("./routes/accountRoutes/adminRegister"));
app.use("/api/account/pending", require("./routes/accountRoutes/pendingAccounts"));
app.use("/api/account", require("./routes/accountRoutes/approveRejectAccount"));
app.use("/api/account/profile", require("./routes/accountRoutes/getProfile"));
app.use("/api/user/profile", require("./routes/accountRoutes/getUserProfile"));

// ✅ Doctor Routes
app.use("/api/doctor/add", require("./routes/DoctorRoutes/addDoctor"));
app.use("/api/doctor/getAll", require("./routes/DoctorRoutes/getDoctors"));
app.use("/api/doctor", require("./routes/DoctorRoutes/GetSingleDoctor"));
app.use("/api/doctor", require("./routes/DoctorRoutes/deleteDoctor"));
app.use("/api/doctor", require("./routes/DoctorRoutes/updateDoctor"));

// ✅ Nurse Routes
app.use("/api/nurse/add", require("./routes/nurseRoutes/addNurse"));
app.use("/api/nurse/getAll", require("./routes/nurseRoutes/getnurse"));
app.use("/api/nurse", require("./routes/nurseRoutes/GetSingleNurse"));
app.use("/api/nurse", require("./routes/nurseRoutes/updateNurse"));
app.use("/api/nurse", require("./routes/nurseRoutes/deleteNurse"));

// ✅ Pharmacist Routes
app.use(
  "/api/pharmacist/add",
  require("./routes/pharmacistRoutes/addpharmacist"),
);
app.use(
  "/api/pharmacist/getAll",
  require("./routes/pharmacistRoutes/getpharmacist"),
);
app.use(
  "/api/pharmacist",
  require("./routes/pharmacistRoutes/GetSinglePharmacist"),
);
app.use(
  "/api/pharmacist",
  require("./routes/pharmacistRoutes/updatePharmacist"),
);
app.use(
  "/api/pharmacist",
  require("./routes/pharmacistRoutes/deletepharmacist"),
);

// ✅ FireFighter Routes
app.use(
  "/api/firefighter/add",
  require("./routes/FireFightersRoutes/addFireFighters"),
);
app.use(
  "/api/firefighter/getAll",
  require("./routes/FireFightersRoutes/getFireFighter"),
);
app.use(
  "/api/firefighter",
  require("./routes/FireFightersRoutes/GetSingleFireFighter"),
);
app.use(
  "/api/firefighter",
  require("./routes/FireFightersRoutes/updateFireFighter"),
);
app.use(
  "/api/firefighter",
  require("./routes/FireFightersRoutes/deleteFireFighters"),
);

// ✅ Manager Routes
app.use("/api/manager/add", require("./routes/ManagerRoutes/addManager"));
app.use("/api/manager/getAll", require("./routes/ManagerRoutes/getManager"));
app.use("/api/manager", require("./routes/ManagerRoutes/GetSingleManager"));
app.use("/api/manager", require("./routes/ManagerRoutes/updateManager"));
app.use("/api/manager", require("./routes/ManagerRoutes/deleteManager"));
// ✅ Garde Routes
app.use("/api/garde/add", require("./routes/gardeRoutes/addgarde"));
app.use("/api/garde/getAll", require("./routes/gardeRoutes/getgarde"));
app.use("/api/garde", require("./routes/gardeRoutes/GetSingleGarde"));
app.use("/api/garde", require("./routes/gardeRoutes/updateGarde"));
app.use("/api/garde", require("./routes/gardeRoutes/deleteGarde"));

// ✅ Message Routes
app.use("/api/message/add", require("./routes/messageRoutes/addmessage"));
app.use("/api/message/getAll", require("./routes/messageRoutes/getmessage"));
app.use(
  "/api/message/conversation",
  require("./routes/messageRoutes/GetConversation"),
);
app.use("/api/message", require("./routes/messageRoutes/GetSingleMessage"));
app.use("/api/message", require("./routes/messageRoutes/updateMessage"));
app.use("/api/message", require("./routes/messageRoutes/deletemessage"));

// ✅ Transaction Routes
app.use(
  "/api/transaction/add",
  require("./routes/TransactionRoutes/addtransaction"),
);
app.use(
  "/api/transaction/getAll",
  require("./routes/TransactionRoutes/gettransaction"),
);
app.use(
  "/api/transaction",
  require("./routes/TransactionRoutes/GetSingleTransaction"),
);
app.use(
  "/api/transaction",
  require("./routes/TransactionRoutes/updateTransaction"),
);
app.use(
  "/api/transaction",
  require("./routes/TransactionRoutes/deletetransaction"),
);

// ✅ Email Routes
app.use("/api/email/send", require("./routes/emailHandlers/emailMain"));
app.use("/api/email", require("./routes/emailHandlers/GetSingleEmail"));
app.use("/api/email", require("./routes/emailHandlers/DeleteEmail"));
app.use("/api/email", require("./routes/emailHandlers/UpdateEmail"));

// ✅ Demande & Notification Routes
app.use("/api/demande", require("./routes/demandeRoutes/demandeRoutes"));
app.use(
  "/api/notification",
  require("./routes/notificationRoutes/notificationRoutes"),
);

// ✅ Facility Routes
app.use('/api/facilities', require('./routes/facilityRoutes/getFacilities'));
app.use('/api/account/setLocation', require('./routes/facilityRoutes/setLocation'));

// ✅ Admin Protected Routes
const { protect, authorize } = require("./middleware/authMiddleware");
app.get("/api/admin/dashboard", protect, authorize("admin"), (req, res) => {
  res.json({
    success: true,
    message: "🛡️ Admin Dashboard",
    adminId: req.user.id,
  });
});

// ✅ Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🔌 Socket.io is active on port ${PORT}`);
  console.log(`🌐 global.io is available for routes`);
});

module.exports = { app, io };
