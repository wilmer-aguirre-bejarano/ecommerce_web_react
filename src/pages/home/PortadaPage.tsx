import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  ImageIcon as Image,
  Link2,
  Mail,
  MapPin,
  Megaphone,
  Newspaper,
  Phone,
} from 'lucide-react';
import { format } from 'date-fns';
import { publicImageUrl } from '../../lib/images';
import { supabase } from '../../lib/supabase';
import type { CarouselSlide, News, Promotion } from '../../types/database';

type Status = 'loading' | 'ready' | 'error';

const settingKeys = [
  'institution_name',
  'address',
  'phone',
  'email',
  'facebook',
  'twitter',
  'instagram',
  'about',
] as const;

const settingDefaults: Record<(typeof settingKeys)[number], string> = {
  institution_name: 'Nuestra institución',
  address: 'Dirección institucional',
  phone: '',
  email: '',
  facebook: '',
  twitter: '',
  instagram: '',
  about: '',
};

export default function PortadaPage() {
  const [slides, setSlides] = useState<CarouselSlide[]>([]);
  const [news, setNews] = useState<News[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [settings, setSettings] =
    useState<Record<(typeof settingKeys)[number], string>>(settingDefaults);
  const [activeSlide, setActiveSlide] = useState(0);
  const [status, setStatus] = useState<Status>('loading');

  useEffect(() => {
    let active = true;

    Promise.all([
      supabase
        .from('carousel_slides')
        .select('*')
        .eq('active', true)
        .order('sort_order', { ascending: true }),
      supabase
        .from('news')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(6),
      supabase
        .from('promotions')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false })
        .limit(4),
      supabase.from('site_settings').select('key, value').in('key', [...settingKeys]),
    ]).then(([slidesResult, newsResult, promotionsResult, settingsResult]) => {
      if (!active) return;
      if (slidesResult.error || newsResult.error || promotionsResult.error || settingsResult.error) {
        setStatus('error');
        return;
      }

      const rows = (settingsResult.data ?? []) as { key: string; value: string | null }[];
      const next = { ...settingDefaults };
      for (const row of rows) {
        const key = row.key as (typeof settingKeys)[number];
        if (key in next) next[key] = row.value ?? '';
      }

      setSlides((slidesResult.data ?? []) as CarouselSlide[]);
      setNews((newsResult.data ?? []) as News[]);
      setPromotions((promotionsResult.data ?? []) as Promotion[]);
      setSettings(next);
      setStatus('ready');
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (slides.length <= 1) return;
    const id = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % slides.length);
    }, 5000);
    return () => window.clearInterval(id);
  }, [slides.length]);

  const socialLinks = [
    { label: 'Facebook', url: settings.facebook },
    { label: 'Twitter / X', url: settings.twitter },
    { label: 'Instagram', url: settings.instagram },
  ].filter((link) => link.url);

  return (
    <div className="mx-auto w-full  px-4 py-6">
      {status === 'loading' && (
        <div className="alert alert-info d-flex align-items-center" role="alert">
          <i className="bi bi-hourglass-split me-2" />
          Cargando portada...
        </div>
      )}

      {status === 'error' && (
        <div className="alert alert-danger d-flex align-items-center" role="alert">
          <i className="bi bi-exclamation-triangle me-2" />
          No se pudo cargar la portada. Revisa la configuración de Supabase (.env).
        </div>
      )}

      {status === 'ready' && (
        <>
          {slides.length > 0 ? (
            <div
              className="relative overflow-hidden rounded-2xl"
              style={{
                background: 'linear-gradient(90deg,#0f172a 0%,#1f2937 100%)',
                boxShadow: '0 10px 40px rgba(15,23,42,0.15)',
              }}
            >
              <div
                className="flex transition-transform duration-500"
                style={{ transform: `translateX(-${activeSlide * 100}%)` }}
              >
                {slides.map((slide) => {
                  const src = publicImageUrl(slide.image);
                  return (
                    <div key={slide.id} className="relative w-full shrink-0">
                      {src ? (
                        <img
                          src={src}
                          alt={slide.title ?? ''}
                          className="h-80 w-full object-cover sm:h-[420px]"
                        />
                      ) : (
                        <div className="flex h-80 items-center justify-center bg-slate-900 sm:h-[420px]">
                          <Image className="h-10 w-10 text-slate-600" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 p-8 text-white">
                        {slide.title && (
                          <h2 className="mb-2 text-3xl font-semibold sm:text-4xl">{slide.title}</h2>
                        )}
                        {slide.subtitle && (
                          <p className="mt-2 max-w-2xl text-base text-slate-200 sm:text-lg">{slide.subtitle}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {slides.length > 1 && (
                <>
                  <button
                    type="button"
                    aria-label="Anterior"
                    onClick={() =>
                      setActiveSlide((current) => (current - 1 + slides.length) % slides.length)
                    }
                    className="btn btn-outline-light btn-xl absolute left-4 top-1/2 -translate-y-1/2"
                    style={{ background: 'rgba(255,255,255,0.25)', borderColor: 'rgba(255,255,255,0.5)', color: '#fff' }}
                  >
                    <i className="bi bi-chevron-left" />
                  </button>
                  <button
                    type="button"
                    aria-label="Siguiente"
                    onClick={() => setActiveSlide((current) => (current + 1) % slides.length)}
                    className="btn btn-outline-light btn-xl absolute right-4 top-1/2 -translate-y-1/2"
                    style={{ background: 'rgba(255,255,255,0.25)', borderColor: 'rgba(255,255,255,0.5)', color: '#fff' }}
                  >
                    <i className="bi bi-chevron-right" />
                  </button>
                  <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">
                    {slides.map((slide, index) => (
                      <button
                        key={slide.id}
                        type="button"
                        aria-label={`Ir al slide ${index + 1}`}
                        onClick={() => setActiveSlide(index)}
                        className={`h-2 rounded-full ${index === activeSlide ? 'w-6 bg-white' : 'w-2 bg-white/50'}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            <section
              className="rounded-2xl px-5 py-12 text-white"
              style={{ background: 'linear-gradient(90deg,#0f172a 0%,#1f2937 100%)' }}
            >
              <p className="text-uppercase small mb-1" style={{ color: '#cbd5e1' }}>
                Portada
              </p>
              <h1 className="mb-2">{settings.institution_name}</h1>
              <p className="mb-0" style={{ maxWidth: '40rem', color: '#cbd5e1' }}>
                El administrador todavía no publicó diapositivas para el carrusel.
              </p>
              <div className="mt-4 d-flex flex-wrap gap-2">
                <Link to="/tienda" className="btn btn-light">
                  <i className="bi bi-grid" />
                  Ver catálogo
                </Link>
              </div>
            </section>
          )}

          <section className="mt-8 grid gap-6 lg:grid-cols-[300px_1fr]">
            <aside className="space-y-4">
              <div className="card">
                <div className="card-body">
                <div className="flex items-center gap-2 text-slate-900">
                  <Building2 className="h-5 w-5" />
                  <h2 className="font-medium">{settings.institution_name}</h2>
                </div>
                <dl className="mt-3 space-y-2 text-sm text-slate-600">
                  <div className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                    <span>{settings.address}</span>
                  </div>
                  {settings.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 shrink-0 text-slate-400" />
                      <span>{settings.phone}</span>
                    </div>
                  )}
                  {settings.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 shrink-0 text-slate-400" />
                      <span>{settings.email}</span>
                    </div>
                  )}
                </dl>
                {settings.about && (
                  <p className="mt-4 border-t border-slate-100 pt-4 text-sm text-slate-500">
                    {settings.about}
                  </p>
                )}
                </div>
              </div>

              <div className="card">
                <div className="card-body">
                <div className="flex items-center gap-2 text-slate-900">
                  <Link2 className="h-5 w-5" />
                  <h3 className="font-medium">Enlaces</h3>
                </div>
                <ul className="mt-3 space-y-2 text-sm">
                  <li>
                    <Link to="/tienda" className="text-slate-600 hover:text-slate-900">
                      Ver catálogo
                    </Link>
                  </li>
                  <li>
                    <Link to="/carrito" className="text-slate-600 hover:text-slate-900">
                      Ver carrito
                    </Link>
                  </li>
                  {socialLinks.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-slate-600 hover:text-slate-900"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
                </div>
              </div>
            </aside>

            <div className="space-y-8">
              <section>
                <div className="flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                    <Newspaper className="h-5 w-5" />
                    Noticias y novedades
                  </h2>
                </div>
                {news.length === 0 ? (
                  <div className="alert alert-secondary mt-3 d-flex align-items-center" role="alert">
                    <i className="bi bi-newspaper me-2" />
                    Aún no hay noticias publicadas.
                  </div>
                ) : (
                  <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {news.map((item) => {
                      const src = publicImageUrl(item.image);
                      return (
                        <article
                          key={item.id}
                          className="card card-hover d-flex flex-column h-100"
                        >
                          {src ? (
                            <img
                              src={src}
                              alt={item.title}
                              className="w-100 rounded-top"
                              style={{ height: '160px', objectFit: 'cover' }}
                            />
                          ) : (
                            <div
                              className="d-flex align-items-center justify-content-center bg-light rounded-top"
                              style={{ height: '160px' }}
                            >
                              <i className="bi bi-newspaper text-muted" style={{ fontSize: '1.75rem' }} />
                            </div>
                          )}
                          <div className="card-body d-flex flex-column">
                            <span className="badge text-bg-primary align-self-start">Novedad</span>
                            <h3 className="h6 mt-2">{item.title}</h3>
                            <p className="text-muted small mb-0 flex-grow-1 line-clamp-3">
                              {item.body}
                            </p>
                            <small className="text-muted mt-3 d-block">
                              <i className="bi bi-calendar3 me-1" />
                              {format(new Date(item.created_at), 'dd/MM/yyyy')}
                            </small>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>

              <section>
                <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                  <Megaphone className="h-5 w-5" />
                  Promociones
                </h2>
                {promotions.length === 0 ? (
                  <div className="alert alert-secondary mt-3 d-flex align-items-center" role="alert">
                    <i className="bi bi-megaphone me-2" />
                    No hay promociones activas por ahora.
                  </div>
                ) : (
                  <div className="mt-3 grid gap-4 sm:grid-cols-2">
                    {promotions.map((promo) => {
                      const src = publicImageUrl(promo.image);
                      return (
                        <article key={promo.id} className="card card-hover">
                          <div className="card-body d-flex gap-3">
                            {src ? (
                              <img
                                src={src}
                                alt={promo.title}
                                className="rounded-2 flex-shrink-0"
                                style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                              />
                            ) : (
                              <div
                                className="d-flex align-items-center justify-content-center bg-light rounded-2 flex-shrink-0"
                                style={{ width: '80px', height: '80px' }}
                              >
                                <i className="bi bi-megaphone text-muted" style={{ fontSize: '1.5rem' }} />
                              </div>
                            )}
                            <div className="min-w-0">
                              {promo.discount_badge && (
                                <span className="badge text-bg-success">{promo.discount_badge}</span>
                              )}
                              <h3 className="h6 mt-2">{promo.title}</h3>
                              {promo.description && (
                                <p className="text-muted small mb-0 line-clamp-2">
                                  {promo.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>
          </section>
        </>
      )}
    </div>
  );
}