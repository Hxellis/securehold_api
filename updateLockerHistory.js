import { lockerHistoryModel, lockerLocationsModel, lockersModel } from "./models/models.js"

function updateLockerHistory() {
    if (new Date().getSeconds() == 10) {
        console.log("ayy it time")
    }
    else console.log("it aint time", new Date())
}

async function updateOccupancyCount() {

    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    yesterdayDate.setHours(0,0,0,0)
    
    console.log(yesterdayDate)
    if (new Date().getHours() === 17) {
        // const ligma = await lockerHistoryModel.find({
        //     date: yesterdayDate
        // })
        const lockers = await lockersModel.find({})
        const lockersLocation = await lockerLocationsModel.find({})

        const occupancyCountArr = []

        lockersLocation.forEach((location) => {
            const locationId = location._id.toString()
            let occupied = 0
            let total = 0
            lockers.forEach((locker) => {
                if (locker.location.toString() == locationId) {
                    total += 1
                    if (locker.occupied_by) {
                        occupied += 1
                    }
                }
            })
            occupancyCountArr.push({
                locker_id: locationId
            })
        })
        
    }
    else {
        console.log("notTime")
    }
}

export default function lockerUpdateSchedule() {
    // setInterval(updateLockerHistory, 1000)
    // setInterval(testFind, 5000)
    updateOccupancyCount()
    // setInterval(updateOccupancyCount, 60*60*1000)
};