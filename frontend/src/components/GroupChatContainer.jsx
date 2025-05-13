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
    setGroupMessages, // Add this to update group messages in the store
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
 
  // Fetch messages and setup real-time updates
  useEffect(() => {
    if (!selectedGroupId) return;

    const loadMessages = async () => {
      
      await getGroupMessages(selectedGroupId);
      subscribeToGroupMessages(selectedGroupId, (newMessage) => {
        setGroupMessages((prevMessages) => [...prevMessages, newMessage]); // Update messages when new ones arrive
        setSenderName(senderName);
        console.log("check!!!");
      });

      // Fetch the number of group members
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

  // Auto-scroll to bottom when messages change
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
      <GroupChatHeader 
        groupName={selectedGroup} 
        memberCount={groupMembersCount}
      />
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {groupMessages?.length > 0 ? (
          groupMessages.map((message) => {

            
            return (
              <div
                key={message._id || message.tempId}
                className={`flex ${message.senderId === authUser._id ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-xs md:max-w-md lg:max-w-lg xl:max-w-xl rounded-lg p-3 ${message.senderId === authUser._id ? 'bg-primary text-primary-content' : 'bg-base-200'}`}>
                  { (
                   <div className={`font-semibold text-sm mb-1 ${
                message.senderId === authUser._id
                  ? 'text-primary-content/90' 
                  : 'text-secondary dark:text-secondary-focus'
              }`}>
                {message.senderId !== authUser._id &&  <span className="text-gray-700 dark:text-gray-300">{message.senderName}</span>}
                {message.senderId === authUser._id && (
                  <span className="ml-1 text-primary-content/70">you</span>
                )}
              </div>
                  )}
                
                  {message.image && (
                    <img
                      src={message.image}
                      alt="Attachment"
                      className="rounded-md mb-2 max-h-60 object-cover"
                    />
                  )}
                
                  {message.text && <p className="whitespace-pre-wrap">{message.text}</p>}
                  
                  <div className="text-xs opacity-70 mt-1 text-right">
                    {formatMessageTime(message.createdAt)}
                  </div>
                </div>
              </div>
            );
          })
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