import express from "express";
import multer from "multer";
import mongoose from "mongoose";
import cors from 'cors'
import dotenv from 'dotenv'
import cookieParser from "cookie-parser";
import jwt from 'jsonwebtoken'

import { users } from  "./routes/users.js"
import { usersApp } from "./routes/usersApp.js";
import { admins } from "./routes/admins.js";
import { dashboard } from './routes/dashboard.js'
import { annoucements } from "./routes/annoucements.js";

dotenv.config()
const app = express();
const port = 3000;

app.use(multer().array()); 
app.use(express.static('public'));
app.use(cors({
	origin: 'http://127.0.0.1:5500',
  	credentials: true,
}))
app.use(cookieParser())

//middleware
function middleware(req, res, next) {
    console.log(req.originalUrl)
    next()
}
// set middleware for all (must be above all APIs)
// app.use(middleware)

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

app.post("/clearToken", (req,res) => {
	const tokenName = req.body.tokenName
	if (tokenName) {
		return res.clearCookie(tokenName).status(200).json({
			status: 200,
			msg: "Token Cleared",
		})

	}
})


//set route
//(path, middleware, api)
app.use("/users", middleware, users)
app.use("/usersApp", usersApp)
app.use("/admins", admins)
app.use("/dashboard", dashboard)
app.use("/annoucements", annoucements)

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
