import express from "express";
import { pendingApprovalsModel } from '../models/models.js'
import dotenv from 'dotenv'
import errorMessage from "../apiErrorMessage.js";

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

dashboard.post("/insertAdmin", async (req, res) => {
    const pendingAdmin = await pendingApprovalsModel.findOne({ _id: req.body._id }, {_id: false})
    .catch( (e) => {
        return errorMessage(e, res)
    })

    if (pendingAdmin) {
        await dashboardModel.create(pendingAdmin.toObject())
        .then(async (data) => {
            await pendingApprovalsModel.deleteOne({ _id: req.body._id })
    
            return res.status(200).json({
                status: 200,
                msg: "Admin approved",
                user: data
            })
        })
        .catch((e) => {
            return errorMessage(e, res)
        })
    }
    else {
        return res.status(404).json({
            status: 404,
            msg: "No pending admin with id:" + req.body._id
        })
    }
})

dashboard.post("/rejectAdmin", async (req, res) => {
    const pendingAdmin = await pendingApprovalsModel.findOne({ _id: req.body._id }, {_id: false})
    .catch( (e) => {
        return errorMessage(e, res)
    })
    if(pendingAdmin) {
        await pendingApprovalsModel.deleteOne({ _id: req.body._id })
        .then(() => {
            return res.status(200).json({
                status: 200,
                msg: "Admin rejected"
            })
        })
        .catch( (e) => {
            return errorMessage(e, res)
        })
    }
    else {
        return res.status(404).json({
            status: 404,
            msg: "No pending admin with id:" + req.body._id
        })
    }
})