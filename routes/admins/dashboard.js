import express from "express";
import { pendingApprovalsModel, adminsModel, lockerLocationsModel, lockersModel } from '../../models/models.js'
import dotenv from 'dotenv'
import errorMessage from "../../apiErrorMessage.js";

dotenv.config()

export const dashboard  = express.Router()

dashboard.get("/getAllPendingApprovals", async (req, res) => {
    await pendingApprovalsModel.find()
    .then ( (data) => {
        return res.status(200).json({
            status: 200,
            msg: "Pending list retrieved",
            data: data
        })
    })
    .catch ((e) => {
        return errorMessage(e, res)
    })
})

dashboard.get("/getAllLockerLocations", async (req, res) => {
    try {
        const data = await lockerLocationsModel.find({})

        const alteredLockerLocations = await Promise.all(data.map( async (lockerLocation) => {
            const totalCount = await lockersModel.countDocuments({ location: lockerLocation._id })
            const count = await lockersModel.countDocuments({ location: lockerLocation._id, occupied_by: { $ne: null} })
            const lockerLocationObj = lockerLocation.toObject()
            lockerLocationObj.totalComp = totalCount
            lockerLocationObj.occupied = count
            return lockerLocationObj
        }))
        return res.status(200).json({
            status: 200,
            msg: "Locker locations retrieved",
            lockerLocations: alteredLockerLocations
        })

    }
    catch (e) {
        errorMessage(e, res)
    }
    
})

dashboard.post("/insertAdmin", async (req, res) => {
    try {
        const pendingAdmin = await pendingApprovalsModel.findOne({ _id: req.body._id }, {_id: false})
    
        if (pendingAdmin) {
            await adminsModel.create(pendingAdmin.toObject())
            .then(async (data) => {
                await pendingApprovalsModel.deleteOne({ _id: req.body._id })
        
                return res.status(200).json({
                    status: 200,
                    msg: "Admin approved",
                    user: data
                })
            })
        }
        else {
            return res.status(404).json({
                status: 404,
                msg: "No pending admin with id:" + req.body._id
            })
        }
    }
    catch (e) {
        return errorMessage(e, res)
    }
})

dashboard.post("/rejectAdmin", async (req, res) => {
    try {
        const pendingAdmin = await pendingApprovalsModel.findOne({ _id: req.body._id }, {_id: false})

        if(pendingAdmin) {
            await pendingApprovalsModel.deleteOne({ _id: req.body._id })
            .then(() => {
                return res.status(200).json({
                    status: 200,
                    msg: "Admin rejected"
                })
            })
        }
        else {
            return res.status(404).json({
                status: 404,
                msg: "No pending admin with id:" + req.body._id
            })
        }
    }
    catch (e) {
        return errorMessage(e, res)
    }
    
})