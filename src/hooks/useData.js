import { useEffect, useState } from "react";

export const useData = (userId, currYear) => {

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true)
  
    useEffect(() => {
        
        const getData = async (userId) => {
            
            setLoading(true)
            if (!userId) {
                return;
            }
            const response = await fetch(`https://us-central1-stroller-stats.cloudfunctions.net/app/user-activity-data/${userId}/${currYear}`)
            const data = await response.json();
            
            setData(data)
            setLoading(false)
        }
       
        getData(userId)
    
    }, [userId, currYear]);
    
    return [data, loading];
};
