const express = require('express');
const jwt = require('jsonwebtoken');
const app = express();
require('dotenv').config()

app.use(express.json());

const dbconnect = require('./dbconnect.js');
const userModel = require('./user_schema.js');
const jwtSecret = process.env.JWT_SECRET || 'local-development-secret';

/*
In the postman use the following URL
localhost:5000/reg

{
  "firstname":"Joe",
  "email":"a@gmail.com",
  "password":"abc",
  "mobile": 12345678,
  "role": "student"
}

*/

app.get(["/", "/user"],  (req,res) => {
    res.send("User Page")
})

app.get("/user/:email", async (req, res) => {
  try {
    const user = await userModel.findOne({ email: req.params.email.trim().toLowerCase() })
      .select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json(user);
  } catch (error) {
    console.error("User lookup failed:", error);
    return res.status(500).json({ message: "Unable to retrieve user" });
  }
});

function getAuthenticatedEmail(req) {
  const forwardedEmail = req.headers['x-authenticated-user-email'];
  if (forwardedEmail) {
    return forwardedEmail.trim().toLowerCase();
  }

  const authorization = req.headers.authorization || '';
  if (!authorization.startsWith('Bearer ')) {
    return null;
  }

  const token = authorization.slice(7);
  const user = jwt.verify(token, jwtSecret);
  return user.email.trim().toLowerCase();
}

app.get(["/viewprofile", "/user/viewprofile"], async (req, res) => {
  try {
    const email = getAuthenticatedEmail(req);
    if (!email) {
      return res.status(401).json({ message: "Bearer token is required" });
    }

    const user = await userModel.findOne({ email }).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json(user);
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
});

app.put(["/updateprofile", "/user/updateprofile"], async (req, res) => {
  try {
    const email = getAuthenticatedEmail(req);
    if (!email) {
      return res.status(401).json({ message: "Bearer token is required" });
    }

    const updates = {};
    if (typeof req.body.name === "string" && req.body.name.trim()) {
      updates.name = req.body.name.trim();
    }
    if (req.body.phone !== undefined) {
      updates.phone = String(req.body.phone).trim();
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "Provide name or phone to update" });
    }

    const user = await userModel.findOneAndUpdate(
      { email },
      { $set: updates },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({ message: "Profile updated successfully", user });
  } catch (error) {
    console.error("Profile update failed:", error);
    return res.status(500).json({ message: "Unable to update profile" });
  }
});



// START THE EXPRESS SERVER. 5000 is the PORT NUMBER
app.listen(5002, () => console.log('EXPRESS Server Started at Port No: 5002'));
