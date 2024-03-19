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
        type: {
            username: String,
            email: String,
            hash: String,
            salt: String,
            last_login: Date
        },
        default: null
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
    active_hours: { type: Number, default: 0},
    last_active: { type: Date, default: null }, 
    status: { type: Number, enum: [0,1,2], default: 0},
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

// capped schema - max 5
//db.runCommand( { collMod: "locker_history", cappedMax: 69 } )   to change max documents
const lockerHistorySchema = new mongoose.Schema({
    occupancy_count:  { 
        type: [{
            location_id: {type: mongoose.Schema.Types.ObjectId, ref: "locker_locations"},
            occupied: Number,
            total: Number
        }],
        default: []
    },
    demand_forecast: {
        hour_interval: Number,
        open_counts: {
            type: [{
                location_id: {type: mongoose.Schema.Types.ObjectId, ref: "locker_locations"},
                count: [Number],
            }],
            default: []
        }
    },
    date: Date
})

export const usersModel = mongoose.model("users", usersSchema)
export const lockerLocationsModel = mongoose.model("locker_locations", lockersLocationSchema)
export const lockersModel = mongoose.model("lockers", lockersSchema)
export const adminsModel = mongoose.model("admins", adminsSchema)
export const pendingApprovalsModel = mongoose.model("pending_approvals", pendingApprovalsSchema)
export const signupCodesModel = mongoose.model("signup_codes", signupCodesSchema)
export const forgetCodesModel = mongoose.model("forget_codes", forgetCodesSchema)
export const annoucementsModel = mongoose.model('annoucements', annoucementsSchema)
export const notifyAdminModel = mongoose.model('notify_admins', notifyAdminSchema)
export const lockerHistoryModel = mongoose.model('locker_history', lockerHistorySchema, 'locker_history')