import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef, useState } from "react";
import GroupChatHeader from "./GroupChatHeader"; // Recommend separate header component
import GroupMessageInput from "./GroupMessageInput"; // Recommend separate input component
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";
import {axiosInstance} from "../lib/axios"; // Import axiosInstance to make API calls

const GroupChatContainer = () => {
  const {
    groupMessages,
    getGroupMessages,
    isGroupMessagesLoading, // Changed to match store convention
    selectedGroup,
    selectedGroupId,
    groupMembers,
    subscribeToGroupMessages,
    unsubscribeFromGroupMessages
  } = useChatStore();

  const { authUser } = useAuthStore();
  const [groupMembersCount, setGroupMembersCount] = useState(0); // State to hold member count
  const messagesEndRef = useRef(null);

  // Fetch messages and setup real-time updates
  useEffect(() => {
    if (!selectedGroupId) return;

    const loadMessages = async () => {
      await getGroupMessages(selectedGroupId);
      subscribeToGroupMessages(selectedGroupId);

      // Fetch the number of group members
      try {
        const response = await axiosInstance.get(`/group/groupSize/${selectedGroupId}`);
        setGroupMembersCount(response.data.size); // Assuming response contains 'count'
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
    unsubscribeFromGroupMessages
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
        <GroupMessageInput />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col border-l border-base-300">
      <GroupChatHeader 
        groupName={selectedGroup} 
        memberCount={groupMembersCount} // Use the member count here
      />
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {groupMessages?.length > 0 ? (
          groupMessages.map((message) => {
            const sender = groupMembers?.find(m => m._id === message.senderId) || {};
            
            return (
              <div
                key={message._id || message.tempId}
                className={`flex ${message.senderId === authUser._id ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-xs md:max-w-md lg:max-w-lg xl:max-w-xl rounded-lg p-3 ${message.senderId === authUser._id ? 'bg-primary text-primary-content' : 'bg-base-200'}`}>
                  {message.senderId !== authUser._id && (
                    <div className="font-semibold text-sm mb-1">
                      {sender.fullName || sender.username}
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

      <GroupMessageInput groupId={selectedGroupId} />
    </div>
  );
};

export default GroupChatContainer;
