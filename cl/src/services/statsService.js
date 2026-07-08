import API from "../app/api";

export const getStats = ()=>{
return API.get("/stats")
}