import { useState } from "react";
import { BsSend } from "react-icons/bs";
import { FaPaperclip } from "react-icons/fa";
import { axiosInstance } from "../lib/axios";
import { useRef } from "react";
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
      setImagePreview(reader.result);  // Store base64 image preview
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview) return;  // Prevent empty messages

    const messageData = { text: text.trim() };

    if (imagePreview) {
      messageData.image = imagePreview;  // Send base64 image
    }

    try {
        await axiosInstance.post(`/group/send/${selectedGroupId}`, messageData, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      //console.log(res);
      //toast.success("group message saved successfully");
      setText("");  // Reset text
      setImagePreview(null);  // Reset image preview
      if (fileInputRef.current) fileInputRef.current.value = "";
      //const res1 = await axiosInstance.get(`/group/fetchMessages/${selectedGroupId}`);
      //console.log(res1.data.messages);
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  return (
    <div className="p-4 border-t border-base-300 bg-base-100 flex items-center gap-2">
      {imagePreview && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-10 h-14 object-cover rounded-lg border border-zinc-200"
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

      <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <div className="flex-1 flex gap-2">
       <input
  type="text"
className="w-full input input-bordered rounded-lg input-sm sm:input-md"
  placeholder="Type a message"
  value={text}
  width={1000}
  onChange={(e) => setText(e.target.value)}
  onKeyDown={(e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSendMessage(e);
    }
  }}
/>
</div>

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
