export const calculateUrgency = (tasks)=>{

const high = tasks.filter(t=>t.priority==="High").length

if(high>3) return "High"

return "Normal"

}