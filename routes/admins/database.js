import express from 'express'
import mongoose from 'mongoose'
import { usersModel, lockersModel, lockerLocationsModel } from '../../models/models.js'
import errorMessage from '../../apiErrorMessage.js'

export const database  = express.Router()

function formatDatabaseObject(obj) {
    const formattedObj = obj

    for (const [key, value] of Object.entries(formattedObj)) {
        if (!value) {
            delete formattedObj[key];
            continue;
        }
        if(key.includes(".")){
            const newObjKeys = key.split('.');
            let newObj = value


            for (let i = newObjKeys.length - 1; i >= 0; i--) {
                newObj = { [newObjKeys[i]]: newObj };
            }
            delete formattedObj[key]
            Object.assign(formattedObj, newObj)
        }
    }

    return formattedObj
}

database.get("/getAllUsers", async (req, res) => {
    await usersModel.find({}, { 'web_data.hash': false, 'web_data.salt': false })
    .then((data) => {
        res.status(200).json({
            status: 200,
            msg: "User data retrieved",
            userData: data
        });
    })
    .catch((e) => { 
        return errorMessage(e, res) 
    });
})

database.post("/getAllLockers", async (req, res) => {
    const _id = req.body._id
    await lockersModel.find({ location: _id })
    .then((data) => {
        res.status(200).json({
            status: 200,
            msg: "Locker data retrieved",
            lockerData: data
        });
    })
    .catch((e) => { 
        return errorMessage(e, res) 
    });
})

database.get("/getAllLockerLocations", async (req, res) => {
    await lockerLocationsModel.find({})
    .then((data) => {
        res.status(200).json({
            status: 200,
            msg: "Locker Location data retrieved",
            lockerLocationData: data
        });
    })
    .catch((e) => { 
        return errorMessage(e, res) 
    });
})

database.post("/insertDb", async (req, res) => {
    const db = req.body.db
    delete req.body.db

    const newData = formatDatabaseObject(req.body)

    try {
        if (db == "users") { 
            await usersModel.create(newData) 
        }

        return res.status(200).json({
            status: 200,
            msg: "New record inserted",
        });
    }
    catch (e) {
        if (e instanceof mongoose.Error.ValidationError) {
            const errorFields = Object.keys(e.errors);
            const errorPath = errorFields[0];

            return res.status(200).json({
                status: 400,
                errorField: errorPath
            })
        }
        else {
            return errorMessage(e, res)
        }
    }
})

database.post("/editDb", async (req, res) => {
    const db = req.body.db
    delete req.body.db

    const _id = req.body._id
    delete req.body._id
    const editData = formatDatabaseObject(req.body)
    console.log("dasdasfasf")
    try {
        if ( db == "users") {
            await usersModel.findOneAndUpdate({ _id: _id},{ $set: editData })
        }
        return res.status(200).json({
            status: 200,
            msg: "Data editted",
        });
    }
    catch (e) {
        return errorMessage(e, res)
    }
})

database.post("/deleteDb", async (req, res) => {

    const db = req.body.db
    const _id = req.body._id

    try {
        if ( db == "users") {
            await usersModel.deleteOne({_id: _id})
        }
        return res.status(200).json({
            status: 200,
            msg: "Data deleted",
        });
    }
    catch (e) {
        return errorMessage(e, res)
    }
})