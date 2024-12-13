This project is a Telegram MiniApp designed to provide users with various interactive features, including earning rewards, managing friends, and participating in airdrops. The app is built using React (TypeScript) for the frontend, and the CSS is tailored to provide a seamless experience across different devices, especially within Telegram's web environment.

The current implementation includes the following core components:

App.tsx: The main entry point of the application, setting up routes and the overall structure.
Airdrop.tsx: Handles the airdrop section where users can claim rewards.
Earn.tsx: Manages the earning section where users can accumulate points or tokens.
Friends.tsx: Manages the friends list and invitation process.
Modal.tsx: A reusable modal component used throughout the application.
UserContext.tsx: Provides context for managing user-related state across the application.
The provided CSS files (App.css and index.css) manage the styling of the application, ensuring a responsive and user-friendly interface.

Project Structure
App.tsx: Contains the main structure of the application, routing logic, and high-level state management. It serves as the central hub from which all other components are rendered.

Airdrop.tsx: A component dedicated to handling airdrop-related functionalities. Users can interact with this component to claim rewards, and it will display information relevant to the current airdrop campaigns.

Earn.tsx: This component is responsible for managing the earning process within the app. It includes mechanisms for users to earn tokens or points through various activities.

Friends.tsx: This component manages the user's friends list, including functionalities for inviting new friends and viewing existing ones. It also generates invitation links and integrates with Telegram's sharing functionalities.

Modal.tsx: A generic modal component used across the application for various purposes, such as showing information, confirming actions, or displaying alerts.

UserContext.tsx: This file provides a React context for managing user-specific data throughout the application. It ensures that user data is accessible and up-to-date in all parts of the app.

App.css: Contains specific styling rules for the app, including animations, responsive layouts, and visual effects. It is heavily customized to fit the app's needs within the Telegram environment.

index.css: This file includes base styles and utility classes imported from Tailwind CSS. It also includes global styles such as font settings and background color.

main.tsx: The entry point for the React application, responsible for rendering the main App component.

Developer Instructions
Wallet Integration
The wallet integration should primarily focus on the following:

User Authentication: Ensure that users are authenticated through their wallet, possibly using a Web3 provider like MetaMask. The UserContext.tsx file should be extended to store wallet-related information.

Transaction Handling: Implement functionality for users to send and receive tokens through the app. The Airdrop.tsx and Earn.tsx components will likely need modification to handle transactions.

State Management: Ensure that the user's wallet state is managed correctly throughout the app, particularly in the UserContext.tsx.

UI Updates: Modify the relevant components to reflect the wallet's state, such as showing the connected wallet address, balance, and any transaction histories.

Code Conventions
TypeScript: Follow TypeScript best practices. Ensure that all new code is strongly typed.
React Hooks: Utilize React hooks for state management and side effects. Avoid using class components.
CSS: Follow the existing CSS conventions. Ensure that new styles are mobile-friendly and integrate well with Telegram's web app environment.
Testing
Before finalizing the wallet integration, thoroughly test the app within the Telegram web environment. Ensure that all functionalities, especially related to wallet interactions, work seamlessly on both desktop and mobile devices.

Final Notes
This project is designed to be easily extendable. If you encounter any issues or have suggestions for improvements, please document them and consider creating a pull request if time permits. For any kind of help contact @Ahnafsadi (Telegram), sadi_ahnaf(fiver)

Will be addded
  <TaskItem
          icon={tonIcon}
          title="Make a Ton transaction"
          reward={20000}
          completed={!!taskComplete['Transaction']}
          onClick={() => handleTransactionClick(20000)}
        />

          const handleTransactionClick = async (reward: number) => {
    if (!walletid) {
      showModal('Connect wallet first');
      return;
    }
    try {
      const res = await tonConnectUI.sendTransaction(transaction);
      if (res) {
        setTaskComplete((prevState) => ({
          ...prevState,
          Transaction: true,
        }));

        localStorage.setItem(
          `taskStatus_${userID}`,
          JSON.stringify({
            ...taskComplete,
            Transaction: true,
          })
        );
        setPoints((prevPoints) => prevPoints + reward); // Reward points for task completion
        console.log('Transaction was successful');
      }
    } catch (error) {
      console.log('Transaction failed');
    }
  };
  const { setPoints, userID, walletid } = useUser();  // Use global points, userID, and walletAddress

  const transaction = {
    validUntil: Math.floor(Date.now() / 1000) + 360,
    messages: [
      {
        address: 'UQCFCaZ4rtUFsp7TbdodgvnjxgrvS7StGGhqDPwJmKWf8NgV', // Receiver's wallet address
        amount: tonToNanoton('0.6'), // Amount in Ton
      },
    ],
  };
  // Send transaction handling
  const tonToNanoton = (value: string): string => {
    if (value !== '') {
      return (parseFloat(value) * 1e9).toString();
    } else return '';
  };