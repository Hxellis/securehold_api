import express from 'express'
import mongoose from 'mongoose'
import { usersModel, lockersModel, lockerLocationsModel } from '../../models/models.js'
import errorMessage from '../../apiErrorMessage.js'

export const database  = express.Router()

function formatDatabaseObject(obj, db) {
    const formattedObj = obj
    // const excludedFields = ["occupied_by", "locker_id"]
    for (const [key, value] of Object.entries(formattedObj)) {
        if (!value) {
            if ((key == "occupied_by" && db == "lockers") || (key == "locker_id" && db == "users")) {
                formattedObj[key] = null
            }
            else {
                delete formattedObj[key];
            }
        }
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
            recordData = await usersModel.findOne({ _id: _id}, { 'web_data.hash': false, 'web_data.salt': false }).populate("locker_id")
        }
        else if ( db == "lockers") {
            recordData = await lockersModel.findOne({ _id: _id }).populate("occupied_by")
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

    const newData = formatDatabaseObject(req.body, db)
    console.log(newData)
    let updatedData = {}
    try {
        if (db == "users") { 
            await usersModel.create(newData) 
            // if (newData.locker_id) {
            //     await lockersModel.findOneAndUpdate({ _id: newData.locker_id}, { $set: { occupied_by: _id }}) 
            // }
            // else {
            //     await lockersModel.findOneAndUpdate({ occupied_by: _id}, { $set: { occupied_by: null }}) 
            // }
            updatedData = await usersModel.find({}, { 'web_data.hash': false, 'web_data.salt': false }).populate({ path: "locker_id", populate: { path: 'location', model: "locker_locations"}})
        }
        else if ( db == "lockers") {
            const documentCount = await lockersModel.countDocuments()
            newData.locker_id = "KL_" + ('000' + (documentCount + 1)).slice(-3)
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
        console.log(e)
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

    const editData = formatDatabaseObject(req.body, db)
    let updatedData = {}
    try {
        if ( db == "users") {
            const oldUser = await usersModel.findOneAndUpdate({ _id: _id},{ $set: editData })
            if (editData.locker_id) {
                await lockersModel.findOneAndUpdate({ _id: editData.locker_id}, { $set: { occupied_by: _id }}) 
                if (oldUser.locker_id) {
                    await lockersModel.findOneAndUpdate({ _id: oldUser.locker_id},{ $set: { occupied_by: null} })
                }
            }
            else {
                await lockersModel.findOneAndUpdate({ occupied_by: _id}, { $set: { occupied_by: null }}) 
            }
            updatedData = await usersModel.find({}, { 'web_data.hash': false, 'web_data.salt': false }).populate({ path: "locker_id", populate: { path: 'location', model: "locker_locations"}})
        }
        else if ( db == "lockers" ) {
            const oldLocker = await lockersModel.findOneAndUpdate( { _id: _id }, { $set: editData})
            if (editData.occupied_by) {
                await usersModel.findOneAndUpdate({ _id: editData.occupied_by}, { $set: { locker_id: _id }}) 
                if (oldLocker.occupied_by) {
                    await usersModel.findOneAndUpdate({ _id: oldLocker.occupied_by},{ $set: { locker_id: null} })
                }
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
            updatedData = await usersModel.find().populate({ path: "locker_id", populate: { path: 'location', model: "locker_locations"}})
        }
        else if ( db== "lockers") {
            await lockersModel.deleteOne( {_id: _id})
            updatedData = await lockersModel.find({ location: location}).populate("occupied_by")
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

database.post("/insertLockerLocation", async (req, res) => {
    try {
        const name = req.body.name
        const city = req.body.city
        const address = req.body.address
        
        const locationName = await lockerLocationsModel.findOne({ name: name})

        if (locationName) {
            return res.status(200).json({
                status: 401,
                msg: "Location already exist"
            })
        }
        await lockerLocationsModel.create({ name: name, city: city, address: address })

        return res.status(200).json({
            status: 200,
            msg: "Locker location inserted"
        })
    }
    catch (e) {
        return errorMessage(e, res)
    }
})

database.get("/getLockerIds", async (req, res) => {
    await lockersModel.find({ occupied_by: null }, { locker_id: true})
    .then((data) => {
        return res.status(200).json({
            status: 200,
            msg: "Locker Ids retrieved",
            id: data
        })
    })
    .catch((e) => errorMessage(e,res))
})

database.get("/getUserIds", async (req, res) => {
    await usersModel.find({ locker_id: null}, { name: true})
    .then((data) => {
        return res.status(200).json({
            status: 200,
            msg: "User Ids retrieved",
            id: data
        })
    })
    .catch((e) => errorMessage(e,res))
})



database.get("/samples", async (req, res) => {
    const lockerIds = await lockersModel.find({ location: "65dcb95283c9dccafa3c1b81"}, { _id: true})
    const lockerArr = lockerIds.map((item) => item._id)

    return res.status(200).send(
        lockerArr
    )
})