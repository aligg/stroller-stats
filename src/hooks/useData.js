import { useEffect, useState } from "react";

export const useData = (userId) => {

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true)
  
    useEffect(() => {
        
        const getData = async (userId) => {
            setLoading(true)

            const response = await fetch(`https://us-central1-stroller-stats.cloudfunctions.net/app/user-activity-data/${userId}`)
            const data = await response.json();
            
            setData(data)
            setLoading(false)
        }
       
        getData(userId)
    
    }, [userId]);
    
    return [data, loading];
};
