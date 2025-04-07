import React from "react";
import "./../css/style.css"; // Import the CSS file
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import SignIn from "./components/signIn";
import SignUp from "./components/signUp";
import Scan from "./components/scan";

const Home: React.FC = () => {
  return (
    <div className="container2">
      <div className="screen">
        <div className="flex flex-col items-center">
          <img
            alt="qrscanner"
            className="logo2"
            src="https://i.pinimg.com/736x/f4/e0/d2/f4e0d26f3ec37e909481c5a60daed4b5.jpg"
          />
          <h1 className="title2">foodX</h1>
        </div>
      </div>
        <div className="welcome-container">
          <h2 className="welcome-title">Welcome</h2>
          <p className="welcome-text">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit.
          </p>
          <div className="flex flex-col space-y-3 w-full items-center">
          <Link to="/signin" className="btn2 btn-black">Sign In</Link>
          <Link to="/signup" className="btn2 btn-black">Sign Up</Link>
          <Link to="/scan" className="btn2 btn-black">Search</Link>
          </div>
        </div>
    </div>
  );
};

const App = () => {
  console.log("hello");
  return (
    
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/scan" element={<Scan />} />
      </Routes>
    </Router>
    
  );
};


export default App;