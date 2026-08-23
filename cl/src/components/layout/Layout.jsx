import Navbar        from "./Navbar";
import Sidebar       from "./Sidebar";
import LowEnergyPage from "../../pages/Lowenergypage";

export default function Layout({
  tasks = [], setTasks,
  energyBoost, setEnergyBoost,
  earnedTips, setEarnedTips,
  mode, setMode,
  children
}) {

  return (
    <div className="app-layout">

      <Sidebar tasks={tasks} setTasks={setTasks} />

      <div className="main-layout">

        <Navbar tasks={tasks} mode={mode} setMode={setMode} />

        <div className="page">
          {mode === "Low Energy"
            ? (
              <LowEnergyPage
                tasks={tasks}
                setTasks={setTasks}
                earned={earnedTips}
                setEarned={setEarnedTips}
                onBoostChange={setEnergyBoost}
              />
            )
            : children
          }
        </div>

      </div>

    </div>
  );
}