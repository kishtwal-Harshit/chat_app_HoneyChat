import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef } from "react";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";


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
  const messageEndRef = useRef(null);

  useEffect(() => {
    getMessages(selectedUser._id);
    subscribeToMessages();

    return () => unsubscribeFromMessages();
  }, [selectedUser._id, getMessages, subscribeToMessages, unsubscribeFromMessages]);

  useEffect(() => {
    if (messageEndRef.current && messages) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    switch(extension) {
      case 'pdf':
        return '📕';
      case 'ppt':
      case 'pptx':
        return '📊';
      case 'doc':
      case 'docx':
        return '📄';
      case 'xls':
      case 'xlsx':
        return '📈';
      default:
        return '📎';
    }
  };

  const handleFileClick = (file) => {
    if (file.isDocument) {
      // For documents, trigger download
      const link = document.createElement('a');
      link.href = file.url;
      link.setAttribute('download', file.originalName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // For non-documents, open in new tab
      window.open(file.url, '_blank');
    }
  };

  if (isMessagesLoading) {
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
      <ChatHeader />

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
            
            <div  className={`chat-bubble flex flex-col space-y-2 ${
                 message.senderId === authUser._id
                  ? "bg-primary text-primary-content"
                : "bg-base-200 text-base-content"
                }`}
                >
              {/* Render image if available */}
              {message.image && (
                <img
                  src={message.image}
                  alt="Attachment"
                  className="rounded-md max-h-60 object-cover"
                />
              )}

              {/* Render file link if available */}
              {message.file && message.file.url && (
                <div 
                  className="flex items-center gap-2 p-2 bg-base-200 rounded-lg cursor-pointer hover:bg-base-300"
                  onClick={() => handleFileClick(message.file)}
                >
                  <span className="text-lg">{getFileIcon(message.file.originalName)}</span>
                  <div className="flex-1 min-w-0">
                    <p 
                 className={"text-base-content"}>
                      {message.file.originalName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {Math.round(message.file.size / 1024)} KB
                    </p>
                  </div>
                </div>
              )}

              {/* Render text message */}
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

      <MessageInput />
    </div>
  );
};

export default ChatContainer;