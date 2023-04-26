import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";

import {db} from '../utils/firebase'

export const useUser = (user_id) => {

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true)

    // db.collection("users").limit(1).get()
    // .then((data) => {
    //   console.log("DATA", data.docs);
    //   data.docs[0].get("refresh_token");
    // });
  
    useEffect(() => {

        const getUser = async (user_id) => {
            setLoading(true)
            const docRef = doc(db, "users", user_id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setUser(docSnap.data())
                setLoading(false)
              } else {
                // TODO: redirect to login or raise error
              }
        }
       
        getUser(user_id)
    
    }, [user_id]);
    
    return [user, loading];
};
