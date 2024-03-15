import express from "express";
import { lockerHistoryModel, lockerLocationsModel, lockersModel } from '../../models/models.js'
import dotenv from 'dotenv'
import errorMessage from "../../apiErrorMessage.js";
import { spawn } from "child_process";

import { fileURLToPath } from 'url';
import { dirname } from 'path';

dotenv.config()

export const dataAnalytics  = express.Router()

const pythonFilePath = dirname(fileURLToPath(import.meta.url)) + "\\analytics\\" 
dataAnalytics.get("/test", (req, res) => {

    const pythonProcess = spawn("python", [pythonFilePath + "test.py", "test2"]);

    let outputData = "";
    let errorData = ""; 

    //parse output
    pythonProcess.stdout.on("data", (data) => { outputData += JSON.parse(data) });

    //parse error message
    pythonProcess.stderr.on("data", (err) => { errorData += JSON.parse(err) });

    pythonProcess.on("close", (code) => {
        console.log(`child process exited with code ${code}`);
        return errorData ? errorMessage(errorData, res) : res.send(outputData);
    });
});

dataAnalytics.get("/getLockerLocationIds", async (req, res) => {
    await lockerLocationsModel.find({}, { projection: {_id: true}})
    .then((data) => {
        return res.status(200).json({
            status: 200,
            msg: "Locker Ids retrieved",
            id: data
        })
    })
    .catch((e) => errorMessage(e,res))
})

dataAnalytics.post("/getOccupancyCount", async (req, res) => {
    try {
        const lockerId = req.body?.lockerId || null
        const lockerHistory = await lockerHistoryModel.find()

        // xAxis
        const xAxis = lockerHistory.map((dailyOccupancy) => dailyOccupancy.date)
        // xAxis.push("Today's Prediction")

        // yAxis
        const occupiedObj = lockerHistory.map((dailyOccupancy) => {
            let occupiedNum = 0
            let totalNum = 0
            dailyOccupancy.occupancy_count.forEach((locationOccupancy) => {
                if (lockerId) {
                    if (locationOccupancy.locker_id == lockerId) {
                        occupiedNum += locationOccupancy.occupied
                        totalNum = locationOccupancy.total
                    }
                }
                else {
                    occupiedNum += locationOccupancy.occupied
                    totalNum += locationOccupancy.total
                }
            })
            return {
                occupiedNum: occupiedNum,
                totalNum: totalNum
            }
        })
        // console.log(occupiedObj)
        const yAxis = occupiedObj.map((arr) => arr.occupiedNum)
        yAxis.push(45) //current hard coded predictions

        
        const yAxisPeak = Math.max(occupiedObj.totalNum)

        return res.status(200).json({
            status: 200,
            msg: "Locker history retrieved",
            xAxis: xAxis,
            yAxis: yAxis,
            yAxisPeak: yAxisPeak
        })
        
    }
    catch (e) {
        return errorMessage(e, res)
    }
})

dataAnalytics.post("/getDemandForecast", async (req, res) => {
    try {
        const lockerId = req.body?.lockerId || null
        const lockerHistory = await lockerHistoryModel.findOne().sort({$natural:-1})

        const xAxis = []
        for ( let x = 0; x <= 24; x += lockerHistory.demand_forecast.hour_interval){
            xAxis.push(("0" + x).slice(-2) + ":00")
        }

        let yAxis = []
        if(lockerId) {
            yAxis = (lockerHistory.demand_forecast.open_counts.find((record) => record.locker_id.toString() == lockerId)).count
        }
        else {
            lockerHistory.demand_forecast.open_counts.forEach((records) => {
                for(let x = 0; x < records.count.length; x++) {
                    yAxis[x] = yAxis[x] ? yAxis[x] + records.count[x] : records.count[x]
                }
            })
        }

        const yForecast = [2, 3, 8, 2, 6, 9, 13]; // hard coded prediction

        return res.status(200).json({
            status: 200,
            msg: "Locker history retrieved",
            xAxis: xAxis,
            yAxis: yAxis,
            yForecast: yForecast,
            date: lockerHistory.date
        })
    }
    catch (e) {
        return errorMessage(e, res)
    }
})

dataAnalytics.get("/getLockerUsages", async (req, res) => {
    try {
        const lockerLocations = await lockerLocationsModel.find({}, {  name: true})
        const lockers = await lockersModel.find({})
        const labels = []
        const values = []
        lockerLocations.forEach((locations) => {
            let totalUsage = 0
            lockers.forEach((locker) => {
                if (locker.location?.toString() == locations._id.toString()) {
                    totalUsage += locker.usage_minutes
                }
            })
            if (totalUsage) {
                labels.push(locations.name)
                values.push(Math.round(totalUsage))
                // lockerUsagesObj[locations.name] = Math.round(totalUsage)
            }
        })

        return res.status(200).json({
            status: 200,
            msg: "Locker usages retrieved",
            labels: labels,
            values: values
        })

    }
    catch (e) {
        return errorMessage(e, res)
    }
})