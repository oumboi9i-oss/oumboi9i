// index.js — backend with Socket.io (replace your current index.js)
require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const mongoose   = require('mongoose');
const { createServer } = require('http');
const { Server }       = require('socket.io');

const app        = express();
const httpServer = createServer(app);

// Lock CORS to your frontend in production by setting CLIENT_URL in the
// environment (e.g. https://your-app.vercel.app). If unset, allow all (dev).
const CLIENT_URL = process.env.CLIENT_URL || '*';

const io         = new Server(httpServer, {
  cors: { origin: CLIENT_URL, methods: ['GET','POST'] }
});

// ── Middleware ──
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: CLIENT_URL }));

// ── DB ──
mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/User')
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Error:', err));

// ── Routes ──
app.use('/api/account/login',    require('./routes/accountRoutes/Login'));
app.use('/api/account/register', require('./routes/accountRoutes/Register'));
app.use('/api/account/profile',  require('./routes/accountRoutes/getProfile'));
app.use('/api/account/pending',  require('./routes/accountRoutes/pendingAccounts'));      // admin/manager: list pending
app.use('/api/account',          require('./routes/accountRoutes/approveRejectAccount')); // PUT /:id/approve, DELETE /:id/reject

app.use('/api/doctor/add',    require('./routes/DoctorRoutes/addDoctor'));
app.use('/api/doctor/getAll', require('./routes/DoctorRoutes/getDoctors'));
app.use('/api/doctor',        require('./routes/DoctorRoutes/GetSingleDoctor'));
app.use('/api/doctor',        require('./routes/DoctorRoutes/deleteDoctor'));
app.use('/api/doctor',        require('./routes/DoctorRoutes/updateDoctor'));

app.use('/api/nurse/add',    require('./routes/nurseRoutes/addNurse'));
app.use('/api/nurse/getAll', require('./routes/nurseRoutes/getNurse'));
app.use('/api/nurse',        require('./routes/nurseRoutes/GetSingleNurse'));
app.use('/api/nurse',        require('./routes/nurseRoutes/updateNurse'));
app.use('/api/nurse',        require('./routes/nurseRoutes/deleteNurse'));

app.use('/api/pharmacist/add',    require('./routes/pharmacistRoutes/addpharmacist'));
app.use('/api/pharmacist/getAll', require('./routes/pharmacistRoutes/getpharmacist'));
app.use('/api/pharmacist',        require('./routes/pharmacistRoutes/GetSinglePharmacist'));
app.use('/api/pharmacist',        require('./routes/pharmacistRoutes/updatePharmacist'));
app.use('/api/pharmacist',        require('./routes/pharmacistRoutes/deletepharmacist'));

app.use('/api/firefighter/add',    require('./routes/FireFightersRoutes/addFireFighters'));
app.use('/api/firefighter/getAll', require('./routes/FireFightersRoutes/getFireFighter'));
app.use('/api/firefighter',        require('./routes/FireFightersRoutes/GetSingleFireFighter'));
app.use('/api/firefighter',        require('./routes/FireFightersRoutes/updateFireFighter'));
app.use('/api/firefighter',        require('./routes/FireFightersRoutes/deleteFireFighters'));

app.use('/api/garde/add',    require('./routes/gardeRoutes/addgarde'));
app.use('/api/garde/getAll', require('./routes/gardeRoutes/getgarde'));
app.use('/api/garde',        require('./routes/gardeRoutes/GetSingleGarde'));
app.use('/api/garde',        require('./routes/gardeRoutes/updateGarde'));
app.use('/api/garde',        require('./routes/gardeRoutes/deletegarde'));

// Message routes — ORDER MATTERS (specific before generic)
app.use('/api/message/add',          require('./routes/messageRoutes/addmessage'));
app.use('/api/message/getAll',       require('./routes/messageRoutes/getmessage'));
app.use('/api/message/conversation', require('./routes/messageRoutes/GetConversation'));
app.use('/api/message',              require('./routes/messageRoutes/GetSingleMessage'));
app.use('/api/message',              require('./routes/messageRoutes/updateMessage'));
app.use('/api/message',              require('./routes/messageRoutes/deletemessage'));

app.use('/api/transaction/add',    require('./routes/TransactionRoutes/addtransaction'));
app.use('/api/transaction/getAll', require('./routes/TransactionRoutes/gettransaction'));
app.use('/api/transaction',        require('./routes/TransactionRoutes/GetSingleTransaction'));
app.use('/api/transaction',        require('./routes/TransactionRoutes/updateTransaction'));
app.use('/api/transaction',        require('./routes/TransactionRoutes/deletetransaction'));

app.use('/api/email/send', require('./routes/emailHandlers/emailMain'));
app.use('/api/email',      require('./routes/emailHandlers/GetSingleEmail'));
app.use('/api/email',      require('./routes/emailHandlers/DeleteEmail'));
app.use('/api/email',      require('./routes/emailHandlers/UpdateEmail'));

const { protect, authorize } = require('./middleware/authMiddleware');
app.get('/api/admin/dashboard', protect, authorize('admin'), (req, res) => {
  res.json({ success: true, message: '🛡️ Admin Dashboard' });
});

// ══════════════════════════════════════
// SOCKET.IO — Real-time messaging + calls
// ══════════════════════════════════════
const onlineUsers = {}; // { userId: socketId }

io.on('connection', (socket) => {

  // ── Register user ──
  socket.on('register', (userId) => {
    if (!userId) return;
    onlineUsers[userId] = socket.id;
    // Broadcast updated online list
    io.emit('onlineUsers', Object.keys(onlineUsers));
    console.log(`✅ ${userId} connected`);
  });

  // ── Send message (real-time forward) ──
  socket.on('sendMessage', (msg) => {
    const receiverSocket = onlineUsers[msg.receiverId];
    if (receiverSocket) {
      io.to(receiverSocket).emit('newMessage', msg);
    }
  });

  // ── Typing indicator ──
  socket.on('typing', ({ to, from }) => {
    const receiverSocket = onlineUsers[to];
    if (receiverSocket) io.to(receiverSocket).emit('typing', { from });
  });
  socket.on('stopTyping', ({ to }) => {
    const receiverSocket = onlineUsers[to];
    if (receiverSocket) io.to(receiverSocket).emit('stopTyping');
  });

  // ── Voice/Video Call ──
  socket.on('callUser', ({ to, from, callerName, callType }) => {
    const receiverSocket = onlineUsers[to];
    if (receiverSocket) {
      io.to(receiverSocket).emit('incomingCall', { from, callerName, callType });
    }
  });
  socket.on('acceptCall', ({ to }) => {
    const receiverSocket = onlineUsers[to];
    if (receiverSocket) io.to(receiverSocket).emit('callAccepted');
  });
  socket.on('rejectCall', ({ to }) => {
    const receiverSocket = onlineUsers[to];
    if (receiverSocket) io.to(receiverSocket).emit('callRejected');
  });
  socket.on('endCall', ({ to }) => {
    const receiverSocket = onlineUsers[to];
    if (receiverSocket) io.to(receiverSocket).emit('callEnded');
  });

  // ── Disconnect ──
  socket.on('disconnect', () => {
    const userId = Object.keys(onlineUsers).find(k => onlineUsers[k] === socket.id);
    if (userId) {
      delete onlineUsers[userId];
      io.emit('onlineUsers', Object.keys(onlineUsers));
      console.log(`❌ ${userId} disconnected`);
    }
  });
});

// ── Start ──
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

module.exports = app;