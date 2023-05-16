import { collection, getDocs, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";

import {db} from '../utils/firebase'
import { getMiles } from "../utils/getMiles";

export const useData = (user_id) => {

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true)
  
    useEffect(() => {
        const dataToReturn = {"total_walk_miles": 0, "total_run_miles": 0} 
        const getData = async (user_id) => {
            setLoading(true)
            const currYear = new Date().getFullYear().toString()
            let walkTime = 0;
            let runTime = 0;
            const q = query(collection(db, "activities"), where("user_id", "==", Number(user_id)), where("is_stroller", "==", true), where("start_date", ">", currYear));
            const querySnapshot = await getDocs(q);
            
            // If no results, exit early
            if (querySnapshot.size === 0) {
                setLoading(false)
                setData(dataToReturn)
            }

            querySnapshot.forEach((doc) => {
                const dbData = doc.data()
                if (dbData.sport_type === "Run") {
                    dataToReturn["total_run_miles"] += getMiles(dbData.distance)
                    // run_time_seconds = distance (meters) / average_speed (m/s)
                    runTime += dbData.distance / dbData.average_speed;
                } else if (dbData.sport_type === "Walk") {
                    dataToReturn["total_walk_miles"] += getMiles(dbData.distance)
                    walkTime += dbData.distance / dbData.average_speed;
                }
            });
            const mins_per_mile_run = Math.floor((runTime / dataToReturn["total_run_miles"]) / 60);
            const mins_per_mile_walk = Math.floor((walkTime / dataToReturn["total_walk_miles"]) / 60);
            
            const secs_per_mile_run = Math.floor((runTime / dataToReturn["total_run_miles"]) % 60);
            const secs_per_mile_walk = Math.floor((runTime / dataToReturn["total_walk_miles"]) % 60);

            dataToReturn["average_run_speed"] = mins_per_mile_run + ":" + secs_per_mile_run.toLocaleString('en-US', minimumIntegerDigits: 2);
            dataToReturn["average_walk_speed"] = mins_per_mile_walk + ":" + secs_per_mile_walk.toLocaleString('en-US', minimumIntegerDigits: 2);

            setData(dataToReturn)
            setLoading(false)
        }
       
        getData(user_id)
    
    }, [user_id]);
    
    return [data, loading];
};
