import express from "express";
import multer from "multer";
import mongoose from "mongoose";
import cors from 'cors'
import dotenv from 'dotenv'

import { dbTest } from "./routes/dbTest.js";
import { users } from  "./routes/users.js"
import { usersApp } from "./routes/usersApp.js";
import { admins } from "./routes/admins.js";

dotenv.config()
const app = express();
const port = 3000;

app.use(multer().array()); 
app.use(express.static('public'));
app.use(cors())

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

//set route
app.use("/dbTest", middleware, dbTest); //middleware declaration must be before the api
app.use("/users", middleware, users)
app.use("/usersApp", usersApp)
app.use("/admins", admins)


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
