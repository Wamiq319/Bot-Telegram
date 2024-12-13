import React, { useEffect, useState } from "react";
import { useUser } from "./UserContext"; // Import UserContext

const LeaderboardPage: React.FC = () => {
  // Access userID from UserContext
  const { userID } = useUser();

  // State for own ranking, leaderboard data, and total users
  const [ownRanking, setOwnRanking] = useState({
    username: "",
    totalstim: 0,
    position: 0,
  });

  const [leaderboardData, setLeaderboardData] = useState<
    Array<{ username: string; totalstim: number; position: number }>
  >([]);
  const [totalUsers, setTotalUsers] = useState("0");

  // Fetch leaderboard data from the API
  useEffect(() => {
    const fetchLeaderboardData = async () => {
      try {
        // Replace with your backend API endpoint and userID from context
        const response = await fetch(
          `https://app.soulpartyin.com/api/get_user_ranking?UserId=${userID}`
        );
        const data = await response.json();

        // Set ownRanking based on the "requested_user" data
        if (data.requested_user) {
          setOwnRanking({
            username: data.requested_user.username,
            totalstim: data.requested_user.totalstim,
            position: data.requested_user.position,
          });
        }

        // Set leaderboardData from the "top_users" array
        if (data.top_users) {
          const formattedLeaderboardData = data.top_users.map((user: any) => ({
            username: user.username,
            totalstim: user.totalstim,
            position: user.rank,
          }));
          setLeaderboardData(formattedLeaderboardData);
        }

        // Set total users
        if (data.total_users) {
          setTotalUsers(data.total_users);
        }
      } catch (error) {
        console.error("Error fetching leaderboard data:", error);
      }
    };

    // Call the function to fetch data when the component loads
    fetchLeaderboardData();
  }, [userID]); // Runs when userID is available

  return (
    <div className="relative inset-0 bg-black text-white z-1">
      <div className="flex flex-col items-center pt-[15%] h-[94vh] overflow-y-scroll scrollbar-hide pb-20">
        {/* Title */}
        <h1
          className="text-4xl text-bold mb-8"
          style={{
            fontFamily: "Poppins, SF Pro Display, Roboto, Arial, sans-serif",
          }}
        >
          Top Souls
        </h1>

        {/* Display Own Ranking */}
        {ownRanking && (
          <div
            className="w-11/12   h-24 rounded-xl bg-[#1C1C1E] flex items-center justify-between px-4 sm:px-6 py-3 mb-12"
            style={{
              fontFamily: "Poppins, SF Pro Display, Roboto, Arial, sans-serif",
            }}
          >
            <div className="flex items-center">
              <div className="bg-[#039BE4] rounded-full w-9 h-9 flex items-center justify-center text-white text-regular ">
                {ownRanking.username.slice(0, 2).toUpperCase()}
              </div>
              <div className="ml-4">
                <p className="text-regular mb-1 text-[.8rem]">
                  {ownRanking.username}
                </p>
                <p className="text-gray-400 text-base">
                  {ownRanking.totalstim} SOUL
                </p>
              </div>
            </div>
            <p className="text[#fff] text-regular text-base mr-5">
              #{ownRanking.position}
            </p>{" "}
            {/* Show own ranking */}
          </div>
        )}

        {/* Leaderboard */}
        <div className="w-11/12">
          {/* Display total users */}
          <p
            className="text-bold text-lg text-[#fff] mb-5"
            style={{
              fontFamily: "Poppins, SF Pro Display, Roboto, Arial, sans-serif",
            }}
          >
            {totalUsers} holders
          </p>

          {/* Display the top users */}
          {leaderboardData.slice(0, 3).map((user, index) => (
            <div key={index} className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div
                  className={`${
                    index === 0
                      ? "bg-[#FE6F00] text-[#fff]"
                      : index === 1
                      ? "bg-pink-500"
                      : "bg-[#FE6F00]"
                  } rounded-full w-9 h-9 flex items-center justify-center text-white text-base text-regular`}
                >
                  {user.username.slice(0, 2).toUpperCase()}
                </div>
                <div className="ml-4">
                  <p className="text-regular text-[.8rem]">{user.username}</p>
                  <p className="text-gray-400 text-base">
                    {user.totalstim} SOUL
                  </p>
                </div>
              </div>
              <div className="text-yellow-500 text-xl">
                {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}{" "}
                {/* Emojis for top 3 */}
              </div>
            </div>
          ))}

          {/* Display the rest of the leaderboard */}
          {leaderboardData.slice(3).map((user, index) => (
            <div
              key={index + 3}
              className="flex items-center justify-between mb-6"
            >
              <div className="flex items-center">
                <div className="bg-gray-600 rounded-full w-10 h-10 flex items-center justify-center text-white text-lg text-bold">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div className="ml-4">
                  <p className="text-regular text-[.8rem]">{user.username}</p>
                  <p className="text-gray-400 text-base">
                    {user.totalstim} SOUL
                  </p>
                </div>
              </div>
              <p className="text-[#fff]">#{user.position}</p>{" "}
              {/* Adjust index for serial numbers */}
            </div>
          ))}
        </div>
        <div className="h-20"></div>
      </div>
    </div>
  );
};

export default LeaderboardPage;
