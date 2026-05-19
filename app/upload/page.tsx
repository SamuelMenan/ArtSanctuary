'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import { usePreferences } from '@/components/AppPreferencesProvider';

type DateType = "exact" | "year" | "monthyear" | "range" | "approx";

export default function UploadArtworkPage() {
  const router = useRouter();
  const { t, locale } = usePreferences();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    category: 'pintura',
    description: '',
    
    // Creation Date
    dateType: 'year' as DateType,
    dateValue: new Date().getFullYear().toString(),
    dateCertainty: 'confirmed',
    
    // Physical Specs
    medium: '',
    technique: '',
    materials: '',
    
    // Dimensions
    dimWidth: '',
    dimHeight: '',
    dimDepth: '',
    dimUnit: 'cm',
    
    // Other meta
    tags: '',
    visibility: 'public',
    altText: '',
    
    // Rights
    copyrightHolder: '',
    licenseType: 'all-rights-reserved'
  });

  const [showExif, setShowExif] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const processFile = (file: File | undefined) => {
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('La imagen es demasiado grande. Máximo 2MB para esta demo.');
        return;
      }
      setError('');
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        
        // Simular lectura de EXIF
        setTimeout(() => {
          setShowExif(true);
        }, 800);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFile(e.target.files?.[0]);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    processFile(e.dataTransfer.files?.[0]);
  };

  const applyExif = () => {
    setFormData(prev => ({
      ...prev,
      dateType: 'exact',
      dateValue: '2023-11-15',
      dimWidth: '80',
      dimHeight: '120',
      copyrightHolder: 'Elena Rossi'
    }));
    setShowExif(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!imagePreview) {
      setError(t('upload.noImage'));
      setLoading(false);
      return;
    }

    try {
      // Parsear arrays y objetos
      const materialsArray = formData.materials.split(',').map(m => m.trim()).filter(Boolean);
      const tagsArray = formData.tags.split(',').map(t => t.trim()).filter(Boolean);

      // Usar una URL de Unsplash como imagen en lugar de base64
      const unsplashUrl = `https://picsum.photos/600/400?random=${Date.now()}`;
      
      const payload = {
        title: formData.title,
        imageUrl: unsplashUrl,
        description: formData.description,
        category: formData.category,
        
        creationDate: {
          type: formData.dateType,
          value: formData.dateValue,
          certainty: formData.dateCertainty
        },
        
        medium: formData.medium,
        technique: formData.technique,
        materials: materialsArray,
        
        dimensions: {
          width: parseFloat(formData.dimWidth) || undefined,
          height: parseFloat(formData.dimHeight) || undefined,
          depth: parseFloat(formData.dimDepth) || undefined,
          unit: formData.dimUnit
        },
        
        visibility: formData.visibility,
        altText: formData.altText,
        
        licenseRights: {
          copyrightHolder: formData.copyrightHolder,
          licenseType: formData.licenseType
        },
        
        tags: tagsArray
      };

      const response = await fetch('/api/artworks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al subir la obra');
      }

      router.push('/profile');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="w-full max-w-6xl mx-auto py-10 px-4 md:px-0 pb-24">
        <div className="mb-10 border-b border-[var(--color-outline-variant)] pb-6">
          <h1 className="font-sans font-bold text-3xl md:text-4xl text-[var(--color-primary)] tracking-tight mb-2">{t('upload.registerTitle')}</h1>
          <p className="font-sans text-[var(--color-on-surface-variant)] text-sm md:text-base">
            {t('upload.description')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-12">
          
          {/* COLUMNA IZQUIERDA: IMAGEN */}
          <div className="w-full lg:w-2/5 flex flex-col gap-6">
            <div className="sticky top-24">
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`w-full aspect-[4/5] border ${isDragging ? 'border-[var(--color-primary)] bg-[var(--color-surface-container)]' : 'border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)]'} rounded-sm flex flex-col items-center justify-center relative overflow-hidden group ${!imagePreview ? 'border-dashed hover:border-[var(--color-primary)] cursor-pointer transition-colors' : ''}`}
              >
                {imagePreview ? (
                  <>
                    <Image src={imagePreview} alt="Preview" width={400} height={400} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-background/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <label className="font-mono text-[var(--text-label-sm)] uppercase tracking-widest text-[var(--color-primary)] border border-[var(--color-primary)] px-6 py-2 cursor-pointer hover:bg-[var(--color-primary)] hover:text-[var(--color-on-primary)] transition-colors">
                        {t('upload.changeImage')}
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                      </label>
                    </div>
                  </>
                ) : (
                  <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer p-6 text-center">
                    <span className="material-symbols-outlined text-4xl text-[var(--color-on-surface-variant)] mb-4">add_photo_alternate</span>
                    <span className="font-mono text-[var(--text-label-sm)] uppercase tracking-widest text-[var(--color-primary)] mb-2">{t('upload.selectFile')}</span>
                    <span className="font-sans text-xs text-[var(--color-on-surface-variant)]">{t('upload.fileInfo')}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                  </label>
                )}
              </div>
              
              {/* Bloque EXIF Simulado */}
              {showExif && (
                <div className="mt-4 p-4 border border-[var(--color-primary)] bg-[var(--color-primary)]/5 rounded-sm animate-pulse">
                  <h4 className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-primary)] mb-2 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                    {t('upload.exifDetected')}
                  </h4>
                  <ul className="text-xs font-sans text-[var(--color-on-surface-variant)] mb-3 space-y-1">
                    <li><strong>Fecha:</strong> 15 Nov 2023</li>
                    <li><strong>Cámara:</strong> Sony A7III</li>
                    <li><strong>Perfil Color:</strong> sRGB</li>
                  </ul>
                  <button type="button" onClick={applyExif} className="w-full border border-[var(--color-primary)] text-[var(--color-primary)] font-mono text-[10px] uppercase py-2 hover:bg-[var(--color-primary)] hover:text-black transition-colors">
                    {t('upload.autofill')}
                  </button>
                </div>
              )}

              {error && <p className="font-sans text-sm text-[var(--color-error)] mt-4">{error}</p>}

              <div className="mt-6 p-4 bg-[var(--color-surface-container)] rounded-sm">
                <p className="font-mono text-[10px] text-[var(--color-on-surface-variant)] uppercase tracking-widest flex items-center gap-2">
                  <span className="material-symbols-outlined text-[14px]">info</span>
                  {t('upload.loadDate')}
                </p>
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA: METADATOS */}
          <div className="w-full lg:w-3/5 flex flex-col gap-8">
            
            {/* SECCIÓN 1: IDENTIFICACIÓN PRINCIPAL */}
            <section className="space-y-6 border border-[var(--color-surface-container-high)] p-6 rounded-sm bg-[var(--color-surface-container-lowest)]">
              <h2 className="font-sans font-semibold text-lg text-[var(--color-primary)] flex items-center gap-2 border-b border-[var(--color-surface-container-high)] pb-2">
                <span className="material-symbols-outlined">label</span> {t('upload.identification')}
              </h2>
              
              <div className="space-y-2">
                <label className="font-mono text-[var(--text-label-sm)] uppercase tracking-widest text-[var(--color-on-surface-variant)]">{t('upload.title')}</label>
                <input 
                  type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
                  className="w-full bg-[var(--color-surface-container)] border border-[var(--color-surface-container-high)] rounded-sm px-4 py-3 text-[var(--color-primary)] focus:outline-none focus:border-[var(--color-primary)] transition-colors font-sans"
                  placeholder="Ej. Ecos del Silencio"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="font-mono text-[var(--text-label-sm)] uppercase tracking-widest text-[var(--color-on-surface-variant)]">{t('upload.category')}</label>
                  <select 
                    value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}
                    className="w-full bg-[var(--color-surface-container)] border border-[var(--color-surface-container-high)] rounded-sm px-4 py-3 text-[var(--color-primary)] focus:outline-none focus:border-[var(--color-primary)] transition-colors font-sans appearance-none cursor-pointer"
                  >
                    <option value="pintura">Pintura</option>
                    <option value="escultura">Escultura</option>
                    <option value="ilustracion">Ilustración</option>
                    <option value="fotografia">Fotografía</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="font-mono text-[var(--text-label-sm)] uppercase tracking-widest text-[var(--color-on-surface-variant)]">{t('upload.visibility')}</label>
                  <select 
                    value={formData.visibility} onChange={e => setFormData({...formData, visibility: e.target.value})}
                    className="w-full bg-[var(--color-surface-container)] border border-[var(--color-surface-container-high)] rounded-sm px-4 py-3 text-[var(--color-primary)] focus:outline-none focus:border-[var(--color-primary)] transition-colors font-sans appearance-none cursor-pointer"
                  >
                    <option value="public">{t('upload.public')}</option>
                    <option value="unlisted">{t('upload.unlisted')}</option>
                    <option value="private">{t('upload.private')}</option>
                  </select>
                </div>
              </div>
            </section>

            {/* SECCIÓN 2: FECHA DE CREACIÓN */}
            <section className="space-y-6 border border-[var(--color-surface-container-high)] p-6 rounded-sm bg-[var(--color-surface-container-lowest)]">
              <h2 className="font-sans font-semibold text-lg text-[var(--color-primary)] flex items-center gap-2 border-b border-[var(--color-surface-container-high)] pb-2">
                <span className="material-symbols-outlined">calendar_month</span> {t('upload.createDate')}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="font-mono text-[var(--text-label-sm)] uppercase tracking-widest text-[var(--color-on-surface-variant)]">{t('upload.format')}</label>
                  <select 
                    value={formData.dateType} onChange={e => setFormData({...formData, dateType: e.target.value as DateType})}
                    className="w-full bg-[var(--color-surface-container)] border border-[var(--color-surface-container-high)] rounded-sm px-4 py-3 text-[var(--color-primary)] focus:outline-none focus:border-[var(--color-primary)] transition-colors font-sans appearance-none cursor-pointer"
                  >
                    <option value="year">{t('upload.year')}</option>
                    <option value="exact">{t('upload.exact')}</option>
                    <option value="monthyear">{t('upload.monthyear')}</option>
                    <option value="range">{t('upload.range')}</option>
                    <option value="approx">{t('upload.approx')}</option>
                  </select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="font-mono text-[var(--text-label-sm)] uppercase tracking-widest text-[var(--color-on-surface-variant)]">{t('upload.value')}</label>
                  <input 
                    type={formData.dateType === 'exact' ? 'date' : 'text'}
                    value={formData.dateValue} onChange={e => setFormData({...formData, dateValue: e.target.value})}
                    className="w-full bg-[var(--color-surface-container)] border border-[var(--color-surface-container-high)] rounded-sm px-4 py-3 text-[var(--color-primary)] focus:outline-none focus:border-[var(--color-primary)] transition-colors font-sans"
                    placeholder={formData.dateType === 'range' ? "Ej. 2020-2023" : formData.dateType === 'approx' ? "Ej. c. 1998" : "Ej. 2024"}
                  />
                </div>
              </div>
            </section>

            {/* SECCIÓN 3: ESPECIFICACIONES FÍSICAS */}
            <section className="space-y-6 border border-[var(--color-surface-container-high)] p-6 rounded-sm bg-[var(--color-surface-container-lowest)]">
              <h2 className="font-sans font-semibold text-lg text-[var(--color-primary)] flex items-center gap-2 border-b border-[var(--color-surface-container-high)] pb-2">
                <span className="material-symbols-outlined">architecture</span> Especificaciones Físicas
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="font-mono text-[var(--text-label-sm)] uppercase tracking-widest text-[var(--color-on-surface-variant)]">Soporte/Medio</label>
                  <input 
                    type="text" value={formData.medium} onChange={e => setFormData({...formData, medium: e.target.value})}
                    className="w-full bg-[var(--color-surface-container)] border border-[var(--color-surface-container-high)] rounded-sm px-4 py-3 text-[var(--color-primary)] focus:outline-none focus:border-[var(--color-primary)] transition-colors font-sans"
                    placeholder="Ej. Óleo sobre lienzo"
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-mono text-[var(--text-label-sm)] uppercase tracking-widest text-[var(--color-on-surface-variant)]">Técnica</label>
                  <input 
                    type="text" value={formData.technique} onChange={e => setFormData({...formData, technique: e.target.value})}
                    className="w-full bg-[var(--color-surface-container)] border border-[var(--color-surface-container-high)] rounded-sm px-4 py-3 text-[var(--color-primary)] focus:outline-none focus:border-[var(--color-primary)] transition-colors font-sans"
                    placeholder="Ej. Pincel y espátula"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="font-mono text-[var(--text-label-sm)] uppercase tracking-widest text-[var(--color-on-surface-variant)]">Dimensiones</label>
                <div className="flex gap-2">
                  <input type="number" placeholder="Ancho" value={formData.dimWidth} onChange={e => setFormData({...formData, dimWidth: e.target.value})} className="w-1/4 bg-[var(--color-surface-container)] border border-[var(--color-surface-container-high)] rounded-sm px-4 py-3 text-[var(--color-primary)] focus:outline-none focus:border-[var(--color-primary)] font-sans text-center" />
                  <span className="text-[var(--color-on-surface-variant)] flex items-center">x</span>
                  <input type="number" placeholder="Alto" value={formData.dimHeight} onChange={e => setFormData({...formData, dimHeight: e.target.value})} className="w-1/4 bg-[var(--color-surface-container)] border border-[var(--color-surface-container-high)] rounded-sm px-4 py-3 text-[var(--color-primary)] focus:outline-none focus:border-[var(--color-primary)] font-sans text-center" />
                  <span className="text-[var(--color-on-surface-variant)] flex items-center">x</span>
                  <input type="number" placeholder="Profundidad" value={formData.dimDepth} onChange={e => setFormData({...formData, dimDepth: e.target.value})} className="w-1/4 bg-[var(--color-surface-container)] border border-[var(--color-surface-container-high)] rounded-sm px-4 py-3 text-[var(--color-primary)] focus:outline-none focus:border-[var(--color-primary)] font-sans text-center" />
                  <select value={formData.dimUnit} onChange={e => setFormData({...formData, dimUnit: e.target.value})} className="w-1/4 bg-[var(--color-surface-container)] border border-[var(--color-surface-container-high)] rounded-sm px-2 py-3 text-[var(--color-primary)] focus:outline-none focus:border-[var(--color-primary)] font-sans text-center cursor-pointer">
                    <option value="cm">cm</option>
                    <option value="in">pulgadas</option>
                  </select>
                </div>
              </div>
            </section>

            {/* SECCIÓN 4: CONTEXTO Y DERECHOS */}
            <section className="space-y-6 border border-[var(--color-surface-container-high)] p-6 rounded-sm bg-[var(--color-surface-container-lowest)]">
              <h2 className="font-sans font-semibold text-lg text-[var(--color-primary)] flex items-center gap-2 border-b border-[var(--color-surface-container-high)] pb-2">
                <span className="material-symbols-outlined">gavel</span> Contexto y Derechos
              </h2>

              <div className="space-y-2">
                <label className="font-mono text-[var(--text-label-sm)] uppercase tracking-widest text-[var(--color-on-surface-variant)]">Descripción Curatorial</label>
                <textarea 
                  rows={4} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-[var(--color-surface-container)] border border-[var(--color-surface-container-high)] rounded-sm px-4 py-3 text-[var(--color-primary)] focus:outline-none focus:border-[var(--color-primary)] transition-colors font-sans resize-none"
                  placeholder="Contexto o concepto detrás de la obra..."
                ></textarea>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="font-mono text-[var(--text-label-sm)] uppercase tracking-widest text-[var(--color-on-surface-variant)]">Etiquetas (Separadas por comas)</label>
                  <input 
                    type="text" value={formData.tags} onChange={e => setFormData({...formData, tags: e.target.value})}
                    className="w-full bg-[var(--color-surface-container)] border border-[var(--color-surface-container-high)] rounded-sm px-4 py-3 text-[var(--color-primary)] focus:outline-none focus:border-[var(--color-primary)] transition-colors font-sans"
                    placeholder="paisaje, oscuro, melancolía"
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-mono text-[var(--text-label-sm)] uppercase tracking-widest text-[var(--color-on-surface-variant)]">Licencia</label>
                  <select 
                    value={formData.licenseType} onChange={e => setFormData({...formData, licenseType: e.target.value})}
                    className="w-full bg-[var(--color-surface-container)] border border-[var(--color-surface-container-high)] rounded-sm px-4 py-3 text-[var(--color-primary)] focus:outline-none focus:border-[var(--color-primary)] transition-colors font-sans appearance-none cursor-pointer"
                  >
                    <option value="all-rights-reserved">Todos los derechos reservados</option>
                    <option value="cc-by">Creative Commons (CC-BY)</option>
                    <option value="cc-by-nc">Creative Commons No Comercial (CC-BY-NC)</option>
                  </select>
                </div>
              </div>
            </section>

            <div className="pt-4 flex justify-end">
              <button 
                type="submit"
                disabled={loading}
                className="w-full md:w-auto bg-[var(--color-primary)] text-[var(--color-on-primary)] border border-[var(--color-outline)] shadow-[0_1px_0_var(--color-outline)] font-mono text-xs uppercase tracking-widest px-12 py-4 rounded-sm hover:bg-[var(--color-primary-container)] transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin">refresh</span>
                    {t('common.loading')}
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">publish</span>
                    {t('upload.submit')}
                  </>
                )}
              </button>
            </div>

          </div>
        </form>
      </div>
    </AppShell>
  );
}
