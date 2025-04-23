

const NoChatSelected = () => {
  return (
    <div className="w-full flex flex-1 flex-col items-center justify-center p-16 bg-base-100/50">
      <div className="max-w-md text-center space-y-6">
        {/* Icon Display */}
        <div className="flex justify-center gap-4 mb-4">
  <div className="relative">
    <div
      className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center
        justify-center animate-bounce hover:ring-4 hover:ring-yellow-600 hover:ring-opacity-60 transition-all duration-500"
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 0 1-.923 1.785A5.969 5.969 0 0 0 6 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337Z" />
      </svg>
    </div>
  </div>
</div>


        {/* Welcome Text */}
        <h2 className="text-2xl font-bold">Welcome to HoneyChat!</h2>
        <p className="text-base-content/60">
          Select the person you want to chat with
        </p>
      </div>
    </div>
  );
};

export default NoChatSelected;