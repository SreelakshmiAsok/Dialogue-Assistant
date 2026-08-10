"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const FRIENDS = [
  {
    id: "pip",
    name: "Pip",
    alt: "A soft minimalist, flat vector illustration of a friendly owl character.",
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuBkpUfWCzemuxMBlbORAWCxxg753JAGseJcDwO7shyRueEmRhKbqKD2EwWaVZWOKTV7DXAvasDfC7ZDTK8l0k1nP1LySIjs4c6-FjayjQSuEq6SSM_8QYSTTZe0sqwRUa49Xu64-3xPZ2BAIUL533hF-PQru0fFhYce2vtU1_ssFg5-3UVW-9Z2nwloKAXp1xKw_5l65aAaj2lgHaGODj1H0DIH1qopMghrrAwMdIa_NYEb0Xjmhg5FCw",
  },
  {
    id: "robo",
    name: "Robo",
    alt: "A soft minimalist, flat vector illustration of a gentle robot character.",
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuAiSYE1gxZUHr4IHr7eAS--p_WEeP8htWs9YpmOl6vL-lhcUvfsS9dJ1AYRLn-j9-lHAg2_4RyK1LA8GqXmP5s1OzTk9W2scO3JcnAjlObOfUcEFQr6dCwfclfsdqEfhhFnsX8WUWNHpr_iq4q2FtEIPmvnv3jpAPBz3bItPe019B3QAprph7tlF6zP63zCMiNui85zLvJ4Zg2wbbXR3SiYsQc3oe6Wo1W2X1GiA2z1268CsbE49kS00Q",
  },
  {
    id: "luna",
    name: "Luna",
    alt: "A soft minimalist, flat vector illustration of a calm cat character.",
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuBVH095893TT0go6tK4mNtcRR7ide8nz7nfcP_AZZiIHojucA4tuap4uKSqFVoRDOyJ7RcirS6Ss7Bx4kUYp2HkmwPfgH6qsmiKCziMevsdWSSCUTw-Ae3gi-C5FNSc-tsmrqD1yogEzNI83ewWE7cQxpmEMhMolMlAXlUAsAFneIXdcmuWA3gtzt_KHDGD5OV_oakZOC-PymvtuMSaSvnJ3qpjjg6J7dhHkjFk9QTASBXyPXDrWp3OYA",
  },
  {
    id: "balo",
    name: "Balo",
    alt: "A soft minimalist, flat vector illustration of a comforting bear character.",
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuAP6Tej6fJ0yyxVFZ5MhVoNUacGIqbioCDLTSGCznCx5IqpbNt6hCnFa0CkU5_6-qAGyP_3po-kzEqc0ouJE1b6u0agARC-FyxFJMTmQ1imwmSff_jg0ObMSqvdiKlXcCA93XBS7MuLdCBY8xfWEo13eCoYNfz8Vj_EsJrRnhIbZN1ODn_XX54O3zX13zZ_k6fpvjjrh1kw_RA61KmBGqs0lYhNuPvjfco90fU4Ry2ur09hYdaGbhaJRA",
  },
];

export default function ChooseAFriend() {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string>("robo"); // Default selected as per prototype

  const handleContinue = () => {
    // In real app, save choice and proceed
    router.push("/path");
  };

  return (
    <div className="bg-background text-on-background min-h-screen font-sans antialiased overflow-x-hidden selection:bg-primary-container selection:text-on-primary-container">
      <main className="min-h-screen flex flex-col items-center justify-center relative px-6 md:px-20 py-safe pb-32">
        <header className="text-center mb-12 w-full max-w-4xl mx-auto flex flex-col items-center gap-2">
          <h1 className="text-[32px] leading-[44px] md:text-[48px] md:leading-[64px] font-bold text-primary">Pick your friend</h1>
          <p className="text-[20px] leading-[32px] text-on-surface-variant max-w-2xl">Who do you want to learn with today?</p>
        </header>

        {/* Bento Grid for Avatars */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full max-w-4xl mx-auto">
          {FRIENDS.map((friend) => {
            const isSelected = selectedId === friend.id;
            return (
              <button
                key={friend.id}
                aria-label={`Select ${friend.name}`}
                onClick={() => setSelectedId(friend.id)}
                className={`group flex flex-col items-center justify-center p-6 rounded-[32px] transition-all duration-300 active:scale-95 focus:outline-none focus:ring-4 focus:ring-primary-container focus:ring-offset-4 focus:ring-offset-background hover:bg-surface-container-high relative
                  ${isSelected ? 'bg-surface-container-high ring-4 ring-primary shadow-glow' : 'bg-surface-container'}
                `}
              >
                <div className={`w-full aspect-square mb-6 relative overflow-hidden rounded-full border-4 transition-colors ${
                  isSelected ? 'border-primary' : 'border-transparent group-focus:border-primary group-hover:border-outline-variant'
                }`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    className="w-full h-full object-cover"
                    alt={friend.alt}
                    src={friend.src}
                  />
                </div>
                <span className={`text-[24px] font-semibold leading-[32px] ${isSelected ? 'text-primary' : 'text-on-surface'}`}>
                  {friend.name}
                </span>

                {/* Selection Indicator */}
                {isSelected && (
                  <div className="absolute top-4 right-4 bg-primary text-on-primary rounded-full p-2 flex items-center justify-center shadow-sm transition-transform animate-in zoom-in">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </main>

      {/* Fixed Continue Button Area */}
      <div className="fixed bottom-0 left-0 w-full bg-surface/90 backdrop-blur-md p-6 border-t border-surface-variant flex justify-center z-50 animate-in slide-in-from-bottom">
        <button 
          onClick={handleContinue}
          className="w-full max-w-md h-[64px] bg-primary text-on-primary text-[24px] font-semibold rounded-full flex items-center justify-center gap-2 hover:bg-surface-tint active:scale-95 transition-all focus:outline-none focus:ring-4 focus:ring-primary-container focus:ring-offset-2 focus:ring-offset-surface shadow-sm"
        >
          Continue
          <span className="material-symbols-outlined">arrow_forward</span>
        </button>
      </div>
    </div>
  );
}
