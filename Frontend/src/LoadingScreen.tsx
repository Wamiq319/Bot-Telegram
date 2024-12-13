import React from "react";
import ghostIcon2 from "./images/ghost1.png"; 
import ghostIcon4 from "./images/ghost-l.png";


const LoadingScreen: React.FC = () => {
  return (
    <div className="max-w-xl relative  text-white h-screen flex flex-col items-center justify-center font-bold">
      {/* Ghost Icons */}

      {/* Loading Text */}
      <div className="relative">
        <div className="absolute -top-14 -left-10  sm:-top-12 sm:-left-16 animate-custom-bounce1">
          <img
            src={ghostIcon4}
            alt="Ghost"
            className="w-20 h-20 -rotate-12 opacity-100"
          />
        </div>
        <h1 className="text-2xl font-extrabold text-center animate-pulse mb-2">
          Are you the driver, or is <br /> the soul in control?
        </h1>
        <div className="absolute -right-8 -bottom-10  sm:-right-12 sm:-bottom-5 animate-custom-bounce2 ">
          <img
            src={ghostIcon4}
            alt="Ghost"
            className="w-20 h-20 rotate-12 opacity-100"
          />
        </div>
      </div>

      <div className=" animate-pulse">
        <img src={ghostIcon2} alt="Ghost" className="w-64 h-64 opacity-100" />
      </div>
    </div>
  );
};

export default LoadingScreen;
