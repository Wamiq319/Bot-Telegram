import React, { useEffect, useState } from "react";
import { useUser } from "./UserContext";
import checkboxImage from "./images/check3.png";
import ghostIcon1 from "./images/ghost1.png";
import ghostIcon2 from "./images/ghost1.png";
import ghostIcon3 from "./images/ghost3.png";
import ghostIcon5 from "./images/ghost5.png";
interface OverlayPageProps {
  closeOverlay: () => void;
  setUpdatingFromOverlay: (status: boolean) => void; // Accepting the setUpdatingFromOverlay function from props
}

const OverlayPage: React.FC<OverlayPageProps> = ({
  closeOverlay,
  setUpdatingFromOverlay,
}) => {
  const { userID, setPoints } = useUser(); // Removed 'isStar' as it's no longer needed

  const [completed, setCompleted] = useState([
    false,
    false,
    false,
    false,
    false,
  ]);
  const [tickVisible, setTickVisible] = useState([
    false,
    false,
    false,
    false,
    false,
  ]);
  const [showFinalPage, setShowFinalPage] = useState(false);
  const [showFinalPage3, setShowFinalPage3] = useState(false); // Retained as it's used
  const [yearsAgo, setYearsAgo] = useState(1); // Initially set to 1
  const [totalReward, setTotalReward] = useState(0); // Initially set to 0
  const [isDataFetched, setIsDataFetched] = useState(false); // Track if data has been fetched
  const [isUpdated, setIsUpdated] = useState(false); // Flag to ensure update happens only once

  // Function to fetch Telegram account age and calculate reward
  const fetchYearsAgo = async () => {
    try {
      console.log("Fetching years ago for user:", userID);

      // Construct the URL with the userID parameter
      const url = `https://app.soulpartyin.com/api/get_creation_month_count?userid=${userID}`;

      // Fetch data from the API
      const response = await fetch(url);

      if (response.ok) {
        // Parse the JSON response
        const data = await response.json();
        console.log("API response:", data);

        // Set state for years ago based on API response
        setYearsAgo(data.years);
        setIsDataFetched(true); // Flag indicating data has been fetched

        // Set total reward to the age-based reward
        const totalCalculatedReward = data.reward;

        console.log("Total Calculated Reward:", totalCalculatedReward); // Logging the computed reward

        // Update state for total reward
        setTotalReward(totalCalculatedReward);

        // Ensure update_user is only called once
        if (!isUpdated) {
          // Mark update as coming from overlay
          setUpdatingFromOverlay(true);

          // Update the user's points in the context directly to the age-based reward
          setPoints(totalCalculatedReward);

          // POST request to update the user with the new total reward
          const updateResponse = await fetch(
            "https://app.soulpartyin.com/api/update_user",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                UserId: userID,
                totalstim: totalCalculatedReward,
              }),
            }
          );

          if (updateResponse.ok) {
            console.log("User data updated successfully");
            setIsUpdated(true); // Mark as updated to prevent further updates
          } else {
            console.error(
              "Failed to update user data:",
              updateResponse.statusText
            );
          }

          // Reset updatingFromOverlay after the update is complete
          setUpdatingFromOverlay(false);
        }
      } else {
        console.error("Error fetching data:", response.statusText);
      }
    } catch (error) {
      console.error("API call error:", error);
      setUpdatingFromOverlay(false); // Reset flag on error as well
    }
  };

  // Fetch yearsAgo when the component mounts
  useEffect(() => {
    fetchYearsAgo();
  }, []);

  // Run animation alongside data fetch
  useEffect(() => {
    if (isDataFetched) {
      completed.forEach((_, index) => {
        setTimeout(() => {
          setCompleted((prev) => {
            const updated = [...prev];
            updated[index] = true;
            return updated;
          });

          setTimeout(() => {
            setTickVisible((prev) => {
              const updated = [...prev];
              updated[index] = true;
              return updated;
            });

            if (index === completed.length - 1) {
              setTimeout(() => {
                setShowFinalPage(true);
              }, 1000);
            }
          }, 1000);
        }, index * 2000);
      });
    }
  }, [isDataFetched]);

  // Final Page 3
  const FinalPage3 = () => {
    return (
      <div
        className="fixed inset-0 flex flex-col justify-around items-center"
        style={{
          backgroundColor: "black",
          minHeight: "100vh",
          color: "white",
          textAlign: "center",
          padding: "0 16px",
          zIndex: 9999,
        }}
      >
        {/* Three Lines at the Top */}
        <div className="mt-20 flex justify-center items-center space-x-2">
          <div
            style={{ height: "4px", backgroundColor: "gray", width: "50px" }}
          ></div>
          <div
            style={{ height: "4px", backgroundColor: "gray", width: "80px" }}
          ></div>
          <div
            style={{ height: "4px", backgroundColor: "white", width: "50px" }}
          ></div>
        </div>

        {/* Top Text */}
        <div className="mt-4">
          <h1 className="text-2xl font-bold">You've earned souls!</h1>
          <p className="text-base mt-1">HERE YOU GO</p>
        </div>

        {/* Central Reward Display */}
        <div className="flex flex-col items-center relative">
          <div className="absolute -top-40 md:-top-44 -left-20 sm:-left-28 md:-left-32 animate-custom-bounce2">
            <img
              src={ghostIcon3}
              alt="Ghost"
              className="w-32 md:w-36 h-32 md:h-36 opacity-100"
            />
          </div>
          
          <div className=" absolute -top-32 md:-top-40 animate-pulse">
            <img
              src={ghostIcon2}
              alt="Ghost"
              className="w-40 md:w-48  h-40 md:h-48 opacity-100"
            />
          </div>
          <div className="text-[4.5rem] font-extrabold leading-none">
            {totalReward}
          </div>
          <p className="text-2xl text-bold mt-1">SOUL</p>
          <div className="absolute -right-20 sm:-right-28 md:-right-32 -top-40 md:-top-44 animate-custom-bounce2 ">
            <img
              src={ghostIcon5}
              alt="Ghost"
              className="w-32 md:w-36 h-32 md:h-36 opacity-100"
            />
          </div>
        </div>

        {/* Finish Button */}
        <button
          onClick={() => {
            console.log("Finish button clicked");
            closeOverlay();
          }}
          className="px-6 py-3  flex justify-center items-center bg-[#282929] text-[#1F7FFA] rounded-2xl text-lg font-semibold mb-8"
          style={{ width: "80%" }}
        >
          <span>Take Me In</span>
          <img src={ghostIcon1} alt="" className="w-10 " />
        </button>
      </div>
    );
  };

  // Final Page
  const FinalPage = () => {
    return (
      <div
        className="fixed inset-0 flex flex-col justify-around items-center"
        style={{
          backgroundColor: "black",
          minHeight: "100vh",
          color: "white",
          textAlign: "center",
          padding: "0 16px",
          zIndex: 9999,
        }}
      >
        {/* Three Lines at the Top */}
        <div className="mt-20 flex justify-center items-center space-x-2">
          <div
            style={{ height: "4px", backgroundColor: "white", width: "50px" }}
          ></div>
          <div
            style={{ height: "4px", backgroundColor: "gray", width: "80px" }}
          ></div>
          <div
            style={{ height: "4px", backgroundColor: "gray", width: "50px" }}
          ></div>
        </div>

        {/* Top Text */}
        <div className="mt-4">
          <h1 className="text-3xl font-bold">You are a master soul!</h1>
        </div>

        {/* Central Large Text */}
        <div className="flex flex-col items-center relative">
          <div className="absolute -top-20 -left-24 sm:-left-32 animate-pulse">
            <img
              src={ghostIcon3}
              alt="Ghost"
              className="w-32 h-32 opacity-100"
            />
          </div>
          <p className="text-2xl mt-1">your soul age </p>
          <div className="text-[4.5rem] mt-3 font-extrabold leading-none">
            {yearsAgo}
          </div>
          <p className="text-2xl mt-1">years</p>
          <div className="absolute -right-24 sm:-right-32 -top-20 animate-pulse ">
            <img
              src={ghostIcon5}
              alt="Ghost"
              className="w-32 h-32 opacity-100"
            />
          </div>
        </div>

        {/* Continue Button */}
        <button
          onClick={() => setShowFinalPage3(true)}
          className="flex justify-center items-center px-6 py-3 bg-[#282929] text-[#1F7FFA] rounded-2xl text-lg font-semibold mb-8"
          style={{ width: "80%" }}
        >
          <span>Continue</span>
          <img src={ghostIcon1} alt="" className="w-10 " />
        </button>
      </div>
    );
  };

  if (showFinalPage3) {
    return <FinalPage3 />;
  }

  if (showFinalPage) {
    console.log("Final Page:", userID);
    return <FinalPage />;
  }

  // Main content (loading animation and checks)
  return (
    <div className="z-50 fixed inset-0 bg-black flex flex-col justify-start items-center font-poppins">
      {/* Animation and checklist page */}
      <div className="relative text-center text-white w-80">
        <h1 className="text-4xl font-extrabold mt-[10vh] mb-32 text-white">
          Checking your account
        </h1>

        {/* List of checks */}
        <div className="space-y-4 mt-2">
          {[
            "Account Age Verified",
            "Activity Level Analyzed",
            "Telegram Premium Checked",
            "OG Status Confirmed",
            "Soul Detected",
          ].map((text, index) => (
            <div
              key={index}
              className="flex flex-col items-start justify-between bg-transparent py-1"
            >
              <div className="flex justify-between w-full">
                <span className="text-lg font-semibold text-white">{text}</span>
                {tickVisible[index] && (
                  <img src={checkboxImage} alt="Checked" className="w-6 h-6" />
                )}
              </div>
              <div className="w-full h-[4px] bg-transparent mt-1">
                <div
                  className={`h-full bg-[#FFFFFF] transition-width duration-1000 ease-linear ${
                    completed[index] ? "w-full" : "w-0"
                  }`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OverlayPage;
