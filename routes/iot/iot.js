import express from 'express'
import { usersModel, signupCodesModel, forgetCodesModel, annoucementsModel, lockersModel } from '../../models/models.js'
import errorMessage from '../../apiErrorMessage.js'
import crypto from 'crypto'
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
    await annoucementsModel.find({ type: "locker"})
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
            await usersModel.findOneAndUpdate( { _id: userId}, { locker_id: locker._id })

            return res.status(200).json({
                status: 200,
                msg: "Locker assigned"
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

    }
    catch (e) {

    }
})