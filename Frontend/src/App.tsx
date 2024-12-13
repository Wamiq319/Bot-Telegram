// App.tsx
import React, { useState, useEffect, useCallback } from "react";
import { MdHome } from "react-icons/md";
import { BsLightningChargeFill } from "react-icons/bs";
import { IoLinkOutline } from "react-icons/io5";
import { LiaHandPointerSolid } from "react-icons/lia";
import ghostIcon2 from "./images/home-ghost.png";
import ghostIcon1 from "./images/ghost1.png";
import ghostIcon4 from "./images/ghost4.png";
import leaderboardIcon from "./images/nav-leaderboard.png";
import activeLeaderboardIcon from "./images/active-leaderboard.png";
import navGhostIcon from "./images/nav-ghost.png";
import activeNavGhostIcon from "./images/active-ghost.png";
import { MdOutlineVideoLibrary } from "react-icons/md";
import { useUser } from "./UserContext";
import "./App.css";
import Modal from "./Modal";
import Leaderboard from "./Leaderboard";
import LoadingScreen from "./LoadingScreen";
import OverlayPage from "./overlaypage";
import FriendsPage from "./Friends";
import { Toaster } from "react-hot-toast";
import {
  TonConnectButton,
  useTonAddress,
  useTonConnectUI,
} from "@tonconnect/ui-react";
import doneIcon from "./images/done.png";
import { useAdsgram } from "./hooks/useAdsgram";

declare const Telegram: any;

interface TaskItemProps {
  title: string;
  reward: number;
  status: "not_started" | "loading" | "claimable" | "completed";
  onClick?: () => void;
  onClaim?: () => void;
}

