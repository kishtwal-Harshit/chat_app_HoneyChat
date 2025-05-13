import { useState, useRef } from "react";
import { BsSend } from "react-icons/bs";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { X, Sparkles, Image } from "lucide-react";

const GroupMessageInput = ({ selectedGroupId }) => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  // AI Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogText, setDialogText] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [loading, setLoading] = useState(false);

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

  const openDialogBox = () => {
    setIsDialogOpen(true);
  };

  const closeDialogBox = () => {
    setIsDialogOpen(false);
    setDialogText("");
    setAiResponse("");
  };

  const generateAiResponse = async (prompt) => {
    setLoading(true);
    try {
      const url = import.meta.env.MODE === "development" 
        ? "http://localhost:5001/api/messages/generate" 
        : "https://chat-app-honeychat.onrender.com/api/messages/generate";
      
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch AI response");
      }

      const data = await response.json();
      setAiResponse(data.response);
    } catch (error) {
      console.error("Error fetching AI response:", error);
      toast.error("Failed to get AI response from Gemini.");
    }
    setLoading(false);
  };

  const handleDialogSubmit = async () => {
    await generateAiResponse(dialogText);
  };

  const handleCopyResponse = () => {
    if (aiResponse) {
      navigator.clipboard.writeText(aiResponse);
      toast.success("AI response copied to clipboard!");
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
              className="w-20 h-20 object-cover rounded-lg border border-zinc-200"
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

      <form onSubmit={handleSendMessage} className="flex items-center gap-2 w-full">
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
          <Image size={20} className="text-base-content/70" />
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageChange}
          />
        </label>

        <button
          type="button"
          className="btn btn-circle btn-sm"
          onClick={openDialogBox}
        >
          <Sparkles size={18} />
        </button>

        <button
          type="submit"
          className="btn btn-primary btn-sm"
          disabled={!text.trim() && !imagePreview}
        >
          <BsSend />
        </button>
      </form>

      {isDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-base-100 p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Generate AI Response</h2>
            <textarea
              className="w-full p-2 border rounded-lg bg-base-200 text-base-content"
              value={dialogText}
              onChange={(e) => setDialogText(e.target.value)}
              placeholder="Ask anything..."
              rows={4}
            />
            <div className="flex justify-end mt-4 gap-2">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={closeDialogBox}
              >
                Close
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleDialogSubmit}
                disabled={loading}
              >
                {loading ? "Generating..." : "Generate"}
              </button>
            </div>

            {aiResponse && (
              <div className="mt-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold">AI Response:</h3>
                  <button
                    onClick={handleCopyResponse}
                    className="btn btn-xs"
                  >
                    Copy
                  </button>
                </div>
                <div className="p-3 bg-base-200 rounded-lg max-h-48 overflow-y-auto text-sm whitespace-pre-wrap">
                  {aiResponse}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupMessageInput;