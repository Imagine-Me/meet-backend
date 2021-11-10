const mongoose = require("mongoose");
const RoomSchema = new mongoose.Schema({
  users: [
    {
      name: {
        type: String,
        required: true,
      },
      image: String,
    },
  ],
});

const Room = mongoose.model("room", RoomSchema);

module.exports = Room;
