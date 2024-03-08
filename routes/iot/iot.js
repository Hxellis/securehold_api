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
    await annoucementsModel.findOne({ type: "Lockers"}).sort({ _id: -1})
    .then ( (resp) => {
        return res.status(200).json({
            status: 200,
            msg: "Locker annoucements received",
            annoucements: resp
        })
    })
    .catch ( (e) => errorMessage(e, res))
})

iot.post("/getUserData", async (req, res) => {
    try {
        const rfid  = req.body.rfid
        const userData  = await usersModel.findOne( { 'auth_data.rfid': rfid }, {projection: { 'web_data.hash': false, 'web_data.salt': false}})
        return res.status(200).json({
            status: 200,
            msg: "Retrieved user data",
            userData: userData
        })
    }
    catch (e) {
        return errorMessage(e, res)
    }
})

iot.post("/assignLocker", async (req, res) => {
    try {
        const userId = req.body.userId
        const locationId = req.body.locationId

        const locker = await lockersModel.findOne({ location: locationId, occupied_by: null})

        if (locker) {
            await lockersModel.findOneAndUpdate({ _id: locker._id }, { $set: { occupied_by: userId}})
            await usersModel.findOneAndUpdate( { _id: userId}, { $set: { locker_id: locker._id } })

            return res.status(200).json({
                status: 200,
                msg: "Locker assigned",
                lockerId: locker._id
            })
        }
        else {
            return res.status(200).json({
                status: 403,
                msg: "No more lockers available at this location"
            })
        }
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

        if (status == 1 ) {
            await lockerLocationsModel.findOneAndUpdate({ _id: locationId }, { $set: { status: status, last_active: Date.now() }})        
        }
        else if (status == 0) {
            const locker = await lockerLocationsModel.findOne({ _id: locationId })
            const useTime = (Date.now() - locker.last_used) / (1000 * 60 * 60)
            await lockerLocationsModel.findByIdAndUpdate({ _id: locationId }, { $set: { status: status}, $inc: { active_hours: useTime }})
        }
        else if ( status == 2) {
            await lockerLocationsModel.findOneAndUpdate({ _id: locationId }, { $set: { status: status }})        
        }

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
    const userId = req.body.id
    const lockerStatus = (await lockersModel.findOne({ _id: userId }, { door_status: true})).door_status

    res.status(200).json({
        status:200,
        msg: "Checked Locker",
        lockerStatus: lockerStatus
    })
})

iot.get("/testSignal", (req, res) => {
    console.log("a")
    res.status(200).json({ message: 'Signal sent to the IoT device' });
})