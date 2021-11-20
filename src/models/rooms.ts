const mongoose = require("mongoose");
const RoomSchema = new mongoose.Schema({
  users: [
    {
      name: {
        type: String,
        required: true,
      },
    },
  ],
});

const Room = mongoose.model("room", RoomSchema);

export default Room;
