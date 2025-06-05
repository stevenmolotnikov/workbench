import React, { useState, useEffect } from "react";

export const TerminalStatusLine = ({
    message = "container loading",
    showCursor = true,
    typewriter = false,
    prefix = "$",
    status = "loading", // "loading", "success", "error", "info"
}) => {
    const [displayedMessage, setDisplayedMessage] = useState("");
    const [currentIndex, setCurrentIndex] = useState(0);

    // Typewriter effect
    useEffect(() => {
        if (typewriter) {
            if (currentIndex < message.length) {
                const timer = setTimeout(() => {
                    setDisplayedMessage(message.slice(0, currentIndex + 1));
                    setCurrentIndex(currentIndex + 1);
                }, 50 + Math.random() * 50); // Variable typing speed for realism
                return () => clearTimeout(timer);
            }
        } else {
            setDisplayedMessage(message);
        }
    }, [message, currentIndex, typewriter]);

    // Reset typewriter when message changes
    useEffect(() => {
        if (typewriter) {
            setCurrentIndex(0);
            setDisplayedMessage("");
        }
    }, [message, typewriter]);

    const getStatusColor = () => {
        switch (status) {
            case "success":
                return "text-green-400";
            case "error":
                return "text-red-400";
            case "loading":
                return "text-yellow-400";
            default:
                return "text-blue-400";
        }
    };

    const getStatusIcon = () => {
        switch (status) {
            case "success":
                return "✓";
            case "error":
                return "✗";
            case "loading":
                return "⋯";
            default:
                return "•";
        }
    };

    return (
        <div className="text-green-400 flex items-center px-2 h-8 w-64 font-mono text-sm border rounded">
            <div className="flex items-center space-x-2">
                <span className="text-gray-500">{prefix}</span>
                <span className={`${getStatusColor()} animate-pulse`}>{getStatusIcon()}</span>
                <span className="text-white text-xs">
                    {displayedMessage}
                    {/* {showCursor && (
                        <span className="animate-pulse ml-1 text-green-400 font-bold">█</span>
                    )} */}
                </span>
            </div>
        </div>
    );
};
