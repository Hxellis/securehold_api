import mongoose, { mongo } from "mongoose";

const usersSchema = new mongoose.Schema({
    name: String,
    dob: Date,
    nric_passport: String,
    phone: String,
    register_date: Date
})

const usersAppSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "users"},
    password: String,
    settings: {
        yes: String
    }
})

const lockerLocationsSchema = new mongoose.Schema({
    city: String,
    address: String,
    status: { type: Number, enum: [0,1,2]}
})

const lockersSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "users"},
    location_id: { type: mongoose.Schema.Types.ObjectId, ref: "locker_locations"},
    door_status: Boolean,
    open_count: Number,
    usage_minutes: Number,
    last_used: Date
})

const adminsSchema = new mongoose.Schema({
    username: String,
    email: String,
    hash: String,
    salt: String,
})

export const usersModel = mongoose.model("users", usersSchema)
export const usersAppModel = mongoose.model("users_app", usersAppSchema)
export const lockerLocationsModel = mongoose.model("locker_locations", lockerLocationsSchema)
export const lockersModel = mongoose.model("lockers", lockersSchema)
export const adminsModel = mongoose.model("admins", adminsSchema)