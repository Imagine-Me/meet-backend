import { Socket } from "socket.io";
const express = require('express')
const application = express();
const cors = require("cors");
require("dotenv").config();
const mongoose = require("mongoose");
const server = require("http").createServer(application);

var allowList = [
  "http://127.0.0.1:3000",
  "http://localhost:3000",
  process.env.APP_URL,
];

const io = require("socket.io")(server, {
  cors: {
    origin: allowList,
    methods: ["GET", "POST"],
  },
});
import room from './models/rooms';
import Joi = require("joi");

const PORT = process.env.PORT || 3002;

mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function () { });

interface ConnectionType {
  socketTo: string;
  socketFrom: string;
  sdp: any;
  id: string;
  name: string;
  audio: boolean;
  video: boolean
}

io.on("connection", (socket: Socket) => {
  socket.on("room", function (this: any, data) {
    const meetId = data?.meetId;
    const socketId = data?.socketId;
    if (meetId !== null && meetId !== undefined) {
      this.meetId = meetId;
      this.join(meetId);
      const users = Array.from(io.sockets.adapter.rooms.get(meetId)).filter(
        (id) => id !== socketId
      );
      io.to(socketId).emit("get_users", users);
    }
  });

  socket.on("get_offer", function (data) {
    const socketFrom = data?.socketFrom;
    const socketTo = data?.socketTo;
    io.to(socketTo).emit("get_offer_request", socketFrom);
  });

  socket.on("send_offer", function (data: ConnectionType) {
    io.to(data.socketTo).emit("get_offer", data);
  });

  socket.on("send_answer", function (data: ConnectionType) {
    io.to(data.socketTo).emit("get_answer", data);
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

  socket.on("toggle_audio", function (this: any, data) {
    const result = {
      socket: socket.id,
      ...data
    }
    io.to(this.meetId).emit("audio_toggle", result);
  });

  socket.on("toggle_video", function (this: any, data) {
    const result = {
      socket: socket.id,
      ...data
    }
    io.to(this.meetId).emit("video_toggle", result);
  });

  socket.on("disconnect", function (this: any) {
    io.to(this.meetId).emit("disconnected", this.id);
  });
});

application.use(
  cors({
    origin(origin: any, callback: any) {
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

application.use(express.json());
application.set('case sensitive routing', true)

application.get("/", (req: any, res: any) => {
  res.send("Hello world");
});

application.post("/host", (req: any, res: any) => {
  const user = new room({ users: req.body });
  user.save();
  res.send({ status: true, meetId: user._id });
});

application.post("/join", async (req: any, res: any) => {
  const schema = Joi.object({
    meetId: Joi.string().required(),
    name: Joi.string().required(),
  });

  const { value, error } = schema.validate(req.body);
  if (error) {
    res.send({ status: false, error });
  }
  const roomData = await room.findOne({ _id: value.meetId });
  const users = [...roomData.users];
  users.push({
    name: value.name,
  });
  await room.findOneAndUpdate(
    { _id: roomData._id },
    { users },
    { useFindAndModify: false }
  );
  res.send({ status: true, meetId: value.meetId });
});

server.listen(PORT, () =>
  console.log(`APP RUNNING ON PORT ${PORT} ${process.env.APP_URL}`)
);
