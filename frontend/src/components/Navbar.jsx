// components/Navbar.jsx
import { Link } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { useNotificationStore } from "../store/useNotificationStore";
import { LogOut, Settings, User, Bell } from "lucide-react";
import { useState } from "react";

const Navbar = () => {
  const { logout, authUser } = useAuthStore();
  const {
    notifications,
    markAsRead,
    clearNotifications,
  } = useNotificationStore();
  const [showNotifications, setShowNotifications] = useState(false);

  const unreadNotifications = notifications.filter((n) => !n.read);
  const unreadCount = unreadNotifications.length;

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    setShowNotifications(false);
  };

  return (
    <header className="bg-base-100 border-b border-base-300 fixed w-full top-0 z-40 backdrop-blur-lg bg-base-100/80">
      <div className="container mx-auto px-4 h-16">
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center gap-8">
            <Link
              to="/"
              className="flex items-center gap-2.5 hover:opacity-80 transition-all"
            >
              <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="size-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 0 1-.923 1.785A5.969 5.969 0 0 0 6 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337Z"
                  />
                </svg>
              </div>
              <h1 className="text-lg font-bold">HoneyChat</h1>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            {/* Settings - Always visible */}
            <Link
              to="/settings"
              className="btn btn-sm gap-2 transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
            </Link>

            {/* Auth-only features */}
            {authUser && (
              <>
                {/* Notifications */}
                <div className="relative">
                  <button
                    className="flex gap-2 items-center relative"
                    onClick={() => setShowNotifications(!showNotifications)}
                  >
                    <Bell className="size-4" />
                    <span className="hidden sm:inline">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1.3 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 bg-base-100 rounded-lg shadow-lg border border-base-300 z-50 max-h-96 overflow-y-auto">
                      <div className="p-2 border-b border-base-300 flex justify-between items-start">
                        <h3 className="font-bold">Notifications</h3>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={clearNotifications}
                            className="text-xs hover:text-primary"
                          >
                            Clear All
                          </button>
                          <button
                            onClick={() => setShowNotifications(false)}
                            className="text-xs text-white-500 hover:text-red-700 font-bold ml-2"
                            title="Close"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                      
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-sm text-base-content/70">
                          No notifications
                        </div>
                      ) : (
                        <ul>
                          {notifications.map((notification) => (
                            <li
                              key={notification.id}
                              className={`p-3 border-b border-base-300 hover:bg-base-200 cursor-pointer ${
                                !notification.read ? "bg-primary/10" : ""
                              }`}
                              onClick={() => handleNotificationClick(notification)}
                            >
                              <div className="flex items-start gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">
                                    {notification.type === "group-message"
                                      ? `${notification.senderName} in ${notification.groupName}`
                                      : notification.senderName}
                                  </p>
                                  <p className="text-sm truncate">
                                    {notification.message ||
                                      (notification.image
                                        ? "Sent an image"
                                        : notification.file
                                        ? `Sent a file: ${notification.file.originalName}`
                                        : "New message")}
                                  </p>
                                  <p className="text-xs text-base-content/50 mt-1">
                                    {new Date(notification.timestamp).toLocaleString()}
                                  </p>
                                </div>
                                {!notification.read && (
                                  <span className="h-2 w-2 rounded-full bg-primary"></span>
                                )}
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>

                {/* Profile and Logout */}
                <Link to="/profile" className="btn btn-sm gap-2">
                  <User className="size-5" />
                  <span className="hidden sm:inline">Profile</span>
                </Link>

                <button
                  className="flex gap-2 items-center"
                  onClick={logout}
                >
                  <LogOut className="size-5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;