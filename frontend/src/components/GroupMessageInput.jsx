import { useRef, useState } from "react";
import { BsSend } from "react-icons/bs";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { X, Sparkles, Image, FileText } from "lucide-react";

const GroupMessageInput = ({ selectedGroupId }) => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const imageInputRef = useRef(null);
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFilePreview({
      name: file.name,
      size: file.size,
      type: file.type,
      file: file
    });
  };

  const removeImage = () => {
    setImagePreview(null);
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const removeFile = () => {
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview && !filePreview) return;

    try {
      const formData = new FormData();
      formData.append("text", text.trim());
      
      if (imagePreview) {
        formData.append("image", imagePreview);
      }
      
      if (filePreview) {
        formData.append("file", filePreview.file);
      }

      await axiosInstance.post(
        `/group/send/${selectedGroupId}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setText("");
      setImagePreview(null);
      setFilePreview(null);
      if (imageInputRef.current) imageInputRef.current.value = "";
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message");
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

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <div className="p-4 border-t border-base-300 bg-base-100 flex flex-col gap-2">
      {/* Preview Section */}
      <div className="space-y-2">
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

        {filePreview && (
          <div className="flex items-center gap-2 p-2 bg-base-200 rounded-lg">
            <FileText className="text-blue-500" size={20} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{filePreview.name}</p>
              <p className="text-xs text-gray-500">
                {formatFileSize(filePreview.size)}
              </p>
            </div>
            <button
              onClick={removeFile}
              className="text-red-500 hover:text-red-700"
              type="button"
            >
              <X className="size-4" />
            </button>
          </div>
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSendMessage} className="flex items-center gap-2 w-full">
        <input
          type="text"
          className="flex-grow input input-bordered rounded-lg input-sm sm:input-md"
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

        {/* Hidden file inputs */}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          ref={imageInputRef}
          onChange={handleImageChange}
        />
        <input
          type="file"
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileChange}
        />

        {/* Action Buttons */}
        <button
          type="button"
          className="btn btn-circle btn-sm"
          onClick={() => imageInputRef.current?.click()}
          title="Attach image"
        >
          <Image size={18} />
        </button>

        <button
          type="button"
          className="btn btn-circle btn-sm"
          onClick={() => fileInputRef.current?.click()}
          title="Attach file"
        >
          <FileText size={18} />
        </button>

        <button
          type="button"
          className="btn btn-circle btn-sm"
          onClick={openDialogBox}
          title="AI Assistant"
        >
          <Sparkles size={18} />
        </button>

        <button
          type="submit"
          className="btn btn-circle btn-sm btn-primary"
          disabled={!text.trim() && !imagePreview && !filePreview}
          title="Send message"
        >
          <BsSend size={18} />
        </button>
      </form>

      {/* AI Dialog */}
      {isDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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