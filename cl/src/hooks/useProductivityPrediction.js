import {
  useEffect,
  useState
} from "react";

import {
  getTodayProductivity
} from "../services/mlService";


export default function useProductivityPrediction() {

  const [score, setScore] = useState(0);

  const [features, setFeatures] =
    useState(null);

  const [loading, setLoading] =
    useState(true);


  useEffect(() => {

    const loadPrediction =
      async () => {

        try {

          setLoading(true);


          const result =
            await getTodayProductivity();


          console.log(
            "Today's ML prediction:",
            result
          );


          if (result.success) {

            setScore(
              Number(result.prediction)
            );


            setFeatures(
              result.features
            );

          }


        } catch (error) {

          console.error(
            "Productivity prediction failed:",
            error
          );

        } finally {

          setLoading(false);

        }

      };


    loadPrediction();

  }, []);


  return {

    score,

    features,

    loading

  };

}