import express from 'express'
import mongoose from 'mongoose'
import { usersModel } from '../../models/models.js'

export const users  = express.Router()

users.get("/", (req, res) => {
    res.status(200).json({
        status: 200,
        msg: "Entered users"
    })
})

//get all users
users.get("/getAllUsers", async (req, res) => {
    await usersModel.find()
    .then((data) => {
        res.status(200).json({
            msg: data
        })
    })
    .catch((e) => {
        res.status(400).json({
            status: 400,
            msg: e
        })
    })
})

//insert a user
users.post("/insertUser", async (req, res) => {
    await usersModel.create(req.body)
    .then((data) => {
        res.status(200).json({
            status: 200,
            msg: "User inserted",
            user: data
        })
    })
    .catch((e) => {
        console.log("error: " + e)
        res.status(404).json({
            status: 404,
            msg: e
        })
    })
})

//delete a user by user_id
users.post("/deleteUser", async (req, res) => {
    await usersModel.deleteOne({_id: req.body.user_id})
    .then((data) => {
        res.status(200).json({
            status: 200,
            msg: data,
            user_deleted: req.body
        })
    })
    .catch((e) => {
        console.log("error: " + e)
        res.status(404).json({
            status: 404,
            msg: e
        })
    })
})
