import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  // 1-to-1 Chat State
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,

  // Group Chat State
  groupMessages: [],
  groups: [],
  groupMembers: [],
  selectedGroup: null,
  selectedGroupId: null,
  isGroupsLoading: false,
  isGroupMessagesLoading: false,

  // Common Methods
  resetChatState: () => set({
    selectedUser: null,
    selectedGroup: null,
    selectedGroupId: null
  }),

  // 1-to-1 Chat Methods
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
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
      set({ messages: [...messages, res.data] });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send message");
    }
  },

  banUser: async () => {
    const { selectedUser } = get();
    try {
      const res = await axiosInstance.post(`/messages/toggle-ban/${selectedUser._id}`);
      toast.success(res.data?.message || "User ban status updated");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update ban status");
    }
  },

  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;

    socket.on("newMessage", (newMessage) => {
      const isMessageSentFromSelectedUser = newMessage.senderId === selectedUser._id;
      if (!isMessageSentFromSelectedUser) return;

      set({
        messages: [...get().messages, newMessage],
      });
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
  },

  // Group Chat Methods
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
    set({ isGroupMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/group/messages/${groupId}`);
      set({ groupMessages: res.data?.messages || [] });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch group messages");
    } finally {
      set({ isGroupMessagesLoading: false });
    }
  },

  /*sendGroupMessage: async (messageData) => {
    const { selectedGroupId, groupMessages } = get();
    try {
      const res = await axiosInstance.post(`/group/send/${selectedGroupId}`, messageData);
      set({ groupMessages: [...groupMessages, res.data] });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send group message");
    }
  },*/
  sendGroupMessage: async (messageData) => {
  const { selectedGroupId, groupMessages } = get();
  const socket = useAuthStore.getState().socket;

  try {
    const res = await axiosInstance.post(`/group/send/${selectedGroupId}`, messageData);

    const newMessage = res.data;

    // 1. Update local state
    set({ groupMessages: [...groupMessages, newMessage] });

    // 2. Emit to socket
    socket.emit("sendGroupMessage", {
      groupId: selectedGroupId,
      message: newMessage
    });

  } catch (error) {
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

  /*subscribeToGroupMessages: (groupId) => {
    const socket = useAuthStore.getState().socket;
    socket.join(groupId);

    socket.on("newGroupMessage", (newMessage) => {
      const { selectedGroupId } = get();
      if (newMessage.groupId !== selectedGroupId) return;

      set({
        groupMessages: [...get().groupMessages, newMessage],
      });
    });
  },*/
  subscribeToGroupMessages: (groupId) => {
  const socket = useAuthStore.getState().socket;

  // Emit a request to the server to join the group
  socket.emit("joinGroup", groupId); // Server should handle this

  socket.on("newGroupMessage", (newMessage) => {
    const { selectedGroupId, groupMessages } = get();
    if (newMessage.groupId !== selectedGroupId) return;

    set({
      groupMessages: [...groupMessages, newMessage],
    });
  });
},

  unsubscribeFromGroupMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newGroupMessage");
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
      const res = await axiosInstance.post(`/group/add/${groupId}/${username}`);
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
        groups: get().groups.filter(group => group._id !== groupId),
        selectedGroup: null,
        selectedGroupId: null
      });
      toast.success(res.data?.message || "Left group successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to leave group");
    }
  },

  setSelectedUser: (selectedUser) => set({ 
    selectedUser,
    selectedGroup: null,
    selectedGroupId: null 
  }),

 setSelectedGroupId: (groupId) => set({ 
  selectedGroupId: groupId,
  selectedUser: null,  // Clear user selection
  messages: []        // Clear 1:1 messages
}),

setSelectedGroup: (group) => set({ 
  selectedGroup: group?.name || null,
  selectedGroupId: group?._id || null,
  selectedUser: null,
  messages: []
}),


}));