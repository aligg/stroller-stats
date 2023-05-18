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
            const querySnapshot = await getDocs(q); //TODO: replace client request
            
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
            const minsPerMileRun = Math.floor((runTime / dataToReturn["total_run_miles"]) / 60);
            const minsPerMileWalk = Math.floor((walkTime / dataToReturn["total_walk_miles"]) / 60);
            
            const secs_per_mile_run = Math.floor((runTime / dataToReturn["total_run_miles"]) % 60);
            const secs_per_mile_walk = Math.floor((runTime / dataToReturn["total_walk_miles"]) % 60);

            dataToReturn["average_run_speed"] = minsPerMileRun + ":" + secs_per_mile_run.toString().padStart(2, '0');
            dataToReturn["average_walk_speed"] = minsPerMileWalk + ":" + secs_per_mile_walk.toString().padStart(2, '0');

            setData(dataToReturn)
            setLoading(false)
        }
       
        getData(user_id)
    
    }, [user_id]);
    
    return [data, loading];
};
