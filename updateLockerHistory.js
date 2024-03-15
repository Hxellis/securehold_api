import { lockerHistoryModel, lockerLocationsModel, lockersModel } from "./models/models.js"

const hour_interval = 4

function updateLockerHistory() {
    if (new Date().getSeconds() == 10) {
        console.log("ayy it time")
    }
    else console.log("it aint time", new Date())
}

export default async function updateOccupancyCount() {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(0, 0, 0, 0);
    
    let milliseconds = midnight - now;

    if (milliseconds < 0) {
        milliseconds += 24 * 60 * 60 * 1000; // Add milliseconds for one day
    }
    
    console.log("Occupancy update:", milliseconds)
    setTimeout(async () => {
        try {
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
                    location_id: locationId,
                    occupied: occupied,
                    total: total
                })
            })
    
            const yesterdayDate = new Date();
            yesterdayDate.setDate(yesterdayDate.getDate() - 1);
            await lockerHistoryModel.findOneAndUpdate({date: yesterdayDate}, { $set: { occupancy_count: occupancyCountArr}})
            await lockerHistoryModel.create({ date: midnight, demand_forecast: { hour_interval: hour_interval}})
        }
        catch (e) {
            console.log(e)
        }
        setTimeout(updateOccupancyCount, 1000);
    }, milliseconds);
}