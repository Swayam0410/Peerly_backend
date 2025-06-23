import mongoose from "mongoose";
const commentSchema = new mongoose.Schema({
  comment: {
    type: String,
    required: true,
  },
  poster_email: {
    type: String,
    required: true,
  },
  poster_name:{
    type:String,
    required:true,
  }
});
const userSchema=new mongoose.Schema({
      college_id:{
        type:String,
        required:true
    },
     topic:{
        type:String,
        required:true
    },
     sem:{
        type:Number,
        required:true
    },
    name:{
        type:String,
        required:true
    },
    subject:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    email:{
        type:String
    },
   upvotes: {
  type: [String], // array of user emails
  default: [],
},viewed:{
    type:[String],
    default:[],
},
 comments: {
    type: [commentSchema], // array of comment objects
    default: [],
  }
},{
  timestamps: true
});
const User=mongoose.model('User',userSchema);
console.log(User);
export default User;
