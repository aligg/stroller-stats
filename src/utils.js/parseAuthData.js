/**
 * Helper method to parse query string and extract auth data
 * 
 * @param str e.g. ?state=&code=123&scope=read
 * @returns [code, scope]
 */
export const parseAuthData = (str) => {
    const code = str.split("&")[1].slice(5)
    const scope = str.split("&")[2].slice(6)
    return [code, scope]
};