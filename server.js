import express from "express";
import multer from "multer";
import mongoose from "mongoose";
import cors from 'cors'
import dotenv from 'dotenv'
import cookieParser from "cookie-parser";
import session from "express-session";
import jwt from 'jsonwebtoken'

import { users } from  "./routes/users/users.js"
import { admins } from "./routes/admins/admins.js";
import { dashboard } from './routes/admins/dashboard.js'
import { annoucements } from "./routes/admins/annoucements.js";
import { profile } from "./routes/admins/profile.js";
import { database } from "./routes/admins/database.js";

dotenv.config()
const app = express();
const port = 3000;

app.use(express.static('public'));
app.use(cors({
	origin: 'http://127.0.0.1:5500',
  	credentials: true,
}))
app.use(cookieParser())
// app.use( session({
// 	secret: process.env.SESSION_KEY,
// 	// resave: false,
// 	// saveUninitialized: false
// }))

//sample get
app.get("/", (req, res) => {
	res.status(200).json({
		status: 200,
		msg: "securehold API accessed",
	});
});

app.get("/checkToken", (req, res) => {
	const token = req.cookies.access_token;
	if (!token) {
		return res.status(200).send({
			status: 403,
			msg: "No access token found"
		});
	}
	try {
		const decodedToken = jwt.verify(token, process.env.JWT_KEY)
		return res.status(200).json({
			status: 200,
			msg: "User has session",
			user: decodedToken,
		});
	}
	catch (e) {
		return res.status(200).json({
			status: 403,
			msg: "User loss session",
		})
	}
})


app.get("/clearToken", (req,res) => {
	return res.clearCookie("access_token", {
		httpOnly: true,
        domain: 'localhost',
        secure: true,
        sameSite: 'none',
	}).status(200).json({
		status: 200,
		msg: "Token Cleared",
	})
})


//set route
//(path, middleware, api)
app.use("/users/users", multer().array(), users)
app.use("/admins/admins", multer().array(), admins)
app.use("/admins/dashboard", multer().array(), dashboard)
app.use("/admins/annoucements", multer().array(), annoucements)
app.use("/admins/profile", profile) // custom multer middleware cause image uploading
app.use("/admins/database", multer().array(), database)

//database connection
await mongoose.connect("mongodb+srv://" + process.env.DB_USERNAME + ":" + process.env.DB_PASSWORD + "@" + process.env.DB_CLUSTER_NAME + ".soedthy.mongodb.net/" +  process.env.DB_NAME+ "?retryWrites=true&w=majority")
.then(() => {
	console.log('Connected to MongoDB'); 
})
.catch((error) => {
	console.error('Error connecting to MongoDB:', error);
});


//establish port
app.listen(port, () => {
	console.log(`Server is running on port ${port}`);
});
