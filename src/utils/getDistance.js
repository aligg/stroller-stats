

export const getDistance = (meters, isKilometersUser = false) =>{
    if (isKilometersUser) {
      return meters / 1000;
    }
    return meters * 0.000621371192;
  };
  