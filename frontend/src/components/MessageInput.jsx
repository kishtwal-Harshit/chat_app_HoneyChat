import { useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { Sparkles, Image, Send, X, Ban, FileText } from "lucide-react";
import toast from "react-hot-toast";

const MessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const imageInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const { sendMessage, banUser } = useChatStore();

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
        // For base64 image
        formData.append("image", imagePreview);
      }
      
      if (filePreview) {
        // For actual file
        formData.append("file", filePreview.file);
      }

      await sendMessage(formData);

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

  let url = import.meta.env.MODE === "development" 
    ? "http://localhost:5001/api/messages/generate" 
    : "https://chat-app-honeychat.onrender.com/api/messages/generate";

  const generateAiResponse = async (prompt) => {
    setLoading(true);
    try {
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

  const handleBan = async () => {
    try {
      await banUser();
    } catch (error) {
      console.error("Failed to ban/unban the user:", error);
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
    <div className="p-4 w-full">
      {/* Preview Section */}
        {imagePreview && (
          <div className="flex items-center gap-2">
            <div className="relative">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-20 h-20 object-cover rounded-lg border border-zinc-700"
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
   

      {/* Input Form */}
      <form onSubmit={handleSendMessage} className="flex items-center gap-2">
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            className="w-full input input-bordered rounded-lg input-sm sm:input-md"
            placeholder="Type a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
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
            className={`hidden sm:flex btn btn-circle px-4 py-2 font-bold ${imagePreview ? "text-emerald-500" : "text-zinc-400"}`}
            onClick={() => imageInputRef.current?.click()}
            title="Attach image"
          >
            <Image size={20} />
          </button>

          <button
            type="button"
            className={`hidden sm:flex btn btn-circle px-4 py-2 font-bold ${imagePreview ? "text-emerald-500" : "text-zinc-400"}`}
            onClick={() => fileInputRef.current?.click()}
            title="Attach file"
          >
            <FileText size={20} />
          </button>

          <button
            type="button"
            className={`hidden sm:flex btn btn-circle px-4 py-2 font-bold ${imagePreview ? "text-emerald-500" : "text-zinc-400"}`}
            onClick={openDialogBox}
            title="AI Assistant"
          >
            <Sparkles size={20} />
          </button>

          <button
            type="button"
            className={`hidden sm:flex btn btn-circle px-4 py-2 font-bold ${imagePreview ? "text-emerald-500" : "text-zinc-400"}`}
            onClick={handleBan}
            title="Ban user"
          >
            <Ban size={20} />
          </button>
        </div>

        <button
          type="submit"
          className={`hidden sm:flex btn btn-circle px-4 py-2 font-bold ${imagePreview ? "text-emerald-500" : "text-zinc-400"}`}
          disabled={!text.trim() && !imagePreview && !filePreview}
          title="Send message"
        >
          <Send size={30} />
        </button>
      </form>

      {/* AI Dialog */}
      {isDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-1/3">
            <h2 className="text-2xl mb-4">Enter your prompt</h2>
            <textarea
              className="w-full p-2 border rounded-lg"
              value={dialogText}
              onChange={(e) => setDialogText(e.target.value)}
              placeholder="Ask anything..."
              rows={4}
            />
            <div className="flex justify-end mt-4 gap-2">
              <button
                type="button"
                className="px-4 py-2 bg-gray-300 text-black rounded-lg"
                onClick={closeDialogBox}
              >
                Close
              </button>
              <button
                type="button"
                className="px-4 py-2 bg-emerald-500 text-white rounded-lg"
                onClick={handleDialogSubmit}
                disabled={loading}
              >
                {loading ? "Loading..." : "Submit"}
              </button>
            </div>

            {aiResponse && (
              <div className="mt-4">
                <h3 className="font-bold text-lg mb-2">AI Response:</h3>
                <div className="border p-2 rounded-lg max-h-48 overflow-y-auto w-full text-sm whitespace-pre-wrap">
                  {aiResponse}
                </div>
                <button
                  onClick={handleCopyResponse}
                  className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg"
                >
                  Copy Response
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageInput;