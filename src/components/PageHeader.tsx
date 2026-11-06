/** Page title + intro, shown over a banner image when one is set in Admin → Site settings. */
export function PageHeader({ title, intro, banner }: { title: string; intro?: string; banner?: string }) {
  if (banner) {
    return (
      <div className="relative mb-10 overflow-hidden rounded-2xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={banner} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-900/80 via-brand-800/55 to-brand-700/20" aria-hidden />
        <div className="relative px-6 py-14 sm:px-10 sm:py-20">
          <h1 className="text-3xl font-bold text-white sm:text-4xl">{title}</h1>
          {intro && <p className="mt-3 max-w-2xl text-brand-50">{intro}</p>}
        </div>
      </div>
    );
  }
  return (
    <div className="mb-10">
      <h1 className="text-3xl font-bold">{title}</h1>
      {intro && <p className="mt-2 text-muted">{intro}</p>}
    </div>
  );
}
