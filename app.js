import express from "express";
import cors from "cors";
import User from "./models/user.js";
import dbConnect from "./db.js";
import mongoose from "mongoose";
import { clerkClient } from "@clerk/clerk-sdk-node";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";


dotenv.config();


const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const app=express();
const port=process.env.PORT || 1000;
app.use(express.json());
app.use(cors({
  origin: `${process.env.FRONTEND_URL}`,
  methods: ["GET","POST","OPTIONS","DELETE","PATCH","PUT"],
  allowedHeaders: ["Content-Type"]
}));
dbConnect();

app.post("/form",async (req,res)=>{
  try{
    const data=req.body;
    console.log(data.email);
    const newEntry = new User(data);
    await newEntry.save();
    res.status(201).send("Data saved to MongoDB");
  }catch(err){
    console.error(err);
  }
});

// PATCH /posts/:id/comments



// app.get("/",async (req,res)=>{
//   try{
//     const data=await User.find({});
//     res.send(JSON.stringify(data));
//     console.log(JSON.stringify(data));

//   }catch(err){
//     console.log(error);
//   }
// })
// routes/items.js or in your main route file
app.get(`/`, async (req, res) => {
  try {
    const { semester } = req.query;

    // Build query object dynamically
    let query = {};
    if (semester) query.sem = Number(semester)  ;
    const data = await User.find(query);
      res.send(JSON.stringifwy(data));
  } catch (err) {
    console.log("error fetching data from server/mongo",err);
  }
});


app.get('/performance/:email', async (req, res) => {
  const { email } = req.params;
  console.log("Fetching performance for:", email);

  try {
    const posts = await User.find({ email });

    if (!posts || posts.length === 0) {
      return res.status(200).json({ message: "No postings from your side." });
    }

    res.status(200).json(posts);
  } catch (err) {
    console.error("Error fetching performance data:", err);
    res.status(500).json({ error: "Server error" });
  }
});



app.get('/edit/:id',async (req,res)=>{
  const {id}=req.params;
  console.log(id);
  console.log(1);
  try{
    const data=await User.findById(id);
    if(!data)return res.status(404).json({ error: "Session not found" });
    res.send(JSON.stringify(data));
  }catch(err){
    console.log("error fetching data for the edit",err);
  }
});

app.put('/edit/:id', async (req, res) => {
  const { id } = req.params;
  const updatedData = req.body;

  try {
    const updatedSession = await User.findByIdAndUpdate(id, updatedData, {
      new: true,
      overwrite: false, // ← use false to update fields without replacing whole document
    });

    if (!updatedSession)
      return res.status(404).json({ error: "Session not found" });

    res.json(updatedSession);
  } catch (err) {
    res.status(500).json({ error: "Error updating session" });
  }
});

