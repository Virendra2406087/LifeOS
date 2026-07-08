import { useState } from "react";

export default function DragDropSchedule(){

const [tasks,setTasks] = useState([
 {id:1,name:"Morning Routine",color:"purple"},
 {id:2,name:"Deep Work",color:"blue"},
 {id:3,name:"Team Meeting",color:"cyan"},
 {id:4,name:"Lunch Break",color:"gray"},
 {id:5,name:"Research Task",color:"orange"}
]);

const [dragIndex,setDragIndex] = useState(null);

const handleDragStart = (index)=>{
 setDragIndex(index);
};

const handleDragOver = (e)=>{
 e.preventDefault();
};

const handleDrop = (index)=>{
 const updatedTasks = [...tasks];
 const draggedTask = updatedTasks[dragIndex];

 updatedTasks.splice(dragIndex,1);
 updatedTasks.splice(index,0,draggedTask);

 setTasks(updatedTasks);
};

return(

<div className="glass-card">

<h3>Today's Schedule</h3>

{tasks.map((task,index)=>(
<div
key={task.id}
className={`task ${task.color}`}
draggable
onDragStart={()=>handleDragStart(index)}
onDragOver={handleDragOver}
onDrop={()=>handleDrop(index)}
style={{cursor:"grab"}}
>

{task.name}

</div>
))}

</div>

);

}
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

function DragSchedule({ tasks, setTasks }) {

const handleDragEnd = (result) => {

if(!result.destination) return;

const items = Array.from(tasks);

const [reordered] = items.splice(result.source.index,1);

items.splice(result.destination.index,0,reordered);

setTasks(items);

};

return(

<DragDropContext onDragEnd={handleDragEnd}>

<Droppable droppableId="tasks">

{(provided)=>(
<div {...provided.droppableProps} ref={provided.innerRef}>

{tasks.map((task,index)=>(
<Draggable key={task._id} draggableId={task._id} index={index}>

{(provided)=>(
<div
ref={provided.innerRef}
{...provided.draggableProps}
{...provided.dragHandleProps}
className="timeline-card"
>

{task.text}

</div>
)}

</Draggable>
))}

{provided.placeholder}

</div>
)}

</Droppable>

</DragDropContext>

);

}