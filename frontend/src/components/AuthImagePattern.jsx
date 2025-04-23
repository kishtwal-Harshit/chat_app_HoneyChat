const AuthImagePattern = ({ title, subtitle }) => {
  return (
    <div className="hidden lg:flex items-center justify-center bg-base-200 p-12">
      <div className="max-w-md text-center">
        {/* Diamond Grid */}
        <div className="relative h-48 w-full mb-8 flex items-center justify-center">
          <div className="absolute grid grid-cols-3 grid-rows-3 gap-2 transform rotate-45">
            {[...Array(9)].map((_, i) => (
              <div
                key={i}
                className={`
                  w-8 h-8
                  bg-primary/20 dark:bg-primary/40
                  border border-primary/30 dark:border-primary/60
                  shadow-sm dark:shadow-md
                  transition-all duration-300
                  ${i % 2 === 0 ? 'animate-pulse-slow' : 'animate-pulse-slower'}
                `}
              />
            ))}
          </div>
          
          {/* Main Diamond Outline */}
          <div className={`
            absolute w-40 h-40 border-2
            border-primary/30 dark:border-primary/60
            transform rotate-45
            shadow-lg dark:shadow-xl
          `} />
        </div>

        <h2 className="text-2xl font-bold mb-4 text-primary">{title}</h2>
        <p className="text-base-content/60">{subtitle}</p>
      </div>
    </div>
  );
};

export default AuthImagePattern;