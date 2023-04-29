import { collection, getDocs, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";

import {db} from '../utils/firebase'

const getMiles = (meters) =>{
     return meters * 0.000621371192;
}

const calculateAverageSpeed = (runs) => {
    // console.log(runs)
    const n = runs.length;
    const reciprocalsSum = runs.reduce((sum, speed) => sum + 1 / speed, 0);
    const harmonicMean = n / reciprocalsSum;
    const averageSpeed = 1 / harmonicMean;
    const speedInMinPerMile = getMinutesPerMile(averageSpeed)
    return speedInMinPerMile;
    // return averageSpeed
}

const getMinutesPerMile = (metersPerSecond) => {
    const milesPerHour = metersPerSecond * 2.23694;
    // console.log(milesPerHour)
    const minutesPerMile = 60 / milesPerHour;
    return minutesPerMile;
}


export const useData = (user_id) => {

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true)
  
    useEffect(() => {
        const dataToReturn = {"total_walk_miles": 0, "total_run_miles": 0} 
        const getData = async (user_id) => {
            setLoading(true)
            const currYear = new Date().getFullYear().toString()
            const walkSpeeds = [];
            const runSpeeds = [];
            const q = query(collection(db, "activities"), where("user_id", "==", Number(user_id)), where("is_stroller", "==", true), where("start_date", ">", currYear));
            const querySnapshot = await getDocs(q);
            querySnapshot.forEach((doc) => {
                const dbData = doc.data()
                if (dbData.sport_type === "Run") {
                    dataToReturn["total_run_miles"] += getMiles(dbData.distance)
                    runSpeeds.push(dbData.average_speed)
                } else if (dbData.sport_type === "Walk") {
                    dataToReturn["total_walk_miles"] += getMiles(dbData.distance)
                    walkSpeeds.push(dbData.average_speed)
                }   
            runSpeeds.forEach((speed) => {
                console.log(getMinutesPerMile(speed))
            })
            const averageRunSpeed = calculateAverageSpeed(runSpeeds);
            const averageWalkSpeed = calculateAverageSpeed(walkSpeeds);
            dataToReturn["average_run_speed"] = averageRunSpeed
            dataToReturn["average_walk_speed"] = averageWalkSpeed

            setData(dataToReturn)
            setLoading(false)
            });
        }
       
        getData(user_id)
    
    }, [user_id]);
    
    return [data, loading];
};
