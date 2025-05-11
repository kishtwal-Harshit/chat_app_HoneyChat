import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Users, X, Plus, MessagesSquare, LogOut, UserX} from "lucide-react";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

const Sidebar = () => {
  // State from stores
  const { 
    getUsers, 
    users, 
    selectedUser, 
    setSelectedUser, 
    isUsersLoading,
    setSelectedGroupId,
    setSelectedGroup,
    selectedGroupId,
  } = useChatStore();
  
  const { onlineUsers } = useAuthStore();
  //let selectedGroupName = null;

  // Component state
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groups, setGroups] = useState([]);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [newMemberUsername, setNewMemberUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentGroupId, setCurrentGroupId] = useState(null); 
  const [currentGroupName, setCurrentGroupName] = useState(null); 
  const [groupSize, setGroupSize] = useState(0);
  //const [curGroupId, setCurGroupId] = useState("");

  const { authUser } = useAuthStore();
  const loggedInUserId = authUser?._id;
  // Display state
  const [displayedItems, setDisplayedItems] = useState([]);
  const [displayTitle, setDisplayTitle] = useState("Contacts");
  const [showGroupMembersView, setShowGroupMembersView] = useState(false);

  // Fetch initial data
  useEffect(() => {
    getUsers();
    fetchGroups();
  }, [getUsers]);

  // Update displayed items
  useEffect(() => {
    if (showGroupMembersView) return;
    
    setDisplayTitle("Contacts");
    const filtered = showOnlineOnly
      ? users.filter((user) => onlineUsers.includes(user._id))
      : users;
    
    setDisplayedItems(filtered.map(user => ({
      ...user,
      isOnline: onlineUsers.includes(user._id)
    })));
  }, [users, onlineUsers, showOnlineOnly, showGroupMembersView]);

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

  // Handle contacts button click
  const handleContactsClick = () => {
    setShowGroupMembersView(false);
    setSelectedGroupId(null);
    setSelectedGroup(null);
    setSelectedUser(null);
  };

  // Handle group selection
  /*const handleGroupSelect = async (groupId, groupName) => {
    try {
      setIsLoading(true);
      setShowGroupMembersView(true);
      setSelectedGroupId(groupId);
      setSelectedGroup(groupName);
      //selectedGroupName = groupName;
      setCurGroupId(groupId);
      setSelectedUser(null);
      //setDisplayTitle(groupName);
      
      const res = await axiosInstance.get(`/group/members/${groupId}`);
      setDisplayedItems(res.data.members.map(member => ({
        ...member,
        isOnline: onlineUsers.includes(member._id)
      })));
    } catch (error) {
      console.error("Error fetching group members:", error);
      toast.error(error.response?.data?.message || "Failed to fetch members");
      setDisplayedItems([]);
    } finally {
      setIsLoading(false);
    }
  };*/
  const handleGroupSelect = async (groupId, groupName) => {
  try {
    setIsLoading(true);
    setShowGroupMembersView(true);
    setSelectedGroupId(groupId);
    setSelectedGroup(groupName);
    setCurrentGroupId(groupId);
    setCurrentGroupName(groupName);
    //setCurGroupId(groupId);
    setSelectedUser(null);
    const res = await axiosInstance.get(`/group/groupSize/${groupId}`);
    const groupSize = res.data.size;
    setGroupSize(groupSize);

    // Fetch members and admins in parallel
    const [membersRes, adminsRes] = await Promise.all([
      axiosInstance.get(`/group/members/${groupId}`),
      axiosInstance.get(`/group/admins/${groupId}`), // New endpoint (see Step 2)
    ]);

    // Mark admins in the displayed items
    const adminIds = new Set(adminsRes.data.admins.map(admin => admin._id.toString()));
    setDisplayedItems(
      membersRes.data.members.map(member => ({
        ...member,
        isOnline: onlineUsers.includes(member._id),
        isAdmin: adminIds.has(member._id.toString()), // Add admin flag
      }))
    );
  } catch (error) {
    toast.error("Failed to fetch group data",error);
  } finally {
    setIsLoading(false);
  }
};

  // Create new group
  const handleCreateGroup = async () => {
    try {
      if (!groupName.trim()) {
        toast.error("Group name cannot be empty");
        return;
      }
      const res = await axiosInstance.post("/group/createGroup", { name: groupName });
      console.log(res)
      toast.success("Group created!");
      setGroupName("");
      setShowGroupModal(false);
      fetchGroups();
      // Optionally select the new group
      //handleGroupSelect(res.data.group._id, res.data.group.name);
    } catch (error) {
      toast.error("failed to create group",error);
    }
  };

  // Leave group
  const handleLeaveGroup = async (groupId) => {
    try {
      await axiosInstance.post(`/group/leaveGroup/${groupId}`);
      toast.success("Left group successfully");
      fetchGroups();
      handleContactsClick(); // Reset to contacts view
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to leave group");
    }
  };

  // Add member to group
  const handleAddMember = async () => {
    try {
      if (!newMemberUsername.trim()) {
        toast.error("Username cannot be empty");
        return;
      }
      await axiosInstance.post(
        `/group/add/${selectedGroupId}/${newMemberUsername}`
      );
      toast.success("Member added!");
      setNewMemberUsername("");
      setShowAddMemberModal(false);
      // Refresh the members list
      handleGroupSelect(selectedGroupId, displayTitle);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add member");
    }
  };

  const handleMakeAdmin = async(id,groupId)=>{

    try{
      console.log(groupId);
      await axiosInstance.post(`/group/makeAdmin/${groupId}/${id}`);
      toast.success("user successfully promoted to admin");
    } catch(error){
      console.log(error);
      toast.error("something went wrong in promoting user to admin");
    }
  }

  const handleRemoveFromGroup = async (id,groupId)=>{

    try{
      await axiosInstance.post(`/group/remove/${groupId}/${id}`);
      toast.success("user successfully removed from the group")
    } catch(error){
      console.log(error.message);
      toast.error("something went wrong in removing user from the group");
    }
  }

  /*const isAdmin = async (groupId,userId)=>{

    try{
      const res = await axiosInstance.get(`/group/isAdmin/${groupId}/${userId}`);
      const result = res.data?.isAdmin === true;
      console.log("here : ",result);
      if(result) return 1;
      else return 0;
    } catch(error){
      toast.error(error || "error!");
    }
  }*/

  if (isUsersLoading) return <SidebarSkeleton />;

  return (
    <>
      <aside className="h-full w-20 lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200">
        <div className="border-b border-base-300 w-full p-5">
          <div className="flex items-center justify-between">
            <button 
              onClick={handleContactsClick}
              className="flex items-center gap-2 hover:bg-base-300 px-2 py-1 rounded"
            >
              <Users className="size-5" />
              <span className="font-medium hidden lg:block">{displayTitle}</span>
            </button>
            <button 
              onClick={() => setShowGroupModal(true)}
              className="btn btn-ghost btn-sm hidden lg:flex"
            >
              <Plus className="size-5" />
              <span className="font-medium hidden lg:block">New Group</span>
            </button>
          </div>
          {showGroupMembersView && ( <span className="flex items-center gap-2">
  <h2 className="ml-2.5">{currentGroupName}</h2>
  <h2 className="text-sm">{groupSize} {groupSize>1 ? "members" : "member"}</h2>
</span>)}
         
          
          {!showGroupMembersView && (
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
              <span className="text-xs text-zinc-500">
                ({onlineUsers.length - 1} online)
              </span>
            </div>
          )}
        </div>

        <div className="overflow-y-auto w-full py-3">
          {isLoading ? (
            <div className="text-center py-4">Loading...</div>
          ) : displayedItems.length > 0 ? (
            displayedItems.map((item) => (
              <button
                key={item._id}
                onClick={() => {
                  if (!showGroupMembersView) {
                    setSelectedUser(item);
                  }
                }}
                className={`w-full p-3 flex items-center gap-3 hover:bg-base-300 transition-colors ${
                  (!showGroupMembersView && selectedUser?._id === item._id) 
                    ? "bg-base-300 ring-1 ring-base-300" 
                    : ""
                }`}
              >
                <div className="relative mx-auto lg:mx-0">
                  <img
                    src={item.profilePic || "/avatar.png"}
                    alt={item.fullName || item.username}
                    className="size-12 object-cover rounded-full"
                  />
                  {item.isOnline && (
                    <span className="absolute bottom-0 right-0 size-3 bg-green-500 rounded-full ring-2 ring-zinc-900" />
                  )}
                </div>
                <div className="hidden lg:block text-left min-w-0">
                  <div className="font-medium truncate">{item.fullName || item.username}</div>
<div className="grid grid-cols-2 gap-4 w-full">
  <span className="text-sm text-zinc-400 text-left">
    {item.isOnline ? "Online" : "Offline"}
  </span>
  <div className="flex justify-end gap-2">
    {showGroupMembersView && item.isAdmin && (
      <span className="text-sm text-blue-500">Admin</span>
    )}
    {showGroupMembersView && !item.isAdmin && item._id!=loggedInUserId && (
      <button 
        onClick={(e) => {
          e.stopPropagation();
          handleRemoveFromGroup(item._id,currentGroupId);
        }}
        className="text-red-500 hover:text-red-700 transition-colors"
        title="Remove from group"
      >
        <UserX className="w-5 h-5" />
      </button>
    )}
     {showGroupMembersView && !item.isAdmin && item._id!=loggedInUserId && (
      <button 
        onClick={(e) => {
          e.stopPropagation();
          handleMakeAdmin(item._id,currentGroupId);
        }}
        className="text-green-500 hover:text-green-700 transition-colors"
        title="Remove from group"
      >
        <Plus className="w-5 h-5" />
      </button>
    )}
  </div>
</div>
                </div>
              </button>
            ))
          ) : (
            <div className="text-center text-zinc-500 py-4">
              {showGroupMembersView ? "No members in this group" : 
               showOnlineOnly ? "No online users" : "No users available"}
            </div>
          )}

          {/* Show groups list only in contacts view */}
          {!showGroupMembersView && groups.length > 0 && (
            <div className="mt-5 px-3">
              <h4 className="text-sm font-semibold mb-2 text-zinc-600">Groups</h4>
              {groups.map((group) => (
                <button
                  key={group._id}
                  onClick={() => handleGroupSelect(group._id, group.name)}
                  className={`w-full p-3 text-left truncate flex items-center justify-between hover:bg-base-300 transition-colors ${
                    selectedGroupId === group._id
                      ? "bg-base-300 ring-1 ring-base-300" 
                      : ""
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
                onClick={() => setShowGroupModal(false)}
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
                onClick={() => setShowAddMemberModal(false)}
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