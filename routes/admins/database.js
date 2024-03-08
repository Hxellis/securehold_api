import express from 'express'
import mongoose from 'mongoose'
import { usersModel, lockersModel, lockerLocationsModel } from '../../models/models.js'
import errorMessage from '../../apiErrorMessage.js'

export const database  = express.Router()

function formatDatabaseObject(obj) {
    const formattedObj = obj
    const excludedFields = ["occupied_by", "locker_id"]

    for (const [key, value] of Object.entries(formattedObj)) {
        
        if (!value) {
            if (excludedFields.includes(key)) {
                formattedObj[key] = null
            }
            else {
                delete formattedObj[key];
            }
        }
        // else if(key.includes(".")){
        //     const newObjKeys = key.split('.');

        //     if ( formattedObj[newObjKeys[0]]) {
        //         console.log("enter", newObjKeys[0])
        //         formattedObj[newObjKeys[0]][newObjKeys[1]] = value
        //     }
       
        // }
    }

    return formattedObj
}

database.get("/getAllUsers", async (req, res) => {
    await usersModel.find({}, { 'web_data.hash': false, 'web_data.salt': false }).populate({ path: "locker_id", populate: { path: 'location', model: "locker_locations"}})
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

database.post("/getOneDb", async (req, res) => {
    try {
        const _id = req.body._id
        const db = req.body.db
    
        let recordData = {}

        if (db == "users") {
            recordData = await usersModel.findOne({ _id: _id}, { 'web_data.hash': false, 'web_data.salt': false })
        }
        else if ( db == "lockers") {
            recordData = await lockersModel.findOne({ _id: _id })
        }

        return res.status(200).json({
            status: 200,
            msg: "User data retrieved",
            recordData: recordData
        });
        
    }
    catch (e) { return errorMessage(e, res) }
})

database.post("/getAllLockers", async (req, res) => {
    const _id = req.body._id
    await lockersModel.find({ location: _id }).populate("occupied_by")
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

    const location = req.body.location
    delete req.body.location

    const newData = formatDatabaseObject(req.body)

    let updatedData = {}
    try {
        if (db == "users") { 
            await usersModel.create(newData) 
            if (newData.locker_id) {
                await lockersModel.findOneAndUpdate({ _id: newData.locker_id}, { $set: { occupied_by: _id }}) 
            }
            else {
                await lockersModel.findOneAndUpdate({ occupied_by: _id}, { $set: { occupied_by: null }}) 
            }
            updatedData = await usersModel.find({}, { 'web_data.hash': false, 'web_data.salt': false }).populate({ path: "locker_id", populate: { path: 'location', model: "locker_locations"}})
        }
        else if ( db == "lockers") {
            newData.location = location
            await lockersModel.create(newData)
            updatedData = await lockersModel.find({ location: location}).populate("occupied_by")
        }

        return res.status(200).json({
            status: 200,
            msg: "New record inserted",
            updatedData: updatedData
        });
    }
    catch (e) {
        if (e instanceof mongoose.Error.ValidationError) {
            const errorFields = Object.keys(e.errors);
            const errorPath = errorFields[0];

            return res.status(200).json({
                status: 400,
                msg: 'Invalid type',
                errorField: errorPath
            })
        }
        else if (e.name === 'MongoServerError' && e.code === 11000) {
            const duplicatedKey = Object.keys(e.keyValue)[0];
    
            return res.status(200).json({
                status: 400,
                msg: 'Duplicate key error',
                duplicatedKey: duplicatedKey,
            });
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

    const location = req.body.location
    delete req.body.location

    const editData = formatDatabaseObject(req.body)
    let updatedData = {}
    try {
        if ( db == "users") {
            await usersModel.findOneAndUpdate({ _id: _id},{ $set: editData })
            if (editData.locker_id) {
                await lockersModel.findOneAndUpdate({ _id: editData.locker_id}, { $set: { occupied_by: _id }}) 
            }
            else {
                await lockersModel.findOneAndUpdate({ occupied_by: _id}, { $set: { occupied_by: null }}) 
            }
            updatedData = await usersModel.find({}, { 'web_data.hash': false, 'web_data.salt': false }).populate({ path: "locker_id", populate: { path: 'location', model: "locker_locations"}})
        }
        else if ( db == "lockers" ) {
            await lockersModel.findOneAndUpdate( { _id: _id }, { $set: editData})
            if (editData.occupied_by) {
                await usersModel.findOneAndUpdate({ _id: editData.occupied_by}, { $set: { locker_id: _id }}) 
            }
            else {
                await usersModel.findOneAndUpdate({ locker_id: _id}, { $set: { locker_id: null }}) 
            }
            updatedData = await lockersModel.find({ location: location}).populate("occupied_by")
        }
        return res.status(200).json({
            status: 200,
            msg: "Data editted",
            updatedData: updatedData
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
        return errorMessage(e, res)
    }
})

database.post("/deleteDb", async (req, res) => {

    const db = req.body.db
    const _id = req.body._id
    const location = req.body.location

    let updatedData = {}

    try {
        if ( db == "users") {
            await usersModel.deleteOne({_id: _id})
            updatedData = await usersModel.find()
        }
        else if ( db== "lockers") {
            await lockersModel.deleteOne( {_id: _id})
            updatedData = await lockersModel.find({ location: location})
        }
        return res.status(200).json({
            status: 200,
            msg: "Data deleted",
            updatedData: updatedData
        });
    }
    catch (e) {
        return errorMessage(e, res)
    }
})

database.post("/openLocker", async (req, res) => {
    try {
        const lockerId = req.body.lockerId
        
        await lockersModel.findOneAndUpdate({ _id: lockerId}, { $set: { door_status: true}})

        return res.status(200).json({
            status: 200,
            msg: "Locker opened"
        })
    }
    catch (e) {
        return errorMessage(e, res)
    }
})