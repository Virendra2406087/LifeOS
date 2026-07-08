import { createContext, useState } from "react";

export const AppContext = createContext();

export const AppProvider = ({ children }) => {

  const [tasks,setTasks] = useState([]);

  return (
    <AppContext.Provider value={{tasks,setTasks}}>
      {children}
    </AppContext.Provider>
  );
};