import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement
} from "chart.js";

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement);

export default function ProductivityGraph() {
  const data = {
    labels: ["Mon", "Tue", "Wed", "Thu"],
    datasets: [
      {
        label: "Focus Hours",
        data: [2, 4, 3, 5],
        borderColor: "#8b5cf6",
        tension: 0.4
      }
    ]
  };

  return (
    <div className="card">
      <Line data={data} />
    </div>
  );
}