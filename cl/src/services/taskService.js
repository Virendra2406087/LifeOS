import API from "../app/api";

export const getTasks = ()=> API.get("/tasks");

export const createTask = (task)=> API.post("/tasks",task);

export const deleteTask = (id)=> API.delete(`/tasks/${id}`);