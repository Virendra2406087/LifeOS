// Convert HH:MM → minutes
function timeToMinutes(time){
  const [h,m] = time.split(":").map(Number);
  return h*60 + m;
}

// Convert minutes → HH:MM
function minutesToTime(min){
  const h = Math.floor(min/60);
  const m = min%60;
  return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`;
}

export function aiSchedule(tasks){

  if(!tasks || tasks.length === 0) return [];

  // Sort tasks by start time
  let sorted = [...tasks].sort((a,b)=>
    timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
  );

  let result = [];

  for(let i=0;i<sorted.length;i++){

    let task = {...sorted[i]};

    let start = timeToMinutes(task.startTime);
    let end = timeToMinutes(task.endTime);

    // Calculate duration
    let duration = end - start;

    if(result.length === 0){
      result.push(task);
      continue;
    }

    let prev = result[result.length-1];
    let prevEnd = timeToMinutes(prev.endTime);

    // If conflict detected
    if(start < prevEnd){

      start = prevEnd;
      end = start + duration;

      task.startTime = minutesToTime(start);
      task.endTime = minutesToTime(end);

    }

    result.push(task);

  }

  return result;
}