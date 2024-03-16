import express from "express";
import multer from "multer";
import mongoose from "mongoose";
import cors from 'cors'
import dotenv from 'dotenv'
import cookieParser from "cookie-parser";
import jwt from 'jsonwebtoken'

import updateOccupancyCount from "./updateLockerHistory.js";

import { admins } from "./routes/admins/admins.js";
import { dashboard } from './routes/admins/dashboard.js'
import { annoucements } from "./routes/admins/annoucements.js";
import { profile } from "./routes/admins/profile.js";
import { database } from "./routes/admins/database.js";
import { users } from  "./routes/users/users.js"
import { usersApp } from "./routes/users/usersApp.js";
import { iot } from "./routes/iot/iot.js";
import { dataAnalytics } from "./routes/admins/dataAnalytics.js";

dotenv.config()
const app = express();
const port = 3000;

app.use(express.static('public'));
app.use(cookieParser())
app.use(cors())
// app.use(cors({
// 	// origin: ['http://127.0.0.1:5500', 'http://127.0.0.1:5501'],
//   	// origin: '*',
// 	origin:  (origin, callback) => {
// 		// Check if the request comes from an allowed origin
// 		// For simplicity, you might want to implement a more secure check
// 		const allowedOrigins = ['http://127.0.0.1:5500', 'http://127.0.0.1:5501'];
		
// 		if (!origin || allowedOrigins.includes(origin)) {
// 		  callback(null, true);
// 		} else {
// 		  callback(new Error('Not allowed by CORS'));
// 		}
// 	  },
// 	credentials: true,
// }))

//sample get
app.get("/", (req, res) => {
	console.log("hi")
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
        // domain: 'localhost',
        secure: true,
        sameSite: 'none',
	}).status(200).json({
		status: 200,
		msg: "Token Cleared",
	})
})


//set route
//(path, middleware, api)
app.use("/admins/admins", multer().array(), admins)
app.use("/admins/dashboard", multer().array(), dashboard)
app.use("/admins/annoucements", multer().array(), annoucements)
app.use("/admins/profile", profile) // custom multer middleware cause image uploading
app.use("/admins/database", multer().array(), database)
app.use("/admins/dataAnalytics", multer().array(), dataAnalytics)
app.use("/users/users", multer().array(), users)
app.use("/users/usersApp", multer().array(), usersApp)
app.use("/iot/iot", express.json(), iot)

//database connection
await mongoose.connect("mongodb+srv://" + process.env.DB_USERNAME + ":" + process.env.DB_PASSWORD + "@" + process.env.DB_CLUSTER_NAME + ".soedthy.mongodb.net/" +  process.env.DB_NAME+ "?retryWrites=true&w=majority")
.then(() => {
	console.log('Connected to MongoDB'); 
	
	//establish port
	app.listen(port, () => {
		console.log(`Server is running on port ${port}`);
	});

	// dont enable if you want to test admin stuff on data analytics 
	// updateOccupancyCount()
})
.catch((error) => {
	console.error('Error connecting to MongoDB:', error);
});


