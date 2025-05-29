// store/useChatStore.js
import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";
import { useNotificationStore } from "./useNotificationStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  groupMessages: [],
  groups: [],
  groupMembers: [],
  selectedGroup: null,
  selectedGroupId: null,
  isGroupsLoading: false,
  isGroupMessagesLoading: false,

  resetChatState: () =>
    set({
      selectedUser: null,
      selectedGroup: null,
      selectedGroupId: null,
      messages: [],
      groupMessages: [],
    }),

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch users");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    try {
      const res = await axiosInstance.post(
        `/messages/send/${selectedUser._id}`,
        messageData
      );
      set({ messages: [...messages, res.data] });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send message");
    }
  },

  banUser: async () => {
    const { selectedUser } = get();
    try {
      const res = await axiosInstance.post(
        `/messages/toggle-ban/${selectedUser._id}`
      );
      toast.success(res.data?.message || "User ban status updated");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update ban status");
    }
  },

  subscribeToMessages: async () => {
    const socket = useAuthStore.getState().socket;
    const { addNotification } = useNotificationStore.getState();
    const { authUser } = useAuthStore.getState();
      
    socket.on("newMessage", async (newMessage) => {
      const { selectedUser } = get();
      const sender = await axiosInstance.get(`/messages/username/${newMessage.senderId}`);
      if (newMessage.senderId === authUser._id) return;

      if (!selectedUser || newMessage.senderId !== selectedUser._id) {
        addNotification({
          id: newMessage._id || Date.now().toString(),
          type: "message",
          senderId: newMessage.senderId,
          senderName: sender.data.name || "Unknown",
          message: newMessage.text || "New message",
          image: newMessage.image || null,
          file: newMessage.file || null,
          timestamp: new Date(),
          read: false,
        });
      
        if (!selectedUser) {
          toast.success(`New message from ${sender.data.name}`);
        } else {
          toast.success(
            `New message from ${sender.data.name}`
          );
        }
        return;
      }

      set({
        messages: [...get().messages, newMessage],
      });
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
  },

  getGroups: async () => {
    set({ isGroupsLoading: true });
    try {
      const res = await axiosInstance.get("/group/groups");
      set({ groups: res.data?.groups || [] });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch groups");
    } finally {
      set({ isGroupsLoading: false });
    }
  },

   getGroupMessages: async (groupId) => {
    set({ isGroupMessagesLoading: true, selectedGroupId: groupId });
    try {
      const res = await axiosInstance.get(`/group/fetchMessages/${groupId}`);
      set({ 
        groupMessages: res.data?.messages || [],
        senderName: res.data?.senderName || null,
        isGroupMessagesLoading: false,
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch group messages");
      set({ isGroupMessagesLoading: false });
    }
  },
  
sendGroupMessage: async (messageData) => {
  const { selectedGroupId, groupMessages } = get();
  const { authUser } = useAuthStore.getState();
  const socket = useAuthStore.getState().socket;

  // Create optimistic message
  const tempMessage = {
    tempId: Date.now().toString(),
    senderId: authUser._id,
    text: messageData.text,
    image: messageData.image || null,
    createdAt: new Date(),
    isOptimistic: true
  };

  // Add optimistic message to UI immediately
  set({ groupMessages: [...groupMessages, tempMessage] });

  try {
    // Send to server
    const res = await axiosInstance.post(`/group/send/${selectedGroupId}`, messageData);
    const newMessage = res.data;

    // Replace optimistic message with real message
    set({
      groupMessages: groupMessages.map(msg => 
        msg.tempId === tempMessage.tempId ? newMessage : msg
      )
    });

    // Notify server to broadcast to other members
    socket.emit("sendGroupMessage", {
      groupId: selectedGroupId,
      message: newMessage
    });

  } catch (error) {
    // Remove optimistic message if send fails
    set({
      groupMessages: groupMessages.filter(msg => msg.tempId !== tempMessage.tempId)
    });
    toast.error(error.response?.data?.message || "Failed to send group message");
  }
},

  getGroupMembers: async (groupId) => {
    try {
      const res = await axiosInstance.get(`/group/members/${groupId}`);
      set({ groupMembers: res.data?.members || [] });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch group members");
    }
  },

  subscribeToGroupMessages: (groupId) => {
  const socket = useAuthStore.getState().socket;
  
  if (!socket) {
    console.error("Socket not available");
    return;
  }

  // Join the group room
  socket.emit("joinGroup", groupId);
  
  // Listen for new messages
  socket.on("newGroupMessage", (data) => {
    const { selectedGroupId, groupMessages } = get();
    
    // Only add if it's for the current group
    if (data.groupId === selectedGroupId) {
      // Check if message already exists (prevent duplicates)
      const messageExists = groupMessages.some(
        msg => msg._id?.toString() === data.message._id?.toString()
      );
      
      if (!messageExists) {
        set({ groupMessages: [...groupMessages, data.message] });
      }
    }
  });
},

unsubscribeFromGroupMessages: () => {
  const socket = useAuthStore.getState().socket;
  if (socket) {
    socket.off("newGroupMessage");
    socket.emit("leaveAllGroups");
  }
},

  createGroup: async (groupName) => {
    try {
      const res = await axiosInstance.post("/group/create", { name: groupName });
      set((state) => ({ groups: [...state.groups, res.data.group] }));
      toast.success(res.data?.message || "Group created successfully");
      return res.data.group;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create group");
      throw error;
    }
  },

  addGroupMember: async (groupId, username) => {
    try {
      const res = await axiosInstance.post(
        `/group/add/${groupId}/${username}`
      );
      toast.success(res.data?.message || "Member added successfully");
      return res.data.member;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add member");
      throw error;
    }
  },

  leaveGroup: async (groupId) => {
    try {
      const res = await axiosInstance.post(`/group/leave/${groupId}`);
      set({
        groups: get().groups.filter((group) => group._id !== groupId),
        selectedGroup: null,
        selectedGroupId: null,
        groupMessages: [],
      });
      toast.success(res.data?.message || "Left group successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to leave group");
    }
  },

  setSelectedUser: (selectedUser) =>
    set({
      selectedUser,
      selectedGroup: null,
      selectedGroupId: null,
      groupMessages: [],
    }),

  setSelectedGroupId: (groupId) =>
    set({
      selectedGroupId: groupId,
      selectedUser: null,
      messages: [],
    }),

  setSelectedGroup: (group) =>
    set({
      selectedGroup: group?.name || null,
      selectedGroupId: group?._id || null,
      selectedUser: null,
      messages: [],
    }),
}));