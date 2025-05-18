import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef, useState } from "react";
import GroupChatHeader from "./GroupChatHeader";
import GroupMessageInput from "./GroupMessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";
import { axiosInstance } from "../lib/axios";

const GroupChatContainer = () => {
  const {
    senderName,
    setSenderName,
    groupMessages,
    setGroupMessages,
    getGroupMessages,
    isGroupMessagesLoading,
    selectedGroup,
    selectedGroupId,
    subscribeToGroupMessages,
    unsubscribeFromGroupMessages
  } = useChatStore();

  const { authUser } = useAuthStore();
  const [groupMembersCount, setGroupMembersCount] = useState(0);
  const messagesEndRef = useRef(null);

  // Helper: File icon for document types
  const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    switch (extension) {
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

  // Helper: File download or preview
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

  useEffect(() => {
    if (!selectedGroupId) return;

    const loadMessages = async () => {
      await getGroupMessages(selectedGroupId);
      subscribeToGroupMessages(selectedGroupId, (newMessage) => {
        setGroupMessages((prevMessages) => [...prevMessages, newMessage]);
        setSenderName(senderName);
      });

      try {
        const response = await axiosInstance.get(`/group/groupSize/${selectedGroupId}`);
        setGroupMembersCount(response.data.size);
      } catch (error) {
        console.error("Error fetching group size:", error);
      }
    };

    loadMessages();

    return () => {
      unsubscribeFromGroupMessages();
    };
  }, [
    selectedGroupId,
    getGroupMessages,
    subscribeToGroupMessages,
    unsubscribeFromGroupMessages,
    setGroupMessages,
    senderName,
    setSenderName,
  ]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [groupMessages]);

  if (isGroupMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col border-l border-base-300">
        <GroupChatHeader />
        <div className="flex-1 overflow-y-auto">
          <MessageSkeleton />
        </div>
        <GroupMessageInput selectedGroupId={selectedGroupId} />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col border-l border-base-300">
      <GroupChatHeader groupName={selectedGroup} memberCount={groupMembersCount} />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {groupMessages?.length > 0 ? (
          groupMessages.map((message) => (
            <div
              key={message._id || message.tempId}
              className={`chat ${message.senderId === authUser._id ? "chat-end" : "chat-start"}`}
            >
              <div className="chat-header mb-1">
                <span className="text-sm font-semibold">
                  {message.senderId === authUser._id ? "You" : message.senderName}
                </span>
               
              </div>
              <div
                className={`chat-bubble flex flex-col space-y-2 ${
                 message.senderId === authUser._id
                  ? "bg-primary text-primary-content"
                : "bg-base-200 text-base-content"
                }`}
                >
                {/* Image */}
                {message.image && (
                  <img
                    src={message.image}
                    alt="Attachment"
                    className="rounded-md max-h-60 object-cover"
                  />
                )}

                {/* File */}
                {message.file && message.file.url && (
                  <div
                    className="flex items-center gap-2 p-2 bg-base-200 rounded-lg cursor-pointer hover:bg-base-300"
                    onClick={() => handleFileClick(message.file)}
                  >
                    <span className="text-lg">{getFileIcon(message.file.originalName)}</span>
                    <div className="flex-1 min-w-0">
                      <p  className={"text-base-content"}>{message.file.originalName}</p>
                      <p className="text-xs text-gray-500">{Math.round(message.file.size / 1024)} KB</p>
                    </div>
                  </div>
                )}

                {/* Text */}
                {message.text && <p className="whitespace-pre-wrap">{message.text}</p>}
                 <div className="flex justify-end">
  <time className="text-xs opacity-50">
    {formatMessageTime(message.createdAt)}
  </time>
</div>

              </div>
            </div>
          ))
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-base-content/70">No messages yet</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <GroupMessageInput selectedGroupId={selectedGroupId} />
    </div>
  );
};

export default GroupChatContainer;
