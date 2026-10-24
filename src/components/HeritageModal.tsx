import React from 'react';
import { X, Award, Sparkles, BookOpen, Film, Clapperboard, Globe2, Flame } from 'lucide-react';
import { NOL_CULTURE_FACTS } from '../data/heritage';

interface HeritageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HeritageModal: React.FC<HeritageModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div 
        id="heritage-modal-container"
        className="relative w-full max-w-3xl bg-[#0e131d] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-cinema text-lg sm:text-xl font-bold text-white tracking-wide">
                Nollywood Cinema Heritage & Milestones
              </h2>
              <p className="text-xs text-slate-400">
                The story of the world's most vibrant grassroots film revolution
              </p>
            </div>
          </div>
          <button
            id="close-heritage-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto p-6 space-y-6 flex-1 text-sm text-slate-300">
          
          {/* Key Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {NOL_CULTURE_FACTS.map((fact, idx) => (
              <div key={idx} className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 space-y-1">
                <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                  {fact.title}
                </span>
                <p className="text-lg font-extrabold text-white font-cinema">
                  {fact.stat}
                </p>
                <p className="text-[11px] text-slate-400 leading-tight">
                  {fact.description}
                </p>
              </div>
            ))}
          </div>

          {/* Three Eras of Nollywood timeline */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Clapperboard className="w-4 h-4 text-emerald-400" />
              The Three Epochs of Nigerian Cinema
            </h3>

            <div className="space-y-3">
              {/* Epoch 1 */}
              <div className="border-l-2 border-amber-500 pl-4 py-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">1992 - 2005</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 font-semibold">The Video Cassette (VHS) Pioneer Era</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Ignited by Kenneth Nnebue’s <em>Living in Bondage (1992)</em>. Nigerian filmmakers bypassed expensive traditional celluloid gear to shoot directly on camcorders, replicating tapes across the Alaba International Market in Lagos. This era produced nostalgic classics like <em>Domitilla</em>, <em>Osuofia in London</em>, <em>Saworoide</em>, and <em>Aki na Ukwa</em>.
                </p>
              </div>

              {/* Epoch 2 */}
              <div className="border-l-2 border-emerald-500 pl-4 py-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">2006 - 2018</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 font-semibold">The Modern Multiplex Revolution ("New Nollywood")</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Filmmakers like Kunle Afolayan (<em>The Figurine</em>, <em>October 1</em>) and Kemi Adetiba (<em>The Wedding Party</em>, <em>King of Boys</em>) championed high-definition digital cinema, theater multiplex distribution (Silverbird & Filmhouse), and major corporate brand integrations.
                </p>
              </div>

              {/* Epoch 3 */}
              <div className="border-l-2 border-blue-500 pl-4 py-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">2019 - Present</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 font-semibold">The Global Streaming & Billion-Naira Era</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Nollywood has gone worldwide. In 2023, <em>A Tribe Called Judah</em> made history as the first movie to surpass ₦1.44 Billion in local cinemas, while <em>The Black Book</em>, <em>Aníkúlápó</em>, and <em>Jagun Jagun</em> conquered the Netflix and Prime Video global top 10 charts across Latin America, the US, and Europe.
                </p>
              </div>
            </div>
          </div>

          {/* Regional Cinema Traditions */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Globe2 className="w-4 h-4" />
              Indigenous Cinema Ecosystems
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <strong className="text-white block mb-1">Yoruba Cinema</strong>
                <p className="text-slate-400">Renowned for mystical folklore, philosophical dialogue, historical epics, and rich theatre traditions stemming from Hubert Ogunde.</p>
              </div>
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <strong className="text-white block mb-1">Igbo Cinema</strong>
                <p className="text-slate-400">The founding bedrock of commercial Nollywood, celebrated for business dramas, supernatural moral tales, family sagas, and epic comedies.</p>
              </div>
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <strong className="text-white block mb-1">Kannywood (Hausa Cinema)</strong>
                <p className="text-slate-400">Based in Kano and Northern Nigeria, distinguished by poetic romance, Northern cultural values, and melodic musical scores.</p>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-900 border-t border-slate-800 text-center">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs tracking-wider uppercase transition-colors"
          >
            Back to Movie Catalogue
          </button>
        </div>

      </div>
    </div>
  );
};
