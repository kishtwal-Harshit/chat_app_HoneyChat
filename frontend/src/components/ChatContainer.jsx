// components/ChatContainer.jsx
import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef } from "react";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";
import { useNotificationStore } from "../store/useNotificationStore";

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
  } = useChatStore();
  const { authUser } = useAuthStore();
  const { markNotificationsAsRead } = useNotificationStore();
  const messageEndRef = useRef(null);

  useEffect(() => {
    subscribeToMessages();
    
    if (selectedUser?._id) {
      getMessages(selectedUser._id);
      markNotificationsAsRead(selectedUser._id, "user");
    }

    return () => unsubscribeFromMessages();
  }, [selectedUser?._id, getMessages, subscribeToMessages, unsubscribeFromMessages, markNotificationsAsRead]);

  useEffect(() => {
    if (messageEndRef.current && messages) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    switch(extension) {
      case 'pdf': return '📕';
      case 'ppt': case 'pptx': return '📊';
      case 'doc': case 'docx': return '📄';
      case 'xls': case 'xlsx': return '📈';
      default: return '📎';
    }
  };

  const handleFileClick = (file) => {
    if (file.isDocument) {
      const link = document.createElement('a');
      link.href = file.url;
      link.setAttribute('download', file.originalName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      window.open(file.url, '_blank');
    }
  };

  if (isMessagesLoading && selectedUser) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      {selectedUser && <ChatHeader />}

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message._id}
            className={`chat ${message.senderId === authUser._id ? "chat-end" : "chat-start"}`}
            ref={messageEndRef}
          >
            <div className="chat-image avatar">
              <div className="size-10 rounded-full border">
                <img
                  src={
                    message.senderId === authUser._id
                      ? authUser.profilePic || "/avatar.png"
                      : selectedUser.profilePic || "/avatar.png"
                  }
                  alt="profile pic"
                />
              </div>
            </div>
            
            <div className={`chat-bubble flex flex-col space-y-2 ${
              message.senderId === authUser._id
                ? "bg-primary text-primary-content"
                : "bg-base-200 text-base-content"
            }`}>
              {message.image && (
                <img
                  src={message.image}
                  alt="Attachment"
                  className="rounded-md max-h-60 object-cover"
                />
              )}

              {message.file && message.file.url && (
                <div 
                  className="flex items-center gap-2 p-2 bg-base-200 rounded-lg cursor-pointer hover:bg-base-300"
                  onClick={() => handleFileClick(message.file)}
                >
                  <span className="text-lg">{getFileIcon(message.file.originalName)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-base-content">
                      {message.file.originalName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {Math.round(message.file.size / 1024)} KB
                    </p>
                  </div>
                </div>
              )}

              {message.text && <p>{message.text}</p>}
              <div className="chat-header mb-1">
                <div className="flex justify-end">
                  <time className="text-xs opacity-50">
                    {formatMessageTime(message.createdAt)}
                  </time>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedUser && <MessageInput />}
    </div>
  );
};

export default ChatContainer;