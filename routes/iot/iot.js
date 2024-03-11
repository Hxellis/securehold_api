import express from 'express'
import { usersModel, annoucementsModel, lockersModel, lockerLocationsModel } from '../../models/models.js'
import errorMessage from '../../apiErrorMessage.js'
import dotenv from 'dotenv'


dotenv.config()

export const iot  = express.Router()

iot.get("/testApi", async (req, res) => {
    console.log("entered")
    return res.status(200).json({
        status: 200,
        msg: "ligma balls"
    })
})

iot.get("/getAnnouncements", async (req, res) => {
    try {
        const resp = await annoucementsModel.find({ type: "Lockers"}, {content: 1, _id: 0}).sort({ _id: -1}).limit(1);
        const contents = resp.map(announcement => announcement.content).join(", ");
        return res.status(200).json({
            status: 200,
            msg: "Locker announcements received",
            announcements: contents
        });
    } catch (e) {
        errorMessage(e, res);
    }
})

iot.post("/getUserData", async (req, res) => {
    try {
        const rfid  = req.body.rfid
        console.log(rfid)
        const userData  = await usersModel.findOne( { 'auth_data.rfid': rfid }, {projection: { 'web_data.hash': false, 'web_data.salt': false}})
        console.log(userData)
        if (userData) {
            const userName = userData.name
            const userFinger = userData.auth_data.fingerprint;
            return res.status(200).json({
                status: 200,
                msg: "Retrieved user data",
                userData: userData,
                userName: userName,
                userFinger: userFinger
            })
        }
        else {
            return res.status(200).json({
                status: 400,
                msg: "No user data",
                userData: null,
                userName: null,
                userFinger: null
            })
        }
    }
    catch (e) {
        return errorMessage(e, res)
    }
})

iot.post("/assignLocker", async (req, res) => {
    try {
        const userId = req.body.userId
        const lockerId = req.body.lockerId

        // const locker = await lockersModel.findOne({ location: locationId, occupied_by: null})

        // if (locker) {
            await lockersModel.findOneAndUpdate({ _id: lockerId }, { $set: { occupied_by: userId}})
            await usersModel.findOneAndUpdate( { _id: userId}, { $set: { locker_id: lockerId } })

            return res.status(200).json({
                status: 200,
                msg: "Locker assigned",
                lockerId: lockerId
            })
        // }
        // else {
        //     return res.status(200).json({
        //         status: 403,
        //         msg: "No more lockers available at this location"
        //     })
        // }
    }
    catch (e) {
        return errorMessage(e, res)
    }
})

iot.post("/terminateLocker", async (req, res) => {
    try {
        const userId = req.body.userId

        const user =  await usersModel.findOne({ _id: userId })

        if (user) {
            await lockersModel.findOneAndUpdate({ occupied_by: user._id }, { $set: { occupied_by: null}})
            await usersModel.findOneAndUpdate( { _id: user._id }, { $set: { locker_id: null }})

            return res.status(200).json({
                staus: 200,
                msg: "Locker terminated"
            })
        }
        else {
            return res.status(200).json({
                status: 400,
                msg: "userId not found"
            })
        }
    }
    catch (e) {
        return errorMessage(e,res)
    }
})

iot.post("/updateLockerStatus", async (req, res) => {
    try {
        const lockerId = req.body.lockerId
        const doorOpen = req.body.doorOpen

        if (doorOpen) {
            await lockersModel.findOneAndUpdate({ _id: lockerId }, { $set: { door_status: true, last_used: Date.now() }, $inc: { open_count: 1}})
            await usersModel.findOneAndUpdate({ locker_id: lockerId}, { $push: { recent_activity: {activity: "Locker opened", timestamp: Date.now()}}})
        }
        else {
            const locker = await lockersModel.findOne({ _id: lockerId})
            const useTime = (Date.now() - locker.last_used) / (1000 * 60)
            await lockersModel.findOneAndUpdate({ _id: lockerId}, { $set: {door_status: false}, $inc: { usage_minutes: useTime}} )
            await usersModel.findOneAndUpdate({ locker_id: lockerId}, { $push: { recent_activity: {activity: "Locker closed", timestamp: Date.now()}}})
        }

        return res.status(200).json({
            status: 200,
            msg: "Locker updated"
        })
    }
    catch (e) {
        return errorMessage(e, res)
    }
})

iot.post("/updateLocationStatus", async (req, res) => {
    try {
        const locationId = req.body.locationId
        const status = req.body.status

        const prevLocationData = await lockerLocationsModel.findOne({ _id: locationId })

        
        if (prevLocationData.status == 0) {
            await lockerLocationsModel.findOneAndUpdate({ _id: locationId }, { $set: { status: status, last_active: Date.now() }})        
        }
        else {
            const useTime = (Date.now() - prevLocationData.last_used) / (1000 * 60 * 60)
            await lockerLocationsModel.findOneAndUpdate({ _id: locationId }, { $set: { status: status, last_active: Date.now(), $inc: { active_hours: useTime } }})        
        }

        // else if ( status == 2) {
        //     await lockerLocationsModel.findOneAndUpdate({ _id: locationId }, { $set: { status: status }})        
        // }

        return res.status(200).json({
            status: 200,
            msg: "Location updated"
        })
    }
    catch (e) {
        return errorMessage(e, res)
    }
})

iot.post("/isLockerOpen", async (req,res) => {
    try {
        const lockerId = req.body.lockerId
        const lockerStatus = await lockersModel.findOne({ _id: lockerId })
    
        return res.status(200).json({
            status:200,
            msg: "Checked Locker",
            lockerStatus: lockerStatus.door_status
        })
    }
    catch (e) {
        return errorMessage(e, res)
    }
})

iot.post("/closeLocker", async (req, res) => {
    try {
        const lockerId = req.body.lockerId

        await lockersModel.findOneAndUpdate({ _id: lockerId}, { door_status: false })

        return res.status(200).json({
            status:200,
            msg: "Closed Locker",
        })
    }
    catch (e) {
        return errorMessage(e, res)
    }
})

iot.get("/testSignal", (req, res) => {
    console.log("a")
    res.status(200).json({ message: 'Signal sent to the IoT device' });
})