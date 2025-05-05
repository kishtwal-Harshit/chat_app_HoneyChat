import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Users, X, Plus, MessagesSquare, LogOut } from "lucide-react";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

const Sidebar = () => {
  // State from stores
  const { getUsers, users, selectedUser, setSelectedUser, isUsersLoading } = useChatStore();
  const { onlineUsers } = useAuthStore();

  // Component state
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [newMemberUsername, setNewMemberUsername] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState(null);

  // Display state - single source of truth for what's shown
  const [displayedItems, setDisplayedItems] = useState([]);
  const [displayTitle, setDisplayTitle] = useState("Contacts");

  // Fetch initial data
  useEffect(() => {
    getUsers();
    fetchGroups();
  }, [getUsers]);

  // Update displayed items whenever relevant state changes
  useEffect(() => {
    if (selectedGroup) {
      // Don't modify display when a group is selected (handled by showGroupMembers)
      return;
    }
    
    setDisplayTitle("Contacts");
    const filtered = showOnlineOnly
      ? users.filter((user) => onlineUsers.includes(user._id))
      : users;
    
    // Add online status to each user before displaying
    const usersWithStatus = filtered.map(user => ({
      ...user,
      isOnline: onlineUsers.includes(user._id) // This was the key fix
    }));

    setDisplayedItems(usersWithStatus);
  }, [users, onlineUsers, showOnlineOnly, selectedGroup]);

  // Fetch all groups
  const fetchGroups = async () => {
    try {
      const res = await axiosInstance.get("/group/groups");
      setGroups(res.data.groups || []);
    } catch (error) {
      setGroups([]);
      toast.error(error.response?.data?.message || "Failed to fetch groups");
    }
  };

  // Fetch and display members of a specific group
  const showGroupMembers = async (groupId, groupName) => {
    try {
      setIsLoading(true);
      //setDisplayTitle(`Members of ${groupName}`);
      const res = await axiosInstance.get(`/group/members/${groupId}`);
      
      // Merge online status with member data
      const membersWithStatus = res.data.members.map(member => ({
        ...member,
        isOnline: onlineUsers.includes(member._id)
      }));

      setDisplayedItems(membersWithStatus);
      setSelectedGroup(groupName);
      setSelectedGroupId(groupId);
    } catch (error) {
      console.error("Error fetching group members:", error);
      toast.error(error.response?.data?.message || "Failed to fetch members");
      setDisplayedItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Group creation handler
  const handleNewGroup = () => {
    setShowGroupModal(true);
    setSelectedGroup(null);
    setSelectedGroupId(null);
  };

  // Create new group API call
  const handleCreateGroup = async () => {
    try {
      if (!groupName.trim()) {
        toast.error("Group name cannot be empty");
        return;
      }
      await axiosInstance.post("/group/createGroup", { name: groupName });
      toast.success("Group created!");
      setGroupName("");
      setShowGroupModal(false);
      fetchGroups();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create group");
    }
  };

  // Leave group handler
  const handleLeaveGroup = async (groupId) => {
    try {
      const res = await axiosInstance.post(`/group/leaveGroup/${groupId}`);
      toast.success(res.data?.message || "Left group");
      fetchGroups();
      setSelectedGroup(null);
      setSelectedGroupId(null);
      setDisplayTitle("Contacts");
      // Reset to show all users
      const filtered = showOnlineOnly
        ? users.filter((user) => onlineUsers.includes(user._id))
        : users;
      setDisplayedItems(filtered.map(user => ({
        ...user,
        isOnline: onlineUsers.includes(user._id)
      })));
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to leave group");
    }
  };

  // Add member to group handler
  const handleAddMember = async () => {
    try {
      if (!newMemberUsername.trim()) {
        toast.error("Username cannot be empty");
        return;
      }
      const res = await axiosInstance.post(
        `/group/add/${selectedGroupId}/${newMemberUsername}`
      );
      toast.success(res.data?.message || "Member added!");
      setNewMemberUsername("");
      setShowAddMemberModal(false);
      // Refresh the members list
      showGroupMembers(selectedGroupId, selectedGroup);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add member");
    }
  };

  if (isUsersLoading) return <SidebarSkeleton />;

  return (
    <>
      <aside className="h-full w-20 lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200">
        
        <div className="border-b border-base-300 w-full p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="size-5" />
              <span className="font-medium hidden lg:block">{displayTitle}</span>
            </div>
            <button onClick={handleNewGroup} className="btn btn-ghost btn-sm hidden lg:flex">
              <Plus className="size-5" />
              <span className="font-medium hidden lg:block">New Group</span>
            </button>
          </div>

          {!selectedGroup && (
            <div className="mt-3 hidden lg:flex items-center gap-2">
              <label className="cursor-pointer flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showOnlineOnly}
                  onChange={(e) => setShowOnlineOnly(e.target.checked)}
                  className="checkbox checkbox-sm"
                />
                <span className="text-sm">Show online only</span>
              </label>
              <span className="text-xs text-zinc-500">({onlineUsers.length - 1} online)</span>
            </div>
          )}
        </div>

        {/* Main content area */}
        <div className="overflow-y-auto w-full py-3">
          {isLoading ? (
            <div className="text-center py-4">Loading...</div>
          ) : displayedItems.length > 0 ? (
            displayedItems.map((item) => (
              <button
                key={item._id}
                onClick={() => {
                  if (!selectedGroup) {
                    setSelectedUser(item);
                    setSelectedGroup(null);
                  }
                }}
                className={`w-full p-3 flex items-center gap-3 hover:bg-base-300 transition-colors ${
                  (!selectedGroup && selectedUser?._id === item._id) ? "bg-base-300 ring-1 ring-base-300" : ""
                }`}
              >
                <div className="relative mx-auto lg:mx-0">
                  <img
                    src={item.profilePic || "/avatar.png"}
                    alt={item.fullName || item.username}
                    className="size-12 object-cover rounded-full"
                  />
                  {/* Online status indicator */}
                  {item.isOnline && (
                    <span className="absolute bottom-0 right-0 size-3 bg-green-500 rounded-full ring-2 ring-zinc-900" />
                  )}
                </div>
                <div className="hidden lg:block text-left min-w-0">
                  <div className="font-medium truncate">{item.fullName || item.username}</div>
                  <div className="text-sm text-zinc-400">
                    {item.isOnline ? "Online" : "Offline"}
                  </div>
                </div>
              </button>
            ))
          ) : (
            <div className="text-center text-zinc-500 py-4">
              {selectedGroup ? "No members in this group" : 
               showOnlineOnly ? "No online users" : "No users available"}
            </div>
          )}

          {/* Groups list */}
          {groups.length > 0 && (
            <div className="mt-5 px-3">
              <h4 className="text-sm font-semibold mb-2 text-zinc-600">Groups</h4>
              {groups.map((group) => (
                <button
                  key={group._id}
                  onClick={() => showGroupMembers(group._id, group.name)}
                  className={`w-full p-3 text-left truncate flex items-center justify-between hover:bg-base-300 transition-colors ${
                    selectedGroup === group.name ? "bg-base-300 ring-1 ring-base-300" : ""
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <MessagesSquare className="size-4 text-zinc-500" />
                    <span className="truncate">{group.name}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Plus
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedGroupId(group._id);
                        setShowAddMemberModal(true);
                      }}
                      className="size-4 text-zinc-500 hover:text-blue-500 hover:shadow-[0_0_10px_3px_rgba(20,68,2225,0.7)] rounded-full transition-all duration-200"
                      title="Add Member"
                    />
                    <LogOut
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLeaveGroup(group._id);
                      }}
                      className="size-4 text-zinc-500 hover:text-red-500 hover:shadow-[0_0_10px_3px_rgba(239,68,68,0.7)] rounded-full transition-all duration-200"
                      title="Leave Group"
                    />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* Group Creation Modal */}
      {showGroupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-base-100 p-6 rounded-lg w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Create New Group</h3>
              <button
                onClick={() => {
                  setShowGroupModal(false);
                  setGroupName("");
                }}
                className="btn btn-ghost btn-sm"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Group Name</span>
              </label>
              <input
                type="text"
                placeholder="Enter group name"
                className="input input-bordered w-full"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                autoFocus
              />
            </div>

            <div className="modal-action mt-4">
              <button
                onClick={handleCreateGroup}
                className="btn btn-primary"
                disabled={!groupName.trim()}
              >
                Create Group
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-base-100 p-6 rounded-lg w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Add Member to Group</h3>
              <button
                onClick={() => {
                  setShowAddMemberModal(false);
                  setNewMemberUsername("");
                }}
                className="btn btn-ghost btn-sm"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Username</span>
              </label>
              <input
                type="text"
                placeholder="Enter username"
                className="input input-bordered w-full"
                value={newMemberUsername}
                onChange={(e) => setNewMemberUsername(e.target.value)}
                autoFocus
              />
            </div>

            <div className="modal-action mt-4">
              <button
                onClick={handleAddMember}
                className="btn btn-primary"
                disabled={!newMemberUsername.trim()}
              >
                Add Member
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;