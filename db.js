import mongoose from "mongoose";

// .env values
const USERNAME = "Hxellis"
const PASSWORD = "iWGSDlMwt4aimO9b"
const CLUSTER_NAME = "secureholdcluster"
const DB_NAME = "securehold"

const MONGO_URI = "mongodb+srv://" + USERNAME + ":" + PASSWORD + "@" + CLUSTER_NAME + ".soedthy.mongodb.net/" +  DB_NAME+ "?retryWrites=true&w=majority"

export default async function connectDB() {
    await mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('Connected to MongoDB');
    })
    .catch((error) => {
        console.error('Error connecting to MongoDB:', error);
    });
    return
}
