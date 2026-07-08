import API from "../app/api";

export const optimizeTasks = (tasks)=>{
return API.post("/ai/optimize",{tasks})
}
export const fetchAISuggestions = (tasks) => {
  return API.post("/ai/suggest", { tasks });
};