const GroupChatHeader = ({ groupName = "Group", memberCount = 0 }) => {
  return (
    <div className="flex items-center justify-between p-4 border-b border-base-300 bg-base-100">
      <div>
        <h2 className="text-lg font-semibold">{groupName}</h2>
        <p className="text-sm text-base-content/70">{memberCount} member{memberCount !== 1 ? 's' : ''}</p>
      </div>
    </div>
  );
};

export default GroupChatHeader;
