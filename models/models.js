import mongoose from "mongoose";



const adminsSchema = new mongoose.Schema({
    username: String,
    email: String,
    hash: String,
    salt: String,
    profile_picture: { type: String, default: null },
    registered_date: Date
})

const pendingApprovalsSchema = new mongoose.Schema({
    username: String,
    email: String,
    hash: String,
    salt: String,
})

const signupCodesSchema = new mongoose.Schema({
    email: String,
    code: String,
    timestamp: Date
})

const forgetCodesSchema = new mongoose.Schema({
    email: String,
    code: String,
    timestamp: Date
})

const annoucementsSchema = new mongoose.Schema({
    title: String,
    content: String,
    admin: { type: mongoose.Schema.Types.ObjectId, ref: "admins"},
    timestamp: Date
})

const usersSchema = new mongoose.Schema({
    name: String,
    dob: Date,
    nric_passport: String,
    phone: String,
    locker_id: {type: mongoose.Schema.Types.ObjectId, ref: "lockers"},
    web_data: {
        user_id: { type: String, default: null},
        hash: { type: String, default: null },
        salt: { type: String, default: null}
    },
    auth_data: {
        rfid: String,
        face: String,
        fingerprint: String
    },
    register_date: Date
})


const lockersLocationSchema = new mongoose.Schema({
    city: String,
    address: String,
    status: { type: Number, enum: [0,1,2]},
    lockers: [{ type: mongoose.Schema.Types.ObjectId, ref: "lockers"}]
})

const lockersSchema = new mongoose.Schema({
    occupied_by: { type: mongoose.Schema.Types.ObjectId, ref: "users", default: null},
    door_status: Boolean,
    open_count: Number,
    usage_minutes: Number,
    last_used: Date
})


export const usersModel = mongoose.model("users", usersSchema)
// export const usersAppModel = mongoose.model("users_app", usersAppSchema)
// export const lockerLocationsModel = mongoose.model("locker_locations", lockerLocationsSchema)
// export const lockersModel = mongoose.model("lockers", lockersSchema)
export const adminsModel = mongoose.model("admins", adminsSchema)
export const pendingApprovalsModel = mongoose.model("pending_approvals", pendingApprovalsSchema)
export const signupCodesModel = mongoose.model("signup_codes", signupCodesSchema)
export const forgetCodesModel = mongoose.model("forget_codes", forgetCodesSchema)
export const annoucementsModel = mongoose.model('annoucements', annoucementsSchema)