import mongoose from "mongoose"
const groupSchema = new mongoose.Schema(
    {

        name : {
            type : String,
            required : true,
        },
        members : [{
            type : mongoose.Schema.Types.ObjectId,
            ref : "User",
            default : [],
            required : true,
        }],
        admins : [{
            type : mongoose.Schema.Types.ObjectId,
            ref : "User",
            default : [],
            required : true,
        }],
        messages : [{
            type : mongoose.Schema.Types.ObjectId,
            ref : "Message",
            default : [],
        }],
    },
    {timestamps : true}
);

const Group = mongoose.model("Group", groupSchema);
export default Group;

