// Friends.tsx
import React, { useEffect, useState } from "react";
import { useUser } from "./UserContext";

import copyIcon from "./images/copy.png";
import inviteTopIcon from "./images/invite-top-ghost.png";
import inviteIcon from "./images/invite-ghost.png";
import ghostIcon4 from "./images/ghost-l.png";
import Modal from "./Modal"; // Importing the Modal component

const FriendsPage: React.FC = () => {
  const { userID, setPoints } = useUser(); // Retrieve the userID and setPoints from global context
  const [friends, setFriends] = useState<
    Array<{ Username: string; totalstim: number }>
  >([]);
  const [modalMessage, setModalMessage] = useState<string | null>(null); // Modal state
  const FRIEND_REWARD = 60; // Points reward per new friend

  // Invitation link
  const invitationLink = `https://t.me/SoulpartyInBot?startapp=${encodeURIComponent(
    userID
  )}`;

  const handleInvite = () => {
    window.open(
      `https://t.me/share/url?url=${encodeURIComponent(invitationLink)}`,
      "_blank"
    );
  };

  const setupInvitationLinkCopy = () => {
    const tempTextArea = document.createElement("textarea");
    tempTextArea.value = invitationLink; // Set the value to the invitation link
    document.body.appendChild(tempTextArea); // Add it to the document
    tempTextArea.select(); // Select the text inside the text area
    document.execCommand("copy"); // Execute the copy command
    document.body.removeChild(tempTextArea); // Remove the temporary text area from the document
    showModal("Invitation link copied to clipboard!");
  };

  const showModal = (message: string) => {
    setModalMessage(message);
  };

  const closeModal = () => {
    setModalMessage(null);
  };

  // Function to update the `Refertotal` status with the actual number of friends
  const updateRefertotal = async (totalFriends: number) => {
    try {
      await fetch("https://app.soulpartyin.com/api/update_user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ UserId: userID, Refertotal: totalFriends }),
      });
    } catch (error) {
      console.error("Failed to update Refertotal:", error);
    }
  };

  // Function to retrieve Refertotal from the backend
  const fetchRefertotal = async (): Promise<number> => {
    try {
      const response = await fetch(
        `https://app.soulpartyin.com/api/get_user?UserId=${userID}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        }
      );

      const data = await response.json();

      // Adjust based on backend response structure
      // If Refertotal is nested under 'data'
      const refertotal =
        data.data && data.data.Refertotal !== null ? data.data.Refertotal : 0;

      return refertotal;
    } catch (error) {
      console.error("Error fetching Refertotal:", error);
      return 0;
    }
  };

  // Logic to fetch friends and handle rewarding
  const fetchAndRewardFriends = async () => {
    try {
      // 1. Fetch current number of invited friends (Refer)
      const response = await fetch(
        `https://app.soulpartyin.com/api/get_invitations?UserId=${userID}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        }
      );

      const friendsData = await response.json();

      let Refer = 0; // Number of friends invited
      if (Array.isArray(friendsData)) {
        Refer = friendsData.length;
        setFriends(friendsData); // Update state if friends data is received

        // Save to localStorage for display
        localStorage.setItem(`friends_${userID}`, JSON.stringify(friendsData));
      } else if (friendsData.error === "No invitations found") {
        Refer = 0;
        setFriends([]);

        // Clear friends data from localStorage
        localStorage.removeItem(`friends_${userID}`);
      } else {
        Refer = 0;
        setFriends([]);

        // Clear friends data from localStorage
        localStorage.removeItem(`friends_${userID}`);
      }

      // 2. Fetch Refertotal from the backend
      const Refertotal = await fetchRefertotal();

      // 3. Compare Refer and Refertotal
      if (Refer > Refertotal) {
        const newFriends = Refer - Refertotal;

        const rewardPoints = newFriends * FRIEND_REWARD;

        setPoints((prevPoints) => prevPoints + rewardPoints);
        showModal(
          `You have earned ${rewardPoints} points for inviting ${newFriends} new friend${
            newFriends > 1 ? "s" : ""
          }!`
        );

        // 4. Update Refertotal in the backend
        await updateRefertotal(Refer);
      }
    } catch (error) {
      console.error("Error in fetchAndRewardFriends:", error);
    }
  };

  // Fetch friends data and handle rewarding on component load
  useEffect(() => {
    if (userID) {
      // Load friends from local storage for display
      const localFriends = localStorage.getItem(`friends_${userID}`);
      if (localFriends) {
        try {
          const parsedFriends = JSON.parse(localFriends);
          setFriends(parsedFriends);
        } catch (error) {
          // If parsing fails, remove corrupted data
          localStorage.removeItem(`friends_${userID}`);
        }
      }

      // Fetch friends from the database and handle rewarding
      fetchAndRewardFriends();
    }
  }, [userID]);

  return (
    <div className="bg-black flex justify-center h-screen">
      <div className="w-full text-white font-bold flex flex-col max-w-xl">
        <div className="flex justify-center">
          <img
            src={inviteTopIcon}
            alt="Invite Top Icon"
            className="w-28 h-28 -mb-11 "
          />
        </div>
        {/* Header Section */}
        <div className="relative text-center mt-6 mb-6">
          <div className="absolute right-2 sm:right-6 md:right-16 bottom-6">
            <img
              src={ghostIcon4}
              alt="Ghost"
              className="w-14 h-14 md:w-20 rotate-12 md:h-20 opacity-100"
            />
          </div>
          <div className="absolute sm:left-6 md:left-20 -bottom-7">
            <img
              src={ghostIcon4}
              alt="Ghost"
              className="w-14 md:w-20 rotate-[-25deg] h-14 md:h-20 opacity-100"
            />
          </div>
          <h2 className="text-white-500 text-xl mb-3 text-medium">
            Invite Souls!
          </h2>
          <p className="text-[.8rem] text-[#bebdbd] text-regular">
            You will receive bonus for each valid <br /> invitation.
            <span className="text-[#fff]"> Learn more!</span>
          </p>
        </div>

        {/* Invite Boxes Section */}
        <div className="grid grid-cols-12 gap-2 md:gap-5 px-4 mt-6">
          <div
            onClick={handleInvite}
            className="bg-[#1B78EF] cursor-pointer col-span-9 rounded-xl px-5 flex items-center"
          >
            <img
              src={inviteIcon}
              alt="Invite Icon"
              className="w-16 h-16 sm:w-20 sm:h-20"
            />
            <div className="sm:ml-0">
              <p className="sm:text-2xl text-bold text-[#fff]">Invite a soul</p>
              <p className="text-[.5rem] sm:text-base text-[#dedede] text-regular">
                +60 for each valid referral
              </p>
            </div>
          </div>
          <div
            onClick={setupInvitationLinkCopy}
            className="bg-[#606060] col-span-3 flex justify-center items-center rounded-xl cursor-pointer"
          >
            <img
              src={copyIcon}
              alt="Copy Icon"
              className="w-14 h-14 sm:h-20 sm:w-20 object-contain"
            />
          </div>
        </div>

        {/* Friends List */}
        <div className="bg-gray-750/70 rounded-lg p-4 mx-2 text-white pb-20">
          <h3 className="text-[#848484] text-base mb-2 text-regular">Souls</h3>
          {friends.length > 0 ? (
            friends.map((friend, index) => (
              <div
                key={friend.Username}
                className="flex items-center justify-between mb-4"
              >
                <div className="flex items-center">
                  <div
                    className={`${
                      index === 0
                        ? "bg-[#FE914D]"
                        : index === 1
                        ? "bg-[#FFDE59]"
                        : index === 2
                        ? "bg-[#1B78F0]"
                        : index === 3
                        ? "bg-[#7ED956]"
                        : index === 4
                        ? "bg-[#606060]"
                        : index === 5
                        ? "bg-[#CA6BE5]"
                        : "bg-[#f06018]"
                    } rounded-full w-9 h-9 flex items-center justify-center text-white text-lg font-bold`}
                  >
                    {friend.Username.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="ml-4">
                    <p className="text-[.9rem] font-normal ">
                      {friend.Username}
                    </p>
                  </div>
                </div>
                <div className="">
                  <p className="text-[#fff] text-base font-normal">+60 SOUL</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-400">No Souls yet.</p>
          )}
        </div>
      </div>

      {/* Modal Component */}
      {modalMessage && <Modal message={modalMessage} onClose={closeModal} />}
    </div>
  );
};

export default FriendsPage;
