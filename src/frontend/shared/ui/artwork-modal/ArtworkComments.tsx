/* eslint-disable @typescript-eslint/no-explicit-any -- 'artwork' es JSON poblado del API con forma dinámica; el tipado estricto cascada sin valor real aquí. */
'use client';

import Image from 'next/image';
import type { Session } from 'next-auth';

interface ArtworkCommentsProps {
  artwork: any;
  session: Session | null;
  commentText: string;
  setCommentText: (v: string) => void;
  isSubmittingComment: boolean;
  handleComment: (e: React.FormEvent) => void;
  t: (key: string) => string;
}

export default function ArtworkComments({
  artwork,
  session,
  commentText,
  setCommentText,
  isSubmittingComment,
  handleComment,
  t,
}: ArtworkCommentsProps) {
  return (
    <div className="mt-8 pt-6 border-t border-[var(--color-outline-variant)]">
      <h4 className="font-sans font-semibold text-sm text-[var(--color-primary)] mb-4 flex items-center justify-between">
        {t('modal.comments')} <span className="text-[var(--color-on-surface-variant)] font-mono text-[10px]">{artwork.comments?.length || 0}</span>
      </h4>

      <div className="space-y-4 mb-4 max-h-[30vh] overflow-y-auto custom-scrollbar pr-2">
        {artwork.comments && artwork.comments.length > 0 ? (
           artwork.comments.map((c: any, idx: number) => (
             <div key={idx} className="bg-[var(--color-surface-container)] p-3 rounded-sm border border-[var(--color-outline-variant)]">
                <div className="flex items-center gap-2 mb-2">
                 {c.userAvatar ? <Image src={c.userAvatar} width={20} height={20} className="size-5 rounded-full object-cover" alt="" /> : <div className="size-5 rounded-full bg-slate-950 flex items-center justify-center text-[8px] text-white">{c.userName?.charAt(0)}</div>}
                 <span className="font-sans text-xs font-semibold text-[var(--color-primary)]">{c.userName}</span>
                 <span className="font-mono text-[8px] text-[var(--color-on-surface-variant)] uppercase">
                   {new Date(c.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                 </span>
               </div>
               <p className="font-sans text-xs text-[var(--color-primary)] opacity-90 break-words">{c.text}</p>
             </div>
           ))
        ) : (
          <p className="text-center font-sans text-xs text-[var(--color-on-surface-variant)] py-4">{t('modal.noComments')}</p>
        )}
      </div>

      {session ? (
        <form onSubmit={handleComment} className="flex gap-2">
          <input
            type="text"
            value={commentText}
            onChange={e => setCommentText(e.target.value)}
            placeholder={t('modal.addComment')}
            className="flex-1 bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)] rounded-sm px-3 py-2 text-xs font-sans focus:border-[var(--color-primary)] outline-none text-[var(--color-primary)]"
          />
          <button disabled={isSubmittingComment || !commentText.trim()} type="submit" className="bg-[var(--color-primary)] text-[var(--color-on-primary)] border border-[var(--color-outline)] shadow-[0_1px_0_var(--color-outline)] px-3 py-2 rounded-sm disabled:opacity-50 hover:bg-[var(--color-primary-container)] transition-colors">
            <span className="material-symbols-outlined text-[16px] block">send</span>
          </button>
        </form>
      ) : (
        <div className="text-center bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)] rounded-sm p-3">
          <p className="font-sans text-xs text-[var(--color-on-surface-variant)]">{t('modal.loginToComment')}</p>
        </div>
      )}
    </div>
  );
}
