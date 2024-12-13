import React, { useEffect } from 'react';

interface ModalProps {
  message: string;
  onClose: () => void;
}

const Modal: React.FC<ModalProps> = ({ message, onClose }) => {
  useEffect(() => {
    // Automatically close the modal after 2 seconds
    const timer = setTimeout(() => {
      onClose();
    }, 2000);

    // Clear the timer if the component unmounts before 2 seconds
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-lg p-4">
      <div className="bg-black bg-opacity-90 text-white p-4 rounded-lg shadow-lg text-center mx-2">
        <p>{message}</p>
      </div>
    </div>
  );
};

export default Modal;