const TaskItem: React.FC<TaskItemProps> = ({
  title,
  reward,
  onClick,
  onClaim,
  status,
}) => {
  return (
    <div
      onClick={status === "not_started" ? onClick : undefined}
      className={`flex items-center justify-between bg-[#222222]/70 rounded-xl pt-[.4rem] pb-3 px-4 sm:px-8 mb-4 border border-[#3b3a3b] ${
        status === "not_started" ? "hover:bg-[#242424] cursor-pointer" : ""
      } ${status === "completed" ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <div className="flex items-center">
        {/* Removed Icon Rendering to maintain original layout */}
        <div className="text-white">
          {/* Title with smaller and bolder styling */}
          <div className="text-bold text-[.9rem] leading-relaxed mb-1">
            {title}
          </div>
          {/* Smaller than text-base */}
          <div className="text-sm sm:text-base flex items-center leading-relaxed">
            <p>+{reward} SOUL</p>
          </div>
        </div>
      </div>
      <div className="text-gray-400">
        {status === "completed" && (
          <img src={doneIcon} alt="Done" className="w-6 h-6" />
        )}
        {status === "loading" && <div className="loader"></div>}
        {status === "claimable" && onClaim && (
          <button
            onClick={() => {
              // Immediately set status to 'loading' to prevent multiple clicks
              onClaim();
            }}
            className="bg-[#222221] text-white px-2 rounded-full border border-[#434343] py-0 ml-4"
          >
            Check
          </button>
        )}
        {status === "not_started" && (
          <button
            onClick={onClick}
            className={` ${
              title === "Engage with SOUL" ||
              title === "Send a Soul wave on TON"
                ? "bg-[#EF5353]"
                : "bg-[#0275EF]"
            } w-[40px] sm:w-[50px] text-[#ffffff] sm:px-2 py-2 rounded-full flex justify-center items-center`}
          >
            {title === "Engage with SOUL" ||
            title === "Send a Soul wave on TON" ? (
              <LiaHandPointerSolid className="w-8 h-4" />
            ) : (
              // <BsLightningChargeFill  />
              <span className="w-4 h-2 flex justify-center items-center pt-1 pl-2">
                &#10148;
              </span>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const {
    points,
    setPoints,
    userID,
    setUserID,
    walletid,
    setWalletid, // Added setWalletid
  } = useUser();
  const [tonConnectUI] = useTonConnectUI();
  const address = useTonAddress();
  const [modalMessage, setModalMessage] = useState<string | null>(null);
  const [taskStatus, setTaskStatus] = useState<{
    [key: string]: "not_started" | "loading" | "claimable" | "completed";
  }>({});
  const [lastClaimedTime, setLastClaimedTime] = useState<number | null>(null);
  const [showOverlayPage, setShowOverlayPage] = useState(false);
  const [overlayShownOnce, setOverlayShownOnce] = useState(false);
  const [updatingFromOverlay, setUpdatingFromOverlay] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activePage, setActivePage] = useState<
    "home" | "friends" | "leaderboard"
  >("home");

  const closeModal = () => setModalMessage(null);

  const closeOverlay = async () => {
    setShowOverlayPage(false);
    await loadPoints(userID);
  };

  const showAlert = (message: string) => {
    setModalMessage(message);
  };

  const [lastSavedPoints, setLastSavedPoints] = useState<number>(points);
  const [transactionCount, setTransactionCount] = useState<number>(0);
  const [refertotal, setRefertotal] = useState<number>(0);

  // Per Refer Reward
  const perReferReward = 60;

  // State variable to store user's rank
  const [userRank, setUserRank] = useState<number | null>(null);

  // Function to convert Ton to Nanoton
  const tonToNanoton = (value: string): string => {
    if (value !== "") {
      return (parseFloat(value) * 1e9).toString();
    } else return "";
  };

  // Function to save points to the backend
  const savePoints = async () => {
    if (!userID || updatingFromOverlay) return;

    try {
      await fetch("https://app.soulpartyin.com/api/update_user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ UserId: userID, totalstim: points }),
      });
      console.log("Points saved:", points);
      setLastSavedPoints(points);
    } catch (error) {
      console.error("Failed to save points:", error);
      showAlert("Failed to save points. Please check your connection.");
    }
  };

  // Effect to save points when they change
  useEffect(() => {
    if (points !== lastSavedPoints) {
      savePoints();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points, lastSavedPoints]);

  // Function to save task completion to backend
  const saveTaskCompletion = async (
    taskKey: string,
    column: string,
    reward: number
  ) => {
    try {
      let updateData: any = { UserId: userID, [column]: "Done" };

      // If the task is a daily task, update dailycombotime
      if (taskKey === "DailyReward" || taskKey === "SendSoulWave") {
        updateData.dailycombotime = Date.now();
      }

      await fetch("https://app.soulpartyin.com/api/update_user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      setTaskStatus((prevState) => ({
        ...prevState,
        [taskKey]: "completed",
      }));

      setPoints((prevPoints) => prevPoints + reward);
      localStorage.setItem(
        `taskStatus_${userID}`,
        JSON.stringify({ ...taskStatus, [taskKey]: "completed" })
      );
      showAlert(`Thank you! You have earned ${reward} SOUL.`);

      // Additional handling for Transaction task to update claimedtotal
      if (taskKey === "Transaction") {
        const newCount = transactionCount + 1;
        try {
          await fetch("https://app.soulpartyin.com/api/update_user", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ UserId: userID, claimedtotal: newCount }),
          });
          setTransactionCount(newCount);
        } catch (error) {
          console.error("Failed to update claimedtotal:", error);
          showAlert("Failed to update transaction count. Please try again.");
        }
      }
    } catch (error) {
      console.error(`Failed to complete task ${taskKey}:`, error);
      showAlert(
        "An error occurred while completing the task. Please try again later."
      );
    }
  };

  // Function to load user points from the backend
  const loadPoints = async (userid: string) => {
    try {
      const response = await fetch(
        `http://127.0.0.1:5000/get_user?UserId=${userid}`
      );
      const data = await response.json();
      if (data && data.data && data.data.totalstim !== undefined) {
        setPoints(data.data.totalstim);
        setLastSavedPoints(data.data.totalstim);
        setRefertotal(Number(data.data.Refertotal) || 0);
      } else {
        console.error("Points data not found in the response.");
        showAlert("Failed to load points data.");
      }
    } catch (error) {
      console.error("Failed to load points from database:", error);
      showAlert("Failed to load points. Please check your connection.");
    }
  };

  // Function to load task statuses from the backend
  const loadTaskStatus = (data: any) => {
    const now = Date.now();

    // Determine if daily tasks are available based on dailycombotime
    const isDailyRewardAvailable =
      !data.data.dailyclaimedtime ||
      now - data.data.dailyclaimedtime >= 24 * 60 * 60 * 1000
        ? "not_started"
        : "completed";

    const isSendSoulWaveAvailable =
      !data.data.dailycombotime ||
      now - data.data.dailycombotime >= 24 * 60 * 60 * 1000
        ? "not_started"
        : "completed";

    // Create an object with only the task statuses
    const updatedTaskStatus: { [key: string]: "not_started" | "completed" } = {
      YouTube: data.data.youtube === "Done" ? "completed" : "not_started",
      X: data.data.X === "Done" ? "completed" : "not_started",
      Telegram: data.data.telegram === "Done" ? "completed" : "not_started",
      InviteFriends: data.data.inv5 === "Done" ? "completed" : "not_started",
      Invite10: data.data.inv10 === "Done" ? "completed" : "not_started",
      Invite20: data.data.inv20 === "Done" ? "completed" : "not_started",
      DailyReward: isDailyRewardAvailable,
      SendSoulWave: isSendSoulWaveAvailable,
      Transaction:
        data.data.Transaction === "Done" ? "completed" : "not_started",
      ConnectTonWallet:
        data.data.task2 === "Done" ? "completed" : "not_started",
    };

    setTaskStatus(updatedTaskStatus);
    setLastClaimedTime(data.data.dailyclaimedtime);

    if (
      data.data.claimedtotal !== undefined &&
      data.data.claimedtotal !== null
    ) {
      setTransactionCount(Number(data.data.claimedtotal));
    } else {
      setTransactionCount(0);
    }

    setRefertotal(Number(data.data.Refertotal) || 0);

    // Update localStorage with the latest task statuses
    localStorage.setItem(
      `taskStatus_${userID}`,
      JSON.stringify(updatedTaskStatus)
    );
  };

  // Telegram Initialization and User Management
  useEffect(() => {
    const initializeTelegram = async () => {
      if (typeof Telegram === "undefined" || !Telegram.WebApp) {
        console.error("Telegram WebApp is not available.");
        showAlert(
          "Telegram WebApp is not available. Please use Telegram to access this app."
        );
        setLoading(false);
        return;
      }

      try {
        Telegram.WebApp.ready();
        const initDataUnsafe = Telegram.WebApp.initDataUnsafe;

        if (!initDataUnsafe || !initDataUnsafe.user) {
          throw new Error("Incomplete Telegram initData.");
        }

        const user = {
          username: initDataUnsafe.user.username || "Default Username",
          userid: initDataUnsafe.user.id
            ? initDataUnsafe.user.id.toString()
            : "",
          startparam: initDataUnsafe.start_param || "",
        };

        if (!user.userid) {
          throw new Error("User ID is missing.");
        }

        setUserID(user.userid);
        await fetchOrAddUser(user.userid, user.startparam, user.username);
      } catch (error) {
        console.error("Initialization error:", error);
        showAlert("Failed to initialize user. Please refresh and try again.");
        setLoading(false);
      }
    };

    initializeTelegram();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Function to fetch or add user based on existence in the backend
  const fetchOrAddUser = async (
    userid: string,
    startparam: string,
    username: string
  ) => {
    try {
      const response = await fetch(
        `https://app.soulpartyin.com/api/get_user?UserId=${userid}`
      );

      if (response.ok) {
        console.log("User exists in the database.");
        const data = await response.json();
        await loadPoints(userid);
        loadTaskStatus(data);
        setShowOverlayPage(false);
        setOverlayShownOnce(false);
      } else if (response.status === 404) {
        await addUser(userid, startparam, username);
      } else {
        throw new Error(`Unexpected response status: ${response.status}`);
      }
    } catch (error) {
      console.error("fetchOrAddUser error:", error);
      showAlert(
        "An error occurred while fetching user data. Please try again."
      );
      setLoading(false);
    }
  };

  // Function to add a new user to the backend
  const addUser = async (
    userid: string,
    startparam: string,
    username: string
  ) => {
    const invitedBy = !startparam || userid === startparam ? null : startparam;

    try {
      await fetch("https://app.soulpartyin.com/api/add_user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          UserId: userid,
          invitedby: invitedBy || undefined,
          Username: username,
        }),
      });

      console.log("User added");

      // Only show the overlay page if it hasn't been shown yet
      if (!overlayShownOnce) {
        setShowOverlayPage(true);
        setOverlayShownOnce(true); // Set flag to true to prevent re-showing
      }

      // After adding the user, load points and task statuses
      await loadPoints(userid);
      await fetchTaskStatuses(userid);
    } catch (error) {
      console.error("Error adding user:", error);
      showAlert(
        "Failed to add user. Please check your connection and try again."
      );
      setLoading(false);
    }
  };

  // Function to fetch task statuses after adding user
  const fetchTaskStatuses = async (userid: string) => {
    try {
      const response = await fetch(
        `https://app.soulpartyin.com/api/get_user?UserId=${userid}`
      );
      const data = await response.json();
      if (data && data.data) {
        loadTaskStatus(data);
      } else {
        console.error("Task status data not found in the response.");
        showAlert("Failed to load task statuses.");
      }
    } catch (error) {
      console.error("Failed to load task statuses from database:", error);
      showAlert("Failed to load task statuses. Please check your connection.");
    }
  };

  // Function to extract chat_id from the Telegram link
  const extractChatId = (link: string): string => {
    const parts = link.split("/");
    const lastPart = parts[parts.length - 1];
    return "@" + lastPart;
  };

  // Function to handle Telegram-related tasks
  const handleTelegramTaskClick = async (taskKey: string, link: string) => {
    window.open(link, "_blank");

    // Extract chatId from the Telegram link
    const chatId = extractChatId(link);
    const userId = userID;

    // Set task status to 'loading' to show the loader
    setTaskStatus((prevState) => ({
      ...prevState,
      [taskKey]: "loading",
    }));

    // Wait for 6 seconds before checking the status
    setTimeout(async () => {
      try {
        // API call to check user's status in the Telegram chat
        const response = await fetch(
          `https://app.soulpartyin.com/api/check_telegram_status?user_id=${userId}&chat_id=${chatId}`
        );
        const data = await response.json();

        if (data.status === "1") {
          // User is a member, show claim button
          setTaskStatus((prevState) => ({
            ...prevState,
            [taskKey]: "claimable",
          }));
        } else {
          // User is not a member, reset status and show modal
          setTaskStatus((prevState) => ({
            ...prevState,
            [taskKey]: "not_started",
          }));
          showAlert("Not found, please try again.");
        }
      } catch (error) {
        console.error("Error checking Telegram status:", error);
        // Handle error, reset status and show modal
        setTaskStatus((prevState) => ({
          ...prevState,
          [taskKey]: "not_started",
        }));
        showAlert("An error occurred. Please try again.");
      }
    }, 6000);
  };

  const handleTaskClick = (taskKey: string, link: string) => {
    window.open(link, "_blank");

    // Set task status to 'loading'
    setTaskStatus((prevState) => ({
      ...prevState,
      [taskKey]: "loading",
    }));

    // After 5 seconds, set task status to 'claimable'
    setTimeout(() => {
      setTaskStatus((prevState) => ({
        ...prevState,
        [taskKey]: "claimable",
      }));
    }, 5000);
  };

  const handleTaskClaim = async (
    taskKey: string,
    column: string,
    reward: number
  ) => {
    // Ensure that the task is in 'claimable' status before claiming
    if (taskStatus[taskKey] === "claimable") {
      // Immediately set task status to 'loading' to prevent multiple clicks
      setTaskStatus((prevState) => ({
        ...prevState,
        [taskKey]: "loading",
      }));

      // Proceed to save task completion
      await saveTaskCompletion(taskKey, column, reward);
    }
  };

  // Handler for Invite Friends Tasks
  const handleInviteFriendsClick = async (
    taskKey: string,
    column: string,
    reward: number,
    threshold: number
  ) => {
    try {
      // Fetch Refertotal from backend
      const response = await fetch(
        `https://app.soulpartyin.com/api/get_user?UserId=${userID}`
      );
      const data = await response.json();
      const latestRefertotal = data.data.Refertotal || "NULL";

      if (latestRefertotal === "NULL") {
        showAlert("You have not invited any friends yet.");
        return;
      }

      const totalFriends = Number(latestRefertotal);
      if (totalFriends >= threshold && taskStatus[taskKey] !== "completed") {
        // Proceed to mark the task as done
        await saveTaskCompletion(taskKey, column, reward);
      } else if (taskStatus[taskKey] === "completed") {
        showAlert("You have already completed this task.");
      } else {
        showAlert(
          `You need to invite at least ${threshold} friends to complete this task.`
        );
      }
    } catch (error) {
      console.error("Failed to fetch Refertotal:", error);
      showAlert(
        "An error occurred while verifying your referrals. Please try again."
      );
    }
  };

  // Handler for Connect TON Wallet Task
  const handleConnectTonWalletClick = async () => {
    const taskKey = "ConnectTonWallet";
    const column = "task2"; // Update database column for the task
    const reward = 60;

    if (walletid) {
      // Wallet already connected
      if (taskStatus[taskKey] !== "completed") {
        await saveTaskCompletion(taskKey, column, reward);
      } else {
        showAlert("You have already completed this task.");
      }
      return;
    }

    // Set task status to 'loading'
    setTaskStatus((prevState) => ({
      ...prevState,
      [taskKey]: "loading",
    }));

    try {
      const wallet = await tonConnectUI.connectWallet();
      if (wallet) {
        // Assume that the wallet object contains the address
        const newAddress = address;
        if (newAddress) {
          // Save wallet address to database
          await fetch("https://app.soulpartyin.com/api/update_user", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ UserId: userID, walletid: newAddress }),
          });
          console.log("Wallet address saved:", newAddress);
          setWalletid(newAddress); // Update walletid in context
        } else {
          console.error("Wallet address not found.");
          showAlert("Failed to retrieve wallet address.");
          setTaskStatus((prevState) => ({
            ...prevState,
            [taskKey]: "not_started",
          }));
          return;
        }

        // Mark the task as completed and reward the user
        await saveTaskCompletion(taskKey, column, reward);
      } else {
        // Failed to connect
        showAlert("Unable to Connect");
        setTaskStatus((prevState) => ({
          ...prevState,
          [taskKey]: "not_started",
        }));
      }
    } catch (error) {
      console.error("Wallet connection error:", error);
      showAlert("Unable to Connect");
      setTaskStatus((prevState) => ({
        ...prevState,
        [taskKey]: "not_started",
      }));
    }
  };
  // === End of Connect TON Wallet Handler ===

  // === Handler for Send a Soul wave on TON Task ===
  const handleSendSoulWaveClick = async () => {
    const taskKey = "SendSoulWave";
    const column = "dailycombotime"; // Database column to track daily completion
    const reward = 600;

    // Set task status to 'loading'
    setTaskStatus((prevState) => ({
      ...prevState,
      [taskKey]: "loading",
    }));

    try {
      // Initiate the Soul wave transaction similar to handleTransactionClick
      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 360, // Transaction valid for 6 minutes
        messages: [
          {
            address: "UQCifMLtUNE6AiA0dIj3zzdmY4mytqjwNTdjcjgj9o1cadBI", // Receiver's wallet address
            amount: tonToNanoton("0.1"), // Amount in Ton converted to Nanoton
          },
        ],
      };
      const res = await tonConnectUI.sendTransaction(transaction);
      if (res) {
        // After successful transaction, update the task
        await saveTaskCompletion(taskKey, column, reward);
        console.log("Soul wave transaction was successful");
      } else {
        // Transaction failed or was rejected
        setTaskStatus((prevState) => ({
          ...prevState,
          [taskKey]: "not_started",
        }));
        showAlert("Transaction was not completed.");
      }
    } catch (error) {
      console.log("Soul wave transaction failed", error);
      setTaskStatus((prevState) => ({
        ...prevState,
        [taskKey]: "not_started",
      }));
      showAlert("Wallet not connected or Transaction failed.");
    }
  };
  // === End of Send a Soul wave on TON Handler ===

  const handleDailyRewardClick = async () => {
    const now = Date.now();
    if (lastClaimedTime && now - lastClaimedTime < 24 * 60 * 60 * 1000) {
      showAlert(
        "You have already claimed your daily reward. Please come back later."
      );
      return;
    }

    try {
      await fetch("https://app.soulpartyin.com/api/update_user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ UserId: userID, dailyclaimedtime: now }),
      });

      setLastClaimedTime(now);
      setTaskStatus((prevState) => ({
        ...prevState,
        DailyReward: "completed",
      }));

      setPoints((prevPoints) => prevPoints + 30); // Updated reward
      showAlert(
        "Congratulations! You have claimed your daily reward of 30 SOUL."
      );
    } catch (error) {
      console.error("Failed to claim daily reward:", error);
      showAlert(
        "An error occurred while claiming your daily reward. Please try again later."
      );
    }
  };

  // AdsGram integration
  const onReward = useCallback(() => {
    alert("User rewarded!");
  }, []);

  const onError = useCallback((result: ShowPromiseResult) => {
    alert(`Ad error: ${JSON.stringify(result, null, 4)}`);
  }, []);

  const showAd = useAdsgram({
    blockId: "5131", // Replace with your actual block ID
    onReward,
    onError,
  });

  // === Compute "Tasks & Rewards" ===
  const completedRewards = Math.max(0, points - refertotal * perReferReward);

  // Function to render tasks based on current sections
  const renderTasks = () => (
    <>
      {/* Daily Section */}
      <div className="mt-6">
        {/* Top Section */}
        <div className="flex justify-around items-center gap-2 bg-[#222222] text-white p-2 sm:p-4 rounded-xl">
          {/* Rank Section */}
          <div className="flex justify-between">
            <div className="text-center">
              <p className="text-[#D7D7D6] -mt-2 text-[12px]">#Rank</p>
              <p className="text-[15px] text-bold">
                {userRank !== null ? `${userRank}` : "Loading..."}
              </p>
            </div>
          </div>
          <div className="w-[2px] h-11 bg-[#545454]"></div>
          {/* Tasks & Rewards Section */}
          <div className="flex items-center">
            <div className="text-center">
              <p className="text-[#D7D7D6] text-[12px]">Tasks & Rewards</p>
              <p className="flex items-center justify-center text-[15px] text-bold">
                <span>{completedRewards.toLocaleString()}</span>
                <img src={ghostIcon1} alt="" className="w-7 -ml-1" />
              </p>
            </div>
          </div>
          <div className="w-[2px] h-11 bg-[#545454]"></div>
          {/* Invites Section */}
          <div className="flex items-center">
            <div className="text-start">
              <p className="text-[#D7D7D6] text-[12px]">Invites</p>
              <p className="flex items-center justify-center text-[15px] text-bold">
                <span>{(refertotal * perReferReward).toLocaleString()}</span>
                <img src={ghostIcon1} alt="" className="w-7 -ml-1" />
              </p>
            </div>
          </div>
        </div>

        {/* Daily Header */}
        <div className="flex justify-start mt-3 mb-3 px-2">
          <h1 className="text-[1.5rem] text-bold text-[#fff]">Daily</h1>
        </div>

        {/* Engage with SOUL Task */}
        <div
          onClick={
            taskStatus["DailyReward"] === "not_started"
              ? () => {
                  // Open the link synchronously
                  window.open("https://t.me/SoulPartyIn", "_blank");
                  // Then handle the reward asynchronously
                  handleDailyRewardClick();
                }
              : undefined
          }
          className={`flex items-center justify-between bg-[#222222]/70 rounded-xl pt-[.4rem] pb-3 px-4 sm:px-8 mb-6 border border-[#3b3a3b] ${
            taskStatus["DailyReward"] === "not_started"
              ? "hover:bg-[#242424] cursor-pointer"
              : ""
          } ${
            taskStatus["DailyReward"] === "completed"
              ? "opacity-50 cursor-not-allowed"
              : ""
          }`}
        >
          <div className="flex items-center">
            {/* Removed Icon Rendering to maintain original layout */}
            <div className="text-white">
              {/* Title */}
              <div className=" text-[.9rem] text-bold leading-relaxed mb-1">
                Engage with SOUL
              </div>
              {/* Reward and Check-in */}
              <div className="text-sm sm:text-base flex items-center leading-relaxed">
                <p>+30 SOUL</p>
                <div className="w-[2px] mx-4 h-6 bg-[#545454]"></div>
                <button className="text-white px-4 rounded-full -ml-5">
                  Check in
                </button>
              </div>
            </div>
          </div>
          <div className="text-gray-400">
            {taskStatus["DailyReward"] === "completed" && (
              <img src={doneIcon} alt="Done" className="w-6 h-6" />
            )}
            {taskStatus["DailyReward"] === "not_started" && (
              <button className="flex items-center justify-center bg-[#EF5353] w-[40px] sm:w-[50px] text-[#ffffff] sm:px-4 py-1 rounded-full">
                <IoLinkOutline className="w-7 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Blink bonus */}
        <div
          onClick={
            taskStatus["DailyReward"] === "not_started"
              ? () => {
                  // Open the link synchronously
                  window.open("https://t.me/SoulPartyIn", "_blank");
                  // Then handle the reward asynchronously
                  handleDailyRewardClick();
                  showAd;
                }
              : undefined
          }
          className={`flex items-center justify-between bg-[#222222]/70 rounded-xl pt-[.4rem] pb-3 px-4 sm:px-8 mb-6 border border-[#3b3a3b] 
              hover:bg-[#242424] cursor-pointer
           `}
        >
          <div className="flex items-center">
            <div className="text-white">
              {/* Title */}
              <div className="text-[.9rem] font-bold leading-relaxed mb-1">
                Blink Bonus
              </div>
              {/* Reward and Action */}
              <div className="text-sm sm:text-base flex items-center leading-relaxed">
                <p>+90 SOUL</p>
                <div className="w-[2px] mx-4 h-6 bg-[#545454]"></div>
                <p>Watch Ad</p>
              </div>
            </div>
          </div>
          <div className="text-gray-400">
            <button
              className="flex items-center justify-center bg-[#4CAF50] w-[40px] sm:w-[50px] text-[#ffffff] sm:px-4 py-1 rounded-full"
              onClick={showAd}
            >
              <MdOutlineVideoLibrary className="w-7 h-4" />
            </button>
          </div>
        </div>

        {/* Send a Soul wave on TON Task */}
        <div
          onClick={
            taskStatus["SendSoulWave"] === "not_started"
              ? handleSendSoulWaveClick
              : undefined
          }
          className={`flex items-center justify-between bg-[#222222]/70 rounded-xl pt-[.4rem] pb-3 px-4 sm:px-8 mb-6 border border-[#3b3a3b] ${
            taskStatus["SendSoulWave"] === "not_started"
              ? "hover:bg-[#242424] cursor-pointer"
              : ""
          } ${
            taskStatus["SendSoulWave"] === "completed"
              ? "opacity-50 cursor-not-allowed"
              : ""
          }`}
        >
          <div className="flex items-center">
            {/* Removed Icon Rendering to maintain original layout */}
            <div className="text-white">
              {/* Title */}
              <div className=" text-[.9rem] text-bold leading-relaxed mb-1">
                Send a Soul wave on TON
              </div>
              {/* Reward and Action */}
              <div className="text-sm sm:text-base flex items-center leading-relaxed">
                <p>+600 SOUL</p>
              </div>
            </div>
          </div>
          <div className="text-gray-400">
            {taskStatus["SendSoulWave"] === "completed" && (
              <img src={doneIcon} alt="Done" className="w-6 h-6" />
            )}
            {taskStatus["SendSoulWave"] === "not_started" && (
              <button className="flex items-center justify-center bg-[#EF5353] w-[40px] sm:w-[50px] text-[#ffffff] sm:px-4 py-1 rounded-full">
                <BsLightningChargeFill className="w-7 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
      {/* End Daily Section */}

      {/* Tasks Section */}
      <div className="mt-2">
        <div className="flex justify-start mt-4 mb-2 px-2">
          <h1 className="text-[1.5rem] text-bold text-[#fff]">Tasks</h1>
        </div>
        {/* Telegram Tasks */}
        <TaskItem
          title="Join SOUL Community"
          reward={60}
          status={taskStatus["Telegram"] || "not_started"}
          onClick={() =>
            handleTelegramTaskClick("Telegram", "https://t.me/SoulPartyIn")
          }
          onClaim={() => handleTaskClaim("Telegram", "telegram", 60)}
        />

        <TaskItem
          title="Follow SOUL on X"
          reward={60}
          status={taskStatus["X"] || "not_started"}
          onClick={() => handleTaskClick("X", "https://x.com/soulpartyin")}
          onClaim={() => handleTaskClaim("X", "X", 60)}
        />

        <TaskItem
          title="Subscribe SOUL on YouTube"
          reward={90}
          status={taskStatus["YouTube"] || "not_started"}
          onClick={() =>
            handleTaskClick("YouTube", "https://www.youtube.com/@Soulpartyin")
          }
          onClaim={() => handleTaskClaim("YouTube", "youtube", 90)}
        />

        {/* Connect TON Wallet Task */}
        <TaskItem
          title="Connect TON Wallet"
          reward={60}
          status={taskStatus["ConnectTonWallet"] || "not_started"}
          onClick={handleConnectTonWalletClick}
        />

        {/* Invite Friends Tasks */}
        <TaskItem
          title="Invite 5 Soul"
          reward={90}
          status={taskStatus["InviteFriends"] || "not_started"}
          onClick={() =>
            handleInviteFriendsClick("InviteFriends", "inv5", 90, 5)
          }
        />

        <TaskItem
          title="Invite 10 Soul"
          reward={180}
          status={taskStatus["Invite10"] || "not_started"}
          onClick={() => handleInviteFriendsClick("Invite10", "inv10", 180, 10)}
        />

        <TaskItem
          title="Invite 20 Soul"
          reward={270}
          status={taskStatus["Invite20"] || "not_started"}
          onClick={() => handleInviteFriendsClick("Invite20", "inv20", 270, 20)}
        />
      </div>
    </>
  );

  useEffect(() => {
    const preloadPages = async () => {
      if (userID) {
        await loadPoints(userID); // Always load real points from DB

        // Fetch task statuses from the backend
        try {
          const response = await fetch(
            `https://app.soulpartyin.com/api/get_user?UserId=${userID}`
          );
          const data = await response.json();
          if (data && data.data) {
            loadTaskStatus(data);
          } else {
            console.error("Task status data not found in the response.");
            showAlert("Failed to load task statuses.");
          }
        } catch (error) {
          console.error("Failed to load task statuses from database:", error);
          showAlert(
            "Failed to load task statuses. Please check your connection."
          );
        }

        // Fetch User Rank
        try {
          const response = await fetch(
            `https://app.soulpartyin.com/api/get_user_ranking?UserId=${userID}`
          );
          const data = await response.json();
          if (
            data.requested_user &&
            typeof data.requested_user.position === "number"
          ) {
            setUserRank(data.requested_user.position);
          } else {
            console.error("User rank data not found in the response.");
            showAlert("Failed to load user rank.");
          }
        } catch (error) {
          console.error("Failed to load user rank:", error);
          showAlert("Failed to load user rank. Please check your connection.");
        }
      }

      // Add a 2.5-second delay after fetching data
      setTimeout(() => {
        setLoading(false);
      }, 2500); // 2500 milliseconds = 2.5 seconds
    };

    preloadPages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userID]);

  // Update walletid when address changes
  useEffect(() => {
    if (address) {
      setWalletid(address);
    }
  }, [address, setWalletid]);

  return (
    <div className="relative pt-1 flex justify-center">
      {loading ? (
        <LoadingScreen />
      ) : (
        <>
          <div className="absolute inset-0 bg-black"></div>
          <div className="relative pt-2 md:pt-14 w-full text-white h-screen text-bold flex flex-col max-w-xl">
            {activePage === "home" && (
              <>
                <div className="px-4 z-10">
                  <div
                    className="relative bg-opacity-50 rounded-xl pt-8 flex flex-col items-center"
                    style={{
                      animation: "gradientBackground 8s ease infinite",
                    }}
                  >
                    {/* Ghost Icons */}
                    <div className="absolute -left-4 bottom-14 sm:left-6 animate-pulse">
                      <img
                        src={ghostIcon4}
                        alt="Ghost"
                        className="w-28 md:w-32 h-28 md:h-32 -rotate-12 opacity-100"
                      />
                    </div>
                    <div className="absolute right-0 sm:right-6 -top-5 animate-pulse">
                      <img
                        src={ghostIcon4}
                        alt="Ghost"
                        className="w-28 md:w-32 h-28 md:h-32 -rotate-12 opacity-100"
                      />
                    </div>
                    <div className="absolute -right-6 sm:right-3 md:right-6 bottom-1 animate-pulse">
                      <img
                        src={ghostIcon4}
                        alt="Ghost"
                        className="w-28 md:w-32 h-28 md:h-32 -rotate-12 opacity-100"
                      />
                    </div>
                    <div className="absolute right-0 sm:right-10 bottom-28 animate-pulse">
                      <img
                        src={ghostIcon4}
                        alt="Ghost"
                        className="w-16 md:w-20 h-16 md:h-20 opacity-100"
                      />
                    </div>

                    {/* Token Logo */}
                    <img
                      src={ghostIcon2}
                      alt="Token Logo"
                      className="w-24 h-[6.5rem] sm:w-28 sm:h-28"
                    />

                    {/* TON Connect Button */}
                    <div className="mt-4">
                      <TonConnectButton />
                    </div>

                    {/* Points Display */}
                    <p className="text-3xl sm:text-4xl mt-4">
                      {points.toLocaleString()} SOUL
                    </p>
                  </div>

                  {/* Render Tasks */}
                  {renderTasks()}

                  <div className="h-24"></div>
                </div>
              </>
            )}

            {activePage === "friends" && <FriendsPage />}
            {activePage === "leaderboard" && <Leaderboard />}
          </div>

          {/* Navigation Bar */}
          <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full md:max-w-xl bg-[#191918] flex justify-around items-center z-50 text-xs">
            <div
              className={`nav-item text-center ${
                activePage === "home" ? "text-[#007BFE]" : "text-[#c0c0c0]"
              } w-1/5 m-1 rounded-2xl`}
              onClick={() => setActivePage("home")}
            >
              <MdHome className="w-7 h-7 mx-auto" />
              <p className="text-[0.6rem]">Home</p>
            </div>

            <div
              className={`nav-item text-center ${
                activePage === "leaderboard"
                  ? "text-[#007BFE]"
                  : "text-[#c0c0c0]"
              } m-1 rounded-2xl`}
              onClick={() => setActivePage("leaderboard")}
            >
              {activePage === "leaderboard" ? (
                <img
                  src={activeLeaderboardIcon}
                  alt="Ranking"
                  className="h-[2.1rem] mx-auto"
                />
              ) : (
                <img
                  src={leaderboardIcon}
                  alt="Ranking"
                  className="w-11 h-11 -mb-[5.5px] mx-auto"
                />
              )}
              <p className="text-[0.6rem]">Leaderboard</p>
            </div>

            <div
              className={`nav-item text-center ${
                activePage === "friends" ? "text-[#007BFE]" : "text-[#c0c0c0]"
              } w-1/5 m-1 p-2 rounded-2xl`}
              onClick={() => setActivePage("friends")}
            >
              {activePage === "friends" ? (
                <img
                  src={activeNavGhostIcon}
                  alt="Ranking"
                  className="h-8 w-10 -mb-1 mx-auto"
                />
              ) : (
                <img
                  src={navGhostIcon}
                  alt="Ranking"
                  className="w-9 h-9 -mb-[5.5px] mx-auto"
                />
              )}
              <p className="mt-1 text-[0.6rem]">Souls</p>
            </div>
          </div>

          {/* Modal for Alerts */}
          {modalMessage && (
            <Modal message={modalMessage} onClose={closeModal} />
          )}
          <Toaster />

          {/* Overlay Page */}
          {showOverlayPage && (
            <OverlayPage
              closeOverlay={closeOverlay}
              setUpdatingFromOverlay={setUpdatingFromOverlay}
            />
          )}
        </>
      )}
    </div>
  );
};

export default App;
