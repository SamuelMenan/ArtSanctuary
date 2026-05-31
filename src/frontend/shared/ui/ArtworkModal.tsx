'use client';

import { createPortal } from 'react-dom';
import SaveToCollectionModal from './SaveToCollectionModal';
import { useArtwork } from './artwork-modal/useArtwork';
import ArtworkMedia from './artwork-modal/ArtworkMedia';
import ArtworkMeta from './artwork-modal/ArtworkMeta';
import ArtworkComments from './artwork-modal/ArtworkComments';
import ArtworkActions from './artwork-modal/ArtworkActions';

interface ArtworkModalProps {
  artworkId: string;
  isOpen: boolean;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  onUpdated?: () => void; // Triggered after edit
}

export default function ArtworkModal({ artworkId, isOpen, onClose, onPrev, onNext, onUpdated }: ArtworkModalProps) {
  const {
    session,
    locale,
    t,
    artwork,
    loading,
    error,
    isLiking,
    isLiked,
    commentText,
    setCommentText,
    isSubmittingComment,
    isEditing,
    setIsEditing,
    editForm,
    setEditForm,
    isSaving,
    isSaved,
    setIsSaved,
    isSavingAction,
    copyFeedback,
    showCollectionsModal,
    setShowCollectionsModal,
    showDeleteConfirm,
    setShowDeleteConfirm,
    isDeleting,
    isMounted,
    isOwner,
    handleLike,
    handleDelete,
    handleSave,
    handleShare,
    handleComment,
    handleSaveEdit,
  } = useArtwork({ artworkId, isOpen, onClose, onUpdated });

  if (!isOpen || !isMounted) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-6 bg-black/90 backdrop-blur-sm animate-in fade-in duration-300">

      {/* Contenedor Principal */}
      <div className="bg-[var(--color-surface-container-lowest)] w-full h-full md:rounded-sm md:h-[90vh] md:max-w-7xl flex flex-col md:flex-row overflow-hidden relative shadow-2xl ring-1 ring-[var(--color-outline-variant)]">

        {/* Botones Flotantes (Cerrar, Nav) */}
        <button onClick={onClose} className="absolute top-4 right-4 z-50 bg-black/50 text-white rounded-full p-2 hover:bg-black transition-colors">
          <span className="material-symbols-outlined text-2xl">close</span>
        </button>
        {onPrev && (
          <button onClick={onPrev} className="absolute left-4 top-1/2 -translate-y-1/2 z-50 bg-black/50 text-white rounded-full p-2 hover:bg-black transition-colors hidden md:block">
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
        )}
        {onNext && (
          <button onClick={onNext} className="absolute right-[31%] top-1/2 -translate-y-1/2 z-50 bg-black/50 text-white rounded-full p-2 hover:bg-black transition-colors hidden md:block">
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        )}

        {loading ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-[var(--color-primary)]">
            <span className="material-symbols-outlined animate-spin text-5xl mb-4">refresh</span>
            <p className="font-mono text-sm uppercase tracking-widest">{t('modal.loadTitle')}</p>
          </div>
        ) : error ? (
          <div className="w-full h-full flex items-center justify-center text-[var(--color-error)]">{error}</div>
        ) : (
          <>
            <ArtworkMedia artwork={artwork} />

            {/* LADO DERECHO: INFO Y SOCIAL (30% en desktop) */}
            <div className="w-full md:w-[30%] h-[50vh] md:h-full flex flex-col bg-[var(--color-surface-container-lowest)] border-l border-[var(--color-outline-variant)]">

              {/* Info Scrollable */}
              <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">

                {/* Header de la obra */}
                <ArtworkMeta
                  artwork={artwork}
                  isEditing={isEditing}
                  setIsEditing={setIsEditing}
                  editForm={editForm}
                  setEditForm={setEditForm}
                  isSaving={isSaving}
                  handleSaveEdit={handleSaveEdit}
                  showDeleteConfirm={showDeleteConfirm}
                  setShowDeleteConfirm={setShowDeleteConfirm}
                  handleDelete={handleDelete}
                  isDeleting={isDeleting}
                  locale={locale}
                  t={t}
                />

                {/* Comentarios (Solo en modo lectura) */}
                {!isEditing && (
                  <ArtworkComments
                    artwork={artwork}
                    session={session}
                    commentText={commentText}
                    setCommentText={setCommentText}
                    isSubmittingComment={isSubmittingComment}
                    handleComment={handleComment}
                    t={t}
                  />
                )}
              </div>

              <ArtworkActions
                artwork={artwork}
                isLiking={isLiking}
                isLiked={isLiked}
                handleLike={handleLike}
                isSaved={isSaved}
                isSavingAction={isSavingAction}
                handleSave={handleSave}
                handleShare={handleShare}
                copyFeedback={copyFeedback}
                isOwner={isOwner}
                isEditing={isEditing}
                setIsEditing={setIsEditing}
                t={t}
              />
            </div>
          </>
        )}
      </div>

      {showCollectionsModal && (
        <SaveToCollectionModal
          artworkId={artworkId}
          onClose={() => setShowCollectionsModal(false)}
          onSavedStatusChange={(status: boolean) => setIsSaved(status)}
        />
      )}
    </div>
  );

  return createPortal(modalContent, document.body);
}
