import { useState, useEffect } from "react";

export default function TaskBoard(){

const defaultTasks = {
todo:[
 {id:1,text:"Morning Routine",priority:"purple",time:"7:00 AM"},
 {id:2,text:"Deep Work",priority:"blue",time:"9:00 AM"}
],
doing:[
 {id:3,text:"Team Meeting",priority:"cyan",time:"11:00 AM"}
],
done:[
 {id:4,text:"Lunch Break",priority:"gray",time:"1:00 PM"}
]
}

const [tasks,setTasks] = useState(()=>{
const saved = localStorage.getItem("lifeos_tasks")
return saved ? JSON.parse(saved) : defaultTasks
})

const [selectedTask,setSelectedTask] = useState(null)

useEffect(()=>{
localStorage.setItem("lifeos_tasks",JSON.stringify(tasks))
},[tasks])

const onDragStart = (e,task,column)=>{
e.dataTransfer.setData("task",JSON.stringify({task,column}))
}

const onDrop = (e,newColumn)=>{
const data = JSON.parse(e.dataTransfer.getData("task"))
const {task,column} = data

const updated = {...tasks}

updated[column] = updated[column].filter(t=>t.id!==task.id)
updated[newColumn].push(task)

setTasks(updated)
}

const allowDrop = (e)=>{
e.preventDefault()
}

const renderColumn = (title,columnTasks,columnKey)=>(
<div
className="glass-card"
onDragOver={allowDrop}
onDrop={(e)=>onDrop(e,columnKey)}
>

<h3>{title}</h3>

{columnTasks.map(task=>(
<div
key={task.id}
className={`task ${task.priority}`}
draggable
onDragStart={(e)=>onDragStart(e,task,columnKey)}
onClick={()=>setSelectedTask(task)}
>

{task.text}

</div>
))}

</div>
)

return(

<div className="task-container">

<div className="task-board">

{renderColumn("Todo",tasks.todo,"todo")}
{renderColumn("Doing",tasks.doing,"doing")}
{renderColumn("Done",tasks.done,"done")}

</div>

{/* Schedule Panel */}

{selectedTask && (

<div className="glass-card schedule-box">

<h3>Task Schedule</h3>

<p><b>Task:</b> {selectedTask.text}</p>

<p><b>Scheduled Time:</b> {selectedTask.time}</p>

<button className="accept">Start Task</button>

</div>

)}

</div>

)

}