app.patch("/", async (req, res) => {
  const { userEmail } = req.body; // Email of the logged-in user
  const { id } = req.body;

  try {
    const post = await User.findById(id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    const alreadyUpvoted = post.upvotes.includes(userEmail);

    if (alreadyUpvoted) {
      // ❌ Remove upvote
      post.upvotes = post.upvotes.filter((email) => email !== userEmail);
    } else {
      // ✅ Add upvote
      post.upvotes.push(userEmail);
    }

    await post.save();

    return res.status(200).json({
      upvotes: post.upvotes,
      count: post.upvotes.length,
      upvoted: !alreadyUpvoted,
    });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});


app.patch("/article/:id", async (req, res) => {
  const { id } = req.params;
  const { comment, poster_email, poster_name } = req.body;

  try {
    const post = await User.findById(id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    post.comments.push({ comment, poster_email, poster_name });
    await post.save();

    res.json({ message: "Comment added", comments: post.comments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      
      error: "Internal server error" });
  }
});

app.patch('/addview', async (req, res) => {
  const { _id, email } = req.body;

  if (!_id || !email) {
    return res.status(400).json({ error: 'Post ID and email are required.' });
  }

  try {
      const post = await User.findById(_id);

    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    if (!post.viewed.includes(email)) {
      post.viewed.push(email);
      await post.save();
    }

    res.status(200).json({
      message: 'View recorded',
      viewsCount: post.viewed.length,
      post
    });
  } catch (error) {
    console.error('Error updating views:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

app.delete("/article/:id", async (req, res) => {
  const { id } = req.params;
  const { _id } = req.body;

  try {
    const article = await User.findById(id);
    if (!article) return res.status(404).json({ error: "Article not found" });

    // Fix: convert ObjectId to string before comparing
    article.comments = article.comments.filter(
      (comment) => comment._id.toString() !== _id
    );

    await article.save();

    res.json({ message: "Comment deleted", comments: article.comments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/leaderboard", async (req, res) => {
  try {
      const data = await User.aggregate([
      {
        $group: {
          _id: "$email",
          totalUpvotes: { $sum: { $size: "$upvotes" } },
        },
      },
      { $sort: { totalUpvotes: -1 } },
    ]);
  const withNames = await Promise.all(
  data.map(async (entry) => {
    try {
      const { data: users } = await clerkClient.users.getUserList({ limit: 100 });

      const user = users.find((u) =>
        u.emailAddresses.some((e) => e.emailAddress === entry._id)
      );

      return {
        ...entry,
        name: user ? user.username : "Unknown",
      };
    } catch (err) {
      console.error("Error fetching user for email:", entry._id, err);
      return {
        ...entry,
        name: "Unknown",
      };
    }
  })
);


res.json(withNames);
    
  } catch (err) {
    console.error("Error generating leaderboard:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/generatesummary", async (req, res) => {
  try {
    const { description, topic, subject } = req.body;

    const model = genAI.getGenerativeModel({ model: "models/gemini-1.5-flash" });

    const result = await model.generateContent(
      `You have to create a summary of the following learning content. 
       The summary will be converted to audio, so keep it clear and under 2900 words. 
       Topic: ${topic}
       Subject: ${subject}
       Content: ${description}`
    );

    const response = await result.response;
    const summary = response.text();

    res.json({ summary });
  } catch (error) {
    console.error("Error summarizing content:", error.message);
    res.status(500).json({ error: "Failed to summarize content." });
  }
});




app.post("/analyze", async (req, res) => {
  try {
    // You typically don't need to call listModels() here.
    // The getGenerativeModel() function is sufficient to initialize the model.
    // const models = await genAI.listModels(); // <-- Remove this line

    const { content } = req.body;

    // Ensure genAI is properly initialized and accessible here.
    // Assuming 'genAI' is initialized elsewhere in your code like:
    // import { GoogleGenerativeAI } from "@google/generative-ai";
    // const genAI = new GoogleGenerativeAI(process.env.API_KEY);

  const model = genAI.getGenerativeModel({ model: "models/gemini-1.5-flash" });
// Use "gemini-pro" directly

    const result = await model.generateContent(`You are a helpful assistant that provides suggestions and improvements on educational content\n
      Please review the following learning explanation and suggest improvements or corrections:
1. Pointing out errors (if any),
2. Suggesting improvements (clarity, grammar, structure),
3. Rewriting the improved version.\n${content}`);
    const response = await result.response;
    const suggestion = response.text();

    res.json({ suggestion });
  } catch (error) {
    console.error("Error analyzing content:", error.message);
    res.status(500).json({ error: "Failed to analyze content." });
  }
});

app.delete('/form', async (req, res) => {
  const { _id } = req.body;
  console.log(typeof _id);
  console.log(mongoose.Types.ObjectId.isValid(_id));  // Should return true

  try {
    const deleted = await User.findByIdAndDelete({_id:_id});
    if (!deleted) {
      return res.status(404).json({ message: 'Article not found' });
    }
    res.json({ message: 'Article deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
});


app.listen(port,()=>{
  console.log(`App running on port ${port}`)
});