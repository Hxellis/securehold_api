import express from "express";
import bodyParser from "body-parser";
import multer from "multer";
import cors from 'cors'

import connectDB from "./db.js";
import { dbTest } from "./routes/dbTest.js";
import { users } from  "./routes/users.js"
import { usersApp } from "./routes/usersApp.js";
import { admins } from "./routes/admins.js";

const app = express();
const port = 3000;
const upload = multer()

app.use(upload.array()); 
app.use(express.static('public'));
app.use(cors())

await connectDB()

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



//establish port
app.listen(port, () => {
	console.log(`Server is running on port ${port}`);
});
