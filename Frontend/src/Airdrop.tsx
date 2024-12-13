import React, { useState, useEffect, CSSProperties } from "react";
import "./App.css";
//import { BrowserProvider, Contract, parseUnits } from "ethers";
import { useWeb3ModalProvider, useWeb3ModalAccount, useWeb3Modal } from "@web3modal/ethers/react";
import toast from "react-hot-toast";
import { useUser } from "./UserContext";
import ClipLoader from "react-spinners/ClipLoader";
import { main } from "./images";

const override: CSSProperties = {
  display: "block",
  margin: "0 auto",
  borderColor: "#ffffff",
};

//const contract = "0x632A81BA3b1C507116FC13B425B9866b429D313A";
//const abi = [
  // ABI details here...
//];

const Airdrop: React.FC = () => {
  const [username, setUsername] = useState<string>("");
  const [loading] = useState(false);

  const { points } = useUser();
  const { address, isConnected } = useWeb3ModalAccount();
  const {} = useWeb3ModalProvider();
  const {} = useWeb3Modal();

  useEffect(() => {
    if (window.Telegram?.WebApp?.initDataUnsafe?.user) {
      const userUsername = window.Telegram.WebApp.initDataUnsafe.user.username || "Unknown User";
      setUsername(userUsername);
      localStorage.setItem("telegramUsername", userUsername); // Save to localStorage
    }
  }, []);

  // Disable the Claim functionality for now
  const handleCLaim = async () => {
    toast.error("Claim functionality is currently disabled.");
  };

  return (
    <div className="bg-black flex justify-center h-screen">
      <div className="w-full bg-gradient-to-b from-black to-[#1c1c1c] text-white h-screen font-bold flex flex-col max-w-xl shadow-lg shadow-[#3BAA34]/50">
        
        {/* Coin Image */}
        <div className="flex justify-center items-center mt-8">
          <img src={main} alt="Dollar Coin" className="w-32 h-32" />
        </div>

        {/* Header */}
        <div className="text-center mt-4">
          <h1 className="text-4xl" style={{ textShadow: "1px 1px 2px #3BAA34" }}>
            AirDrop
          </h1>
        </div>

        {/* Wallet Button (Disabled) */}
        <div className="flex justify-center items-center pt-4">
          <button
            style={{
              padding: "20px 50px",
              backgroundColor: "#3BAA34",
              color: "white",
              borderRadius: "14px",
              cursor: "not-allowed", // Change the cursor to show it's disabled
            }}
            onClick={() => toast.error("Connect Wallet is disabled.")} // Disabled functionality
          >
            {isConnected
              ? address?.substring(0, 4) + "***" + address?.substring(address.length - 4, address.length)
              : "Connect Wallet"}
          </button>
        </div>

        {/* Claim Your Coins */}
        <div className="flex justify-center items-center mt-6 flex-col">
          <p style={{ fontSize: "22px", marginBottom: "10px", marginTop: "40px" }}>
            Claim Your Coins
          </p>
          <p>{points}</p>
        </div>

        {/* Username */}
        <div className="flex justify-center items-center mt-2">
          <p style={{ fontSize: "20px" }}>Username: {username}</p>
        </div>

        {/* Claim Button (Disabled) */}
        <div className="flex justify-center items-center mt-6">
          <button
            style={{
              padding: "20px 50px",
              backgroundColor: "#3BAA34",
              color: "white",
              borderRadius: "14px",
              cursor: "not-allowed", // Change the cursor to show it's disabled
            }}
            onClick={handleCLaim} // Call disabled handleClaim function
          >
            {loading ? (
              <ClipLoader loading={loading} cssOverride={override} size={25} aria-label="Loading Spinner" data-testid="loader" />
            ) : (
              "Claim"
            )}
          </button>
        </div>

        {/* Footer */}
        <div className="flex justify-center items-center mt-auto mb-6">
          <p className="text-center">More opportunities will be available soon</p>
        </div>
      </div>
    </div>
  );
};

export default Airdrop;
