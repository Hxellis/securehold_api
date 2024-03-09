import mongoose from "mongoose";



const adminsSchema = new mongoose.Schema({
    username: String,
    email: String,
    hash: String,
    salt: String,
    profile_picture: { type: String, default: null },
    registered_date: { type: Date, default: Date.now() }
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
    type: { type: String, enum: ["Users", "Lockers"]},
    title: String,
    content: String,
    admin: { type: mongoose.Schema.Types.ObjectId, ref: "admins"},
    timestamp: Date
})

const usersSchema = new mongoose.Schema({
    name: String,
    dob: Date,
    nric_passport: { type: String, unique: true},
    phone: { type: String, unique: true},
    locker_id: {type: mongoose.Schema.Types.ObjectId, ref: "lockers", default: null},
    web_data: {
        username: { type: String, default: null},
        email: { type: String, default: null, unique: true},
        hash: { type: String, default: null },
        salt: { type: String, default: null},
        last_login: { type: Date, default: null}
    },
    auth_data: {
        rfid: String,
        face: String,
        fingerprint: String
    },
    recent_activity: [{ 
        activity: String,
        timestamp: Date
    }],
    register_date: Date,
})

const lockersLocationSchema = new mongoose.Schema({
    name: String,
    city: String,
    address: String,
    active_hours: Number,
    last_active: Date, 
    status: { type: Number, enum: [0,1,2]},
    total_compartments: Number
    // lockers: [{ type: mongoose.Schema.Types.ObjectId, ref: "lockers"}]
})

const lockersSchema = new mongoose.Schema({
    locker_id: String,
    location: { type: mongoose.Schema.Types.ObjectId, ref: "locker_locations"},
    occupied_by: { type: mongoose.Schema.Types.ObjectId, ref: "users", default: null},
    door_status: { type: Boolean, default: false},
    open_count: { type: Number, default: 0},
    usage_minutes: { type: Number, default: 0},
    last_used: { type: Date, default: null}
})

const notifyAdminSchema = new mongoose.Schema({
    message: String,
    user: { type: mongoose.Types.ObjectId, ref: 'users'},
    timestamp: { type: Date, default: Date.now() }
})


export const usersModel = mongoose.model("users", usersSchema)
export const lockerLocationsModel = mongoose.model("locker_locations", lockersLocationSchema)
export const lockersModel = mongoose.model("lockers", lockersSchema)
export const adminsModel = mongoose.model("admins", adminsSchema)
export const pendingApprovalsModel = mongoose.model("pending_approvals", pendingApprovalsSchema)
export const signupCodesModel = mongoose.model("signup_codes", signupCodesSchema)
export const forgetCodesModel = mongoose.model("forget_codes", forgetCodesSchema)
export const annoucementsModel = mongoose.model('annoucements', annoucementsSchema)
export const notifyAdminModel = mongoose.model('notify_admin', notifyAdminSchema)