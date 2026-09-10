import { FaChartLine } from "react-icons/fa";

import useProductivityPrediction
  from "../../hooks/useProductivityPrediction";
import { CalendarDays, CircleCheck, Coffee, Timer, Trophy } from "lucide-react";


export default function ProductivityPrediction() {

  const {
    score,
    features,
    loading
  } = useProductivityPrediction();


  return (

    <div className="glass-card">

      <h3>

        <FaChartLine />

        {" "}

        ML Productivity Prediction

      </h3>


      {loading ? (

        <p>
          Analyzing your productivity...
        </p>

      ) : (

        <>

          <h1>
            {Number(score).toFixed(2)}%
          </h1>


          <p>
            Predicted productivity for today
          </p>


          {features && (

            <div className="ml-features">

              <p>
                <CircleCheck/> Completed:
                {" "}
                {features.tasks_completed}
              </p>


              <p>
                <Timer/> Pending:
                {" "}
                {features.tasks_pending}
              </p>


              <p>
                <Trophy/> Focus:
                {" "}
                {Number(
                  features.focus_hours
                ).toFixed(2)}
                {" "}hours
              </p>


              <p>
                <Coffee/> Breaks:
                {" "}
                {features.breaks}
              </p>


              <p>
                <CalendarDays/> Meetings:
                {" "}
                {features.meetings}
              </p>

            </div>

          )}

        </>

      )}

    </div>

  );

}