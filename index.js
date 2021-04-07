const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const mongoose = require("mongoose");
const server = require("http").createServer(app);
const io = require("socket.io")(server, {
  cors: {
    origin: ["http://127.0.0.1:3000", process.env.APP_URL],
    methods: ["GET", "POST"],
  },
});
const room = require("./src/models/rooms");
const Joi = require("joi");

const PORT = process.env.PORT || 3002;

mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function () {
  console.log("MONGO DB CONNECTED...");
});

io.on("connection", (socket) => {
  socket.on("room", function (data) {
    const meetId = data?.meetId;
    const socketId = data?.socketId;
    if (meetId !== null && meetId !== undefined) {
      this.meetId = meetId;
      this.join(meetId);
      io.to(meetId).emit("user_joined", socketId);
    }
  });

  socket.on("send_offer", function (data) {
    const socketId = data?.socketId;
    const sdp = data?.sdp;
    const id = data?.id;
    console.log(socketId);
    if (
      socketId !== null &&
      socketId !== undefined &&
      sdp !== null &&
      sdp !== undefined
    ) {
      const result = {
        sdp,
        socketId: this.id,
        id,
      };
      io.to(socketId).emit("get_offer", result);
    }
  });

  socket.on("send_answer", function (data) {
    const socketId = data?.socketId;
    const sdp = data?.sdp;
    const id = data?.id;

    if (
      socketId !== null &&
      socketId !== undefined &&
      sdp !== null &&
      sdp !== undefined
    ) {
      const result = {
        sdp,
        socketId: this.id,
        id,
      };
      io.to(socketId).emit("get_answer", result);
    }
  });

  socket.on("send_ice_candidate", function (data) {
    const socketId = data?.socketId;
    const candidates = data?.candidates;
    const pcId = data?.pcId;
    if (
      socketId !== null &&
      socketId !== undefined &&
      candidates != null &&
      candidates !== undefined &&
      pcId !== null &&
      pcId !== undefined
    ) {
      const result = {
        candidates,
        pcId,
      };
      io.to(socketId).emit("get_ice_candidates", result);
    }
  });
});

var allowList = [
  "http://127.0.0.1:3000",
  "http://localhost:3000",
  process.env.APP_URL,
];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }
      const message = `The CORS policy for this origin doesn't
  allow access from the particular origin.`;
      if (!allowList.includes(origin)) {
        return callback(new TypeError(message), false);
      }
      return callback(null, true);
    },
  })
);

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello world");
});

app.post("/host", (req, res) => {
  const user = new room({ users: req.body });
  user.save();
  res.send({ status: true, meetId: user._id });
});

app.post("/join", async (req, res) => {
  const schema = Joi.object({
    meetId: Joi.string().required(),
    email: Joi.string().required(),
    name: Joi.string().required(),
  });

  const { value, error } = schema.validate(req.body);
  if (error) {
    res.send({ status: false, error });
  }
  const roomData = await room.findOne({ _id: value.meetId });
  const users = [...roomData.users];

  const isUserAlreadyJoined = users.some((user) => user.email === value.email);
  if (!isUserAlreadyJoined) {
    users.push({
      name: value.name,
      email: value.email,
    });
    await room.findOneAndUpdate(
      { _id: roomData._id },
      { users },
      { useFindAndModify: false }
    );
  }
  res.send({ status: true, meetId: value.meetId });
});

server.listen(PORT, () => console.log(`APP RUNNING ON PORT ${PORT}`));
