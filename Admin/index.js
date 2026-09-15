const express = require('express');
const app = express();

app.use(express.json());

const dbconnect = require('./dbconnect.js');
const UserModel = require('./user_schema.js');


app.get("/", (req,res) => {
    res.send("Hello Admin")
})

app.get("/ad", (req,res) => {
    res.send("Send some requests")
})

app.get(["/admin/searchuser", "/searchuser"], async (req, res) => {
    const search = (req.query.search || req.query.name || req.query.emailid || req.query.email || "").trim();

    if (!search) {
        return res.status(400).json({ message: "Provide search, name, or emailid" });
    }

    try {
        const users = await UserModel.find({
            $or: [
                { name: { $regex: search, $options: "i" } },
                { email: search.toLowerCase() }
            ]
        }).select("-password");

        if (users.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.json({ count: users.length, users });
    } catch (error) {
        console.error("User search failed:", error);
        return res.status(500).json({ message: "Unable to search users" });
    }
});

app.get(["/admin/viewalluser", "/viewalluser"], async (req, res) => {
    try {
        const users = await UserModel.find().select("-password");
        return res.json({ count: users.length, users });
    } catch (error) {
        console.error("View all users failed:", error);
        return res.status(500).json({ message: "Unable to retrieve users" });
    }
});

app.delete(["/admin/deluser", "/deluser", "/admin/deluser/:emailid", "/deluser/:emailid"], async (req, res) => {
    const emailid = (req.params.emailid || req.query.emailid || req.body.emailid || req.body.email || "").trim().toLowerCase();

    if (!emailid) {
        return res.status(400).json({ message: "Provide emailid" });
    }

    try {
        const result = await UserModel.deleteOne({ email: emailid });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.json({ message: "User deleted successfully", emailid });
    } catch (error) {
        console.error("Delete user failed:", error);
        return res.status(500).json({ message: "Unable to delete user" });
    }
});

// START THE EXPRESS SERVER. 5000 is the PORT NUMBER
app.listen(5001, () => console.log('EXPRESS Server Started at Port No: 5001'));
