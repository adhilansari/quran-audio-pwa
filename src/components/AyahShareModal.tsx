import React, { useState } from 'react';
import { X, Share2, Download, Copy, Check, MessageSquare, Loader2, Sparkles, Image as ImageIcon } from 'lucide-react';
import { Surah, Ayah } from '@/types';
import {
  shareAyahImage,
  copyAyahImageToClipboard,
  formatAyahShareText
} from '@/utils/imageGenerator';

interface AyahShareModalProps {
  surah: Surah;
  ayah: Ayah;
  isOpen: boolean;
  onClose: () => void;
}

export const AyahShareModal: React.FC<AyahShareModalProps> = ({
  surah,
  ayah,
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const handleShareImage = async () => {
    try {
      setLoadingAction('image');
      const res = await shareAyahImage(surah, ayah);
      if (res.shared) {
        showToast('സോഷ്യൽ മീഡിയയിൽ ഷെയർ ചെയ്തു!');
      } else if (res.downloaded) {
        showToast('ഇമേജ് വിജയകരമായി ഡൗൺലോഡ് ചെയ്തു!');
      }
    } catch (e) {
      showToast('ഇമേജ് ഷെയർ ചെയ്യാൻ കഴിഞ്ഞില്ല');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleCopyImage = async () => {
    try {
      setLoadingAction('copyImage');
      const copied = await copyAyahImageToClipboard(surah, ayah);
      if (copied) {
        showToast('ഇമേജ് ക്ലിപ്പ്ബോർഡിലേക്ക് കോപ്പി ചെയ്തു!');
      } else {
        showToast('ക്ലിപ്പ്ബോർഡ് കോപ്പി പിന്തുണയ്ക്കുന്നില്ല');
      }
    } catch (e) {
      showToast('ഇമേജ് കോപ്പി പരാജയപ്പെട്ടു');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleCopyText = async () => {
    try {
      setLoadingAction('copyText');
      const text = formatAyahShareText(surah, ayah);
      await navigator.clipboard.writeText(text);
      showToast('ടെക്സ്റ്റ് വിജയകരമായി കോപ്പി ചെയ്തു!');
    } catch (e) {
      showToast('കോപ്പി ചെയ്യാൻ കഴിഞ്ഞില്ല');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleShareText = async () => {
    try {
      setLoadingAction('shareText');
      const text = formatAyahShareText(surah, ayah);
      if (navigator.share) {
        await navigator.share({
          title: `ഖുർആൻ ${surah.malayalamName} (${surah.id}:${ayah.ayah})`,
          text: text
        });
        showToast('ഷെയർ ചെയ്തു!');
      } else {
        await navigator.clipboard.writeText(text);
        showToast('ലിങ്ക് കോപ്പി ചെയ്തു!');
      }
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        showToast('ഷെയർ ചെയ്യാൻ കഴിഞ്ഞില്ല');
      }
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#12201c] w-full max-w-lg rounded-3xl border border-stone-200 dark:border-emerald-950 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-stone-100 dark:border-emerald-950">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-amber-400 flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                ആയത്ത് ഷെയർ ചെയ്യുക
              </h3>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                സൂറത്ത് {surah.malayalamName} • ആയത്ത് {ayah.ayah}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-emerald-950 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Preview Area */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 no-scrollbar">
          {/* Card Preview */}
          <div className="bg-gradient-to-br from-emerald-900 via-emerald-950 to-[#021e17] text-white rounded-2xl p-5 border border-amber-400/30 shadow-md relative overflow-hidden">
            <div className="flex items-center justify-between text-[11px] text-amber-300 font-bold mb-3 pb-2 border-b border-emerald-800/60">
              <span>📖 {surah.malayalamName} ({surah.englishName})</span>
              <span>ആയത്ത് {ayah.ayah} / {surah.ayahCount}</span>
            </div>

            {/* Arabic */}
            <p className="font-arabic text-xl sm:text-2xl text-amber-100 leading-relaxed text-right mb-3">
              {ayah.arabic}
            </p>

            {/* Malayalam */}
            <p className="font-malayalam text-xs sm:text-sm text-stone-200 leading-relaxed pt-2 border-t border-emerald-800/40">
              {ayah.malayalam}
            </p>

            <div className="mt-4 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-stone-400">
              <span>ഖുർആൻ മലയാളം ഓഡിയോ</span>
              <span>mlquran.vercel.app</span>
            </div>
          </div>

          {/* Action Buttons Grid */}
          <div className="space-y-2 pt-1">
            {/* Primary Action: Share Image to Apps */}
            <button
              onClick={handleShareImage}
              disabled={loadingAction !== null}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-800 to-emerald-700 hover:from-emerald-700 hover:to-emerald-600 text-amber-300 font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {loadingAction === 'image' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                  <span>ഇമേജ് തയ്യാറാക്കുന്നു...</span>
                </>
              ) : (
                <>
                  <ImageIcon className="w-4 h-4" />
                  <span>സോഷ്യൽ മീഡിയയിൽ ഇമേജായി ഷെയർ ചെയ്യുക (WhatsApp / Insta)</span>
                </>
              )}
            </button>

            {/* Secondary Actions Row */}
            <div className="grid grid-cols-3 gap-2">
              {/* Copy Image */}
              <button
                onClick={handleCopyImage}
                disabled={loadingAction !== null}
                className="py-2.5 px-3 rounded-xl bg-stone-100 dark:bg-emerald-950/50 hover:bg-stone-200 dark:hover:bg-emerald-950 border border-stone-200 dark:border-emerald-900 text-stone-800 dark:text-stone-200 text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-all"
                title="Copy Image to Clipboard"
              >
                {loadingAction === 'copyImage' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Copy className="w-4 h-4 text-emerald-600 dark:text-amber-400" />
                )}
                <span className="text-[11px]">ഇമേജ് കോപ്പി</span>
              </button>

              {/* Copy Formatted Text */}
              <button
                onClick={handleCopyText}
                disabled={loadingAction !== null}
                className="py-2.5 px-3 rounded-xl bg-stone-100 dark:bg-emerald-950/50 hover:bg-stone-200 dark:hover:bg-emerald-950 border border-stone-200 dark:border-emerald-900 text-stone-800 dark:text-stone-200 text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-all"
                title="Copy Text to Clipboard"
              >
                {loadingAction === 'copyText' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Copy className="w-4 h-4 text-emerald-600 dark:text-amber-400" />
                )}
                <span className="text-[11px]">ടെക്സ്റ്റ് കോപ്പി</span>
              </button>

              {/* Share Text */}
              <button
                onClick={handleShareText}
                disabled={loadingAction !== null}
                className="py-2.5 px-3 rounded-xl bg-stone-100 dark:bg-emerald-950/50 hover:bg-stone-200 dark:hover:bg-emerald-950 border border-stone-200 dark:border-emerald-900 text-stone-800 dark:text-stone-200 text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-all"
                title="Share Plain Text"
              >
                {loadingAction === 'shareText' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <MessageSquare className="w-4 h-4 text-emerald-600 dark:text-amber-400" />
                )}
                <span className="text-[11px]">ടെക്സ്റ്റ് ഷെയർ</span>
              </button>
            </div>
          </div>

          {/* Toast Notification */}
          {successToast && (
            <div className="bg-emerald-800 text-amber-300 text-xs font-bold py-2 px-3 rounded-xl text-center shadow-md animate-in fade-in flex items-center justify-center gap-1.5">
              <Check className="w-3.5 h-3.5" />
              <span>{successToast}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
