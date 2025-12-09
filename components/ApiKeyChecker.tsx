import React, { useEffect, useState } from 'react';
import { Key } from 'lucide-react';

interface ApiKeyCheckerProps {
  onKeyValid: () => void;
}

export const ApiKeyChecker: React.FC<ApiKeyCheckerProps> = ({ onKeyValid }) => {
  const [hasKey, setHasKey] = useState<boolean>(false);
  const [checking, setChecking] = useState<boolean>(true);

  const checkKey = async () => {
    try {
      if ((window as any).aistudio && (window as any).aistudio.hasSelectedApiKey) {
        const has = await (window as any).aistudio.hasSelectedApiKey();
        setHasKey(has);
        if (has) {
          onKeyValid();
        }
      } else {
        // Fallback for dev environments where window.aistudio might not be present (mock)
        // In a real strict environment we might want to block, but for safety in dev:
        console.warn("window.aistudio not found, assuming dev environment or pre-set key");
        if (process.env.API_KEY) {
            setHasKey(true);
            onKeyValid();
        }
      }
    } catch (e) {
      console.error("Error checking API key", e);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkKey();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectKey = async () => {
    if ((window as any).aistudio && (window as any).aistudio.openSelectKey) {
      await (window as any).aistudio.openSelectKey();
      // Assume success after closing dialog, re-check
      checkKey();
    } else {
      alert("API Key selection not available in this environment.");
    }
  };

  if (checking) return null; // Or a spinner

  if (hasKey) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl text-center">
        <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Key className="w-8 h-8 text-indigo-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">API Key Required</h2>
        <p className="text-zinc-400 mb-8">
          To use the advanced Garmony features like High-Res Image Generation and Vocal Synthesis, you need to connect your Google AI Studio account.
        </p>
        
        <button
          onClick={handleSelectKey}
          className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
        >
          <Key className="w-4 h-4" />
          Select API Key
        </button>
      </div>
    </div>
  );
};