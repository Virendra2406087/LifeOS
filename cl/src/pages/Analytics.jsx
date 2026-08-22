import { Line, Bar, Doughnut } from "react-chartjs-2";

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    ArcElement,
    Tooltip,
    Legend,
} from "chart.js";

import "./Analytics.css";

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    ArcElement,
    Tooltip,
    Legend
);

export default function Analytics({ tasks = [] }) {

    /* =========================
       Helpers
    ========================= */

    const getDuration = (start, end) => {
        if (!start || !end) return 0;

        const [sh, sm] = start.split(":").map(Number);
        const [eh, em] = end.split(":").map(Number);

        const duration =
            (eh * 60 + em - (sh * 60 + sm)) / 60;

        return duration > 0 ? duration : 0;
    };

    /* =========================
       Basic Metrics
    ========================= */

    const completedTasks =
        tasks.filter((task) => task.completed).length;

    const pendingTasks =
        tasks.length - completedTasks;

    const completionRate =
        tasks.length === 0
            ? 0
            : Math.round(
                  (completedTasks / tasks.length) * 100
              );

    const totalFocusHours = tasks.reduce(
        (total, task) =>
            total +
            getDuration(
                task.startTime,
                task.endTime
            ),
        0
    );

    const averageTaskTime =
        tasks.length === 0
            ? 0
            : totalFocusHours / tasks.length;

    /* =========================
       Weekly Focus
    ========================= */

    const weeklyFocus = [0, 0, 0, 0, 0, 0, 0];

    tasks.forEach((task) => {

        if (!task.date) return;

        const day =
            new Date(task.date).getDay();

        weeklyFocus[day] += getDuration(
            task.startTime,
            task.endTime
        );
    });

    const weeklyFocusRounded =
        weeklyFocus.map((value) =>
            Number(value.toFixed(1))
        );

    /* =========================
       Priority
    ========================= */

    const priorityCount = {
        high: 0,
        medium: 0,
        low: 0,
    };

    tasks.forEach((task) => {

        if (task.priority === "red") {
            priorityCount.high++;
        } else if (task.priority === "blue") {
            priorityCount.medium++;
        } else {
            priorityCount.low++;
        }
    });

    /* =========================
       Chart Defaults
    ========================= */

    const chartDefaults = {
        responsive: true,
        maintainAspectRatio: false,

        plugins: {
            legend: {
                labels: {
                    color: "rgba(255,255,255,0.65)",
                    font: {
                        size: 12,
                    },
                },
            },

            tooltip: {
                backgroundColor: "#111111",
                titleColor: "#ffffff",
                bodyColor: "rgba(255,255,255,0.7)",
                borderColor: "rgba(255,255,255,0.1)",
                borderWidth: 1,
                padding: 12,
            },
        },

        scales: {
            x: {
                ticks: {
                    color: "rgba(255,255,255,0.45)",
                },

                grid: {
                    color: "rgba(255,255,255,0.05)",
                },
            },

            y: {
                beginAtZero: true,

                ticks: {
                    color: "rgba(255,255,255,0.45)",
                },

                grid: {
                    color: "rgba(255,255,255,0.05)",
                },
            },
        },
    };

    const doughnutOptions = {
        responsive: true,
        maintainAspectRatio: false,

        cutout: "68%",

        plugins: {
            legend: {
                position: "bottom",

                labels: {
                    color: "rgba(255,255,255,0.65)",

                    padding: 18,

                    font: {
                        size: 12,
                    },
                },
            },

            tooltip: {
                backgroundColor: "#111111",

                titleColor: "#ffffff",

                bodyColor: "rgba(255,255,255,0.7)",

                borderColor:
                    "rgba(255,255,255,0.1)",

                borderWidth: 1,
            },
        },
    };

    /* =========================
       Weekly Focus Chart
    ========================= */

    const lineData = {

        labels: [
            "Sun",
            "Mon",
            "Tue",
            "Wed",
            "Thu",
            "Fri",
            "Sat",
        ],

        datasets: [
            {
                label: "Focus Hours",

                data: weeklyFocusRounded,

                borderColor: "#8b5cf6",

                backgroundColor:
                    "rgba(139,92,246,0.12)",

                borderWidth: 3,

                tension: 0.45,

                fill: true,

                pointBackgroundColor:
                    "#8b5cf6",

                pointBorderColor:
                    "#ffffff",

                pointBorderWidth: 2,

                pointRadius: 4,

                pointHoverRadius: 7,
            },
        ],
    };

    /* =========================
       Completion Chart
    ========================= */

    const barData = {

        labels: [
            "Completed",
            "Pending",
        ],

        datasets: [
            {
                label: "Tasks",

                data: [
                    completedTasks,
                    pendingTasks,
                ],

                backgroundColor: [
                    "rgba(34,197,94,0.75)",
                    "rgba(249,115,22,0.75)",
                ],

                borderColor: [
                    "#22c55e",
                    "#f97316",
                ],

                borderWidth: 1,

                borderRadius: 8,

                barThickness: 45,
            },
        ],
    };

    /* =========================
       Priority Chart
    ========================= */

    const priorityData = {

        labels: [
            "High",
            "Medium",
            "Low",
        ],

        datasets: [
            {
                data: [
                    priorityCount.high,
                    priorityCount.medium,
                    priorityCount.low,
                ],

                backgroundColor: [
                    "rgba(239,68,68,0.8)",
                    "rgba(250,204,21,0.8)",
                    "rgba(34,197,94,0.8)",
                ],

                borderColor: [
                    "#ef4444",
                    "#facc15",
                    "#22c55e",
                ],

                borderWidth: 1,
            },
        ],
    };

    /* =========================
       Stats
    ========================= */

    const stats = [
        {
            icon: "📋",
            label: "Total Tasks",
            value: tasks.length,
            className: "purple",
        },

        {
            icon: "✓",
            label: "Completed",
            value: completedTasks,
            className: "green",
        },

        {
            icon: "⏳",
            label: "Pending",
            value: pendingTasks,
            className: "orange",
        },

        {
            icon: "🎯",
            label: "Completion Rate",
            value: `${completionRate}%`,
            className: "blue",
        },

        {
            icon: "⚡",
            label: "Focus Hours",
            value: `${totalFocusHours.toFixed(1)}h`,
            className: "pink",
        },

        {
            icon: "⏱",
            label: "Avg Task Time",
            value: `${averageTaskTime.toFixed(1)}h`,
            className: "cyan",
        },
    ];

    /* =========================
       Productivity Score
    ========================= */

    const productivityScore =
        Math.min(
            100,
            Math.round(
                completionRate * 0.7 +
                Math.min(totalFocusHours * 3, 30)
            )
        );

    /* =========================
       UI
    ========================= */

    return (
        <div className="analytics-page">

            {/* Header */}

            <div className="analytics-header">

                <div>
                    <div className="analytics-heading-row">

                        <div className="analytics-icon">
                            📊
                        </div>

                        <div>

                            <h1>
                                Analytics
                            </h1>

                            <p>
                                Understand your productivity,
                                focus and task performance.
                            </p>

                        </div>

                    </div>
                </div>

                <div className="analytics-period">
                    Last 7 Days
                </div>

            </div>


            {/* Stats */}

            <div className="analytics-stats">

                {stats.map((stat) => (

                    <div
                        className={`analytics-stat ${stat.className}`}
                        key={stat.label}
                    >

                        <div className="stat-icon">
                            {stat.icon}
                        </div>

                        <div>

                            <p>
                                {stat.label}
                            </p>

                            <h2>
                                {stat.value}
                            </h2>

                        </div>

                    </div>

                ))}

            </div>


            {/* Productivity Overview */}

            <div className="analytics-overview">

                <div>

                    <p>
                        Productivity Score
                    </p>

                    <h2>
                        {productivityScore}
                        <span>/100</span>
                    </h2>

                    <div className="score-bar">

                        <div
                            style={{
                                width:
                                    `${productivityScore}%`,
                            }}
                        />

                    </div>

                </div>

                <div className="score-message">

                    {productivityScore >= 80
                        ? "🔥 Excellent productivity"
                        : productivityScore >= 60
                        ? "🚀 Good progress"
                        : productivityScore >= 40
                        ? "⚡ Keep improving"
                        : "🌱 Let's build momentum"}

                </div>

            </div>


            {/* Main Charts */}

            <div className="analytics-grid">

                {/* Weekly Focus */}

                <div className="analytics-card large">

                    <div className="chart-header">

                        <div>

                            <h3>
                                Weekly Focus
                            </h3>

                            <p>
                                Hours spent on scheduled tasks
                            </p>

                        </div>

                        <span className="chart-badge">
                            Focus
                        </span>

                    </div>

                    <div className="analytics-chart">
                        <Line
                            data={lineData}
                            options={chartDefaults}
                        />
                    </div>

                </div>


                {/* Completion */}

                <div className="analytics-card">

                    <div className="chart-header">

                        <div>

                            <h3>
                                Task Completion
                            </h3>

                            <p>
                                Completed vs pending
                            </p>

                        </div>

                    </div>

                    <div className="analytics-chart">
                        <Bar
                            data={barData}
                            options={chartDefaults}
                        />
                    </div>

                </div>


                {/* Priority */}

                <div className="analytics-card">

                    <div className="chart-header">

                        <div>

                            <h3>
                                Priority Distribution
                            </h3>

                            <p>
                                Task priority breakdown
                            </p>

                        </div>

                    </div>

                    <div className="analytics-chart">
                        <Doughnut
                            data={priorityData}
                            options={doughnutOptions}
                        />
                    </div>

                </div>

            </div>


            {/* Weekly Summary */}

            <div className="analytics-card weekly-summary">

                <div className="chart-header">

                    <div>

                        <h3>
                            Weekly Performance
                        </h3>

                        <p>
                            Your focus activity throughout
                            the week
                        </p>

                    </div>

                </div>


                <div className="day-summary">

                    {weeklyFocusRounded.map(
                        (hours, index) => {

                            const max =
                                Math.max(
                                    ...weeklyFocusRounded,
                                    1
                                );

                            const percentage =
                                (hours / max) * 100;

                            const days = [
                                "Sun",
                                "Mon",
                                "Tue",
                                "Wed",
                                "Thu",
                                "Fri",
                                "Sat",
                            ];

                            return (
                                <div
                                    className="day-item"
                                    key={days[index]}
                                >

                                    <div className="day-label">
                                        {days[index]}
                                    </div>

                                    <div className="day-bar">

                                        <div
                                            style={{
                                                height:
                                                    `${percentage}%`,
                                            }}
                                        />

                                    </div>

                                    <strong>
                                        {hours}h
                                    </strong>

                                </div>
                            );
                        }
                    )}

                </div>

            </div>


            {/* Empty State */}

            {tasks.length === 0 && (

                <div className="analytics-empty">

                    <div>
                        📈
                    </div>

                    <h3>
                        No analytics yet
                    </h3>

                    <p>
                        Add some tasks to start
                        tracking your productivity.
                    </p>

                </div>

            )}

        </div>
    );
}