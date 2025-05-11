import { useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { BsSend } from "react-icons/bs";
import { FaPaperclip } from "react-icons/fa";

const GroupMessageInput = ( ) => {
  const [text, setText] = useState("");
  const [image, setImage] = useState(null);
  const sendGroupMessage = useChatStore((state) => state.sendGroupMessage);

  const handleSend = async () => {
    if (!text && !image) return;

    const formData = new FormData();
    if (text) formData.append("text", text);
    if (image) formData.append("image", image);

    await sendGroupMessage(formData);
    setText("");
    setImage(null);
  };

  return (
    <div className="p-4 border-t border-base-300 bg-base-100 flex items-center gap-2">
      <label className="cursor-pointer">
        <FaPaperclip size={18} className="text-base-content/70" />
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImage(e.target.files[0])}
          className="hidden"
        />
      </label>

      <input
        type="text"
        placeholder="Type a message"
        className="flex-1 input input-bordered w-full"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSend()}
      />

      <button onClick={handleSend} className="btn btn-primary btn-sm">
        <BsSend />
      </button>
    </div>
  );
};

export default GroupMessageInput;
