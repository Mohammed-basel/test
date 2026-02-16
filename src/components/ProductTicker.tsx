@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;900&display=swap');
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    font-family: 'Tajawal', sans-serif;
  }
}

/* Not a Tailwind class, keep it normal (or move it into utilities if you want) */
.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

/* Keyframes (best outside layers) */
@keyframes pulse-glow {
  0%, 100% { opacity: 0.2; transform: scaleX(1); }
  50% { opacity: 0.4; transform: scaleX(1.05); }
}

@keyframes gentle-pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.02); opacity: 0.9; }
}

@layer utilities {
  .custom-scrollbar::-webkit-scrollbar {
    width: 8px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #3b82f6;
    border-radius: 10px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #2563eb;
  }
  .animate-pulse-glow {
    animation: pulse-glow 2s ease-in-out infinite;
  }
  .animate-gentle-pulse {
    animation: gentle-pulse 2s ease-in-out infinite;
  }
  
  .ticker-viewport {
    width: 100%;
    overflow: hidden;
    display: flex;
    align-items: center;
    direction: rtl; 
  }
  
  .ticker-track {
    display: flex;
    width: max-content; 
    flex-shrink: 0;
    white-space: nowrap;
  }
  
  /* ✅ Only animate when NOT being dragged */
  .ticker-viewport:not(.is-dragging) .ticker-track {
    animation: ticker-marquee-rtl 60s linear infinite;
  }
  
  @keyframes ticker-marquee-rtl {
    0% {
      transform: translateX(0);
    }
    100% {
      /* Moves content to the right for RTL flow */
      transform: translateX(50%);
    }
  }
  
  /* ✅ Pause animation on hover */
  .ticker-viewport:hover .ticker-track {
    animation-play-state: paused;
  }
}
