import { useEffect, useState } from "react";
import { getPriorityTasks } from "../services/aiPriorityService";

export default function useAIPriority(tasks) {
  const [priorityTasks, setPriorityTasks] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!tasks || tasks.length === 0) {
      setPriorityTasks([]);
      return;
    }

    async function loadPriority() {
      setLoading(true);

      const result = await getPriorityTasks(tasks);

      setPriorityTasks(result);
      setLoading(false);
    }

    loadPriority();
  }, [tasks]);

  return {
    priorityTasks,
    loading,
  };
}