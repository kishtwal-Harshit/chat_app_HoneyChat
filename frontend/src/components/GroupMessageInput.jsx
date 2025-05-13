import { useState, useRef } from "react";
import { BsSend } from "react-icons/bs";
import { FaPaperclip } from "react-icons/fa";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { X } from "lucide-react";

const GroupMessageInput = ({ selectedGroupId }) => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview) return;

    const messageData = { text: text.trim() };
    if (imagePreview) {
      messageData.image = imagePreview;
    }

    try {
      await axiosInstance.post(`/group/send/${selectedGroupId}`, messageData, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      setText("");
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  return (
    <div className="p-4 border-t border-base-300 bg-base-100 flex flex-col gap-2">
      {imagePreview && (
        <div className="flex items-center gap-2">
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-12 h-16 object-cover rounded-lg border border-zinc-200"
            />
            <button
              onClick={removeImage}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300 flex items-center justify-center"
              type="button"
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      )}

      <form
        onSubmit={handleSendMessage}
        className="flex items-center gap-2 w-full"
      >
        <input
          type="text"
          className="flex-grow input input-bordered rounded-lg input-sm sm:input-md text-gray-700 dark:text-gray-300"
          placeholder="Type a message"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSendMessage(e);
            }
          }}
        />

        <label className="cursor-pointer">
          <FaPaperclip size={18} className="text-base-content/70" />
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageChange}
          />
        </label>

        <button
          type="submit"
          className="btn btn-primary btn-sm"
          disabled={!text.trim() && !imagePreview}
        >
          <BsSend />
        </button>
      </form>
    </div>
  );
};

export default GroupMessageInput;
