import { Link } from "react-router-dom";

export default function LandingPage() {

  return (

    <div className="landing-container">

      {/* NAVBAR */}

      <nav className="landing-nav">
        <h1 className="logo">LifeOS</h1>

        <div className="nav-buttons">
          <Link to="/login">
            <button className="nav-btn login">Login</button>
          </Link>

          <Link to="/register">
            <button className="nav-btn register">Register</button>
          </Link>
        </div>
      </nav>

      {/* HERO SECTION */}

      <div className="hero">

        <h1 className="hero-title">
          Your AI Powered <span>Life Productivity System</span>
        </h1>

        <p className="hero-sub">
          Plan your day with AI, manage tasks, track productivity
          and build the ultimate life dashboard.
        </p>

        <div className="hero-buttons">

          <Link to="/register">
            <button className="hero-btn start">
              🚀 Get Started
            </button>
          </Link>

          <Link to="/login">
            <button className="hero-btn login">
              Login
            </button>
          </Link>

        </div>

      </div>

      {/* FEATURES */}

      <div className="features">

        <div className="feature-card">
          🧠 AI Auto Schedule
          <p>Automatically plan your day using AI</p>
        </div>

        <div className="feature-card">
          ⚡ Energy Based Tasks
          <p>Schedule work based on your energy</p>
        </div>

        <div className="feature-card">
          📊 Productivity Analytics
          <p>Track your daily productivity</p>
        </div>

        <div className="feature-card">
          🤖 AI Life Assistant
          <p>Get smart task suggestions</p>
        </div>

      </div>

    </div>

  );
}