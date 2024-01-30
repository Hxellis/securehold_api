import express from "express";
import dbTest from "./routes/dbTest.mjs";

const app = express();
const port = 3000;

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
		msg: "Welcome to my server!",
	});
});

//set route
app.use("/dbTest", middleware, dbTest);



//establish port
app.listen(port, () => {
	console.log(`Server is running on port ${port}`);
});
