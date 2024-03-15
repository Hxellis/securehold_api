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

    const data = [
        [ 5, 11, 15, 12, 18, 19 ],
        [ 7, 13, 17, 14, 20, 21 ],
        [ 9, 15, 19, 16, 22, 23 ],
        [ 12, 17, 21, 18, 24, 23 ]
      ]
    
        runPython("test2", data)
        .then((result) => {
            return res.send(result)
        })
        .catch((e) => errorMessage(e, res))
});

function runPython(filename, data) {
    return new Promise((resolve, reject) => {
        const pythonProcess = spawn("python", [pythonFilePath + "analyticsHandler.py", filename, JSON.stringify(data)]);

        let outputData = "";
        let errorData = ""; 
    
        pythonProcess.stdout.on("data", (data) => { outputData += data;});
        pythonProcess.stderr.on("data", (err) => { errorData += err });
    
        pythonProcess.on("close", (code) => {
            // console.log(`child process exited with code ${code}`);
            if (errorData) {
                reject(errorData);
            } else {
                resolve(outputData);
            }
        });
    })
}

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
        const locationId = req.body?.locationId || null
        const lockerHistory = await lockerHistoryModel.find()

        // xAxis
        const xAxis = lockerHistory.map((dailyOccupancy) => dailyOccupancy.date)
        // xAxis.push("Today's Prediction")

        // yAxis
        const occupiedObj = lockerHistory.map((dailyOccupancy) => {
            let occupiedNum = 0
            let totalNum = 0
            dailyOccupancy.occupancy_count.forEach((locationOccupancy) => {
                if (locationId) {
                    if (locationOccupancy.location_id == locationId) {
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
        const yAxis = occupiedObj.map((arr) => arr.occupiedNum)
        const yAxisPeak = Math.max(occupiedObj.totalNum)

        runPython("occupancy", yAxis)
        .then((result) => {
            yAxis.push(JSON.parse(result)[0]) 
            return res.status(200).json({
                status: 200,
                msg: "Locker history retrieved",
                xAxis: xAxis,
                yAxis: yAxis,
                yAxisPeak: yAxisPeak
            })
        })
        .catch((e) => {
            errorMessage(e, res)
        })
    }
    catch (e) {
        return errorMessage(e, res)
    }
})

dataAnalytics.post("/getDemandForecast", async (req, res) => {
    try {
        const locationId = req.body?.locationId || null
        const lockerHistory = await lockerHistoryModel.findOne().sort({$natural:-1})

        const xAxis = []
        for ( let x = 0; x <= 24; x += lockerHistory.demand_forecast.hour_interval){
            xAxis.push(("0" + x).slice(-2) + ":00")
        }

        let yAxis = []
        if(locationId) {
            yAxis = (lockerHistory.demand_forecast.open_counts.find((record) => record.location_id.toString() == locationId)).count
        }
        else {
            lockerHistory.demand_forecast.open_counts.forEach((records) => {
                for(let x = 0; x < records.count.length; x++) {
                    yAxis[x] = yAxis[x] ? yAxis[x] + records.count[x] : records.count[x]
                }
            })
        }

        const pastLockerHistory = await lockerHistoryModel.find({}).limit(4)
        const pastData = pastLockerHistory.map((documents) => {
            if (locationId) {
                return (documents.demand_forecast.open_counts.find((openCounts) => openCounts.location_id.toString() == locationId)).count
            }
            let sumPastArr = []
            documents.demand_forecast.open_counts.forEach((openCounts) => {
                for(let x = 0; x < openCounts.count.length; x++) {
                    sumPastArr[x] = sumPastArr[x] ? sumPastArr[x] + openCounts.count[x] : openCounts.count[x]
                }
            })
            return sumPastArr
        })

        runPython("userDemand", pastData)
        .then((result) => {
            const yForecast = JSON.parse(result);
            return res.status(200).json({
                status: 200,
                msg: "Locker history retrieved",
                xAxis: xAxis,
                yAxis: yAxis,
                yForecast: yForecast,
                date: lockerHistory.date
            })

        })
        .catch((e) => {
            errorMessage(e, res)
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