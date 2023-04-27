import { collection, getDocs, query, where } from "firebase/firestore";
// import { collection, doc, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";

import {db} from '../utils/firebase'

const getMiles = (meters) =>{
     return meters * 0.000621371192;
}

const getMinutesPerMile = (metersPerSecond) => {
    const milesPerHour = metersPerSecond * 2.23694;
    const minutesPerMile = 60 / milesPerHour;
    return minutesPerMile;
}

const addDistance = (dbData, dataToReturn) => {
    if (dbData.sport_type === "Run") {
        dataToReturn["total_run_miles"] += getMiles(dbData.distance)
    } else if (dbData.sport_type === "Walk") {
        dataToReturn["total_walk_miles"] += getMiles(dbData.distance)
    }
}


export const useData = (user_id) => {

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true)
  
    useEffect(() => {
        const dataToReturn = {"total_walk_miles": 0, "total_run_miles": 0} 
        const getData = async (user_id) => {
            setLoading(true)
            const currYear = new Date().getFullYear().toString()
            const q = query(collection(db, "activities"), where("user_id", "==", Number(user_id)), where("is_stroller", "==", true), where("start_date", ">", currYear));
            const querySnapshot = await getDocs(q);
            querySnapshot.forEach((doc) => {
                const dbData = doc.data()
                addDistance(dbData, dataToReturn)

                
            setData(dataToReturn)
            setLoading(false)
            });
        }
       
        getData(user_id)
    
    }, [user_id]);
    
    return [data, loading];
};
