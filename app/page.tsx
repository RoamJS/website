export default function Home() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black px-6 text-white">
      <div
        className="pointer-events-none absolute inset-0 opacity-35"
        aria-hidden="true"
      >
        <div className="absolute left-1/2 top-1/2 h-[32rem] w-[32rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,_rgba(255,255,255,0.14)_0%,_rgba(255,255,255,0.03)_45%,_transparent_70%)] blur-xl" />
      </div>
      <section className="z-10 flex flex-col items-center text-center">
        <h1 className="bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-5xl font-semibold tracking-tight text-transparent sm:text-7xl">
          Coming Soon
        </h1>
        <div className="mt-10">
          <a
            className="group inline-flex items-center gap-3 rounded-full border border-zinc-700 bg-zinc-900/70 px-6 py-3 text-sm text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-800 hover:text-white"
            href="https://github.com/RoamJS"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Visit the project on GitHub"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4 fill-current transition group-hover:scale-110"
              aria-hidden="true"
            >
              <path d="M12 .5A12 12 0 0 0 8.2 23.9c.6.1.8-.3.8-.6v-2.1c-3.3.7-4-1.4-4-1.4-.5-1.4-1.2-1.8-1.2-1.8-1-.7.1-.7.1-.7 1.1.1 1.7 1.2 1.7 1.2 1 1.7 2.6 1.2 3.2.9.1-.7.4-1.2.7-1.4-2.6-.3-5.3-1.3-5.3-5.8 0-1.3.5-2.3 1.2-3.2-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2a11 11 0 0 1 6 0c2.3-1.6 3.3-1.2 3.3-1.2.6 1.6.2 2.8.1 3.1.8.9 1.2 2 1.2 3.2 0 4.5-2.7 5.5-5.3 5.8.4.3.8 1 .8 2.1v3.1c0 .3.2.7.8.6A12 12 0 0 0 12 .5Z" />
            </svg>
            github.com/RoamJS
          </a>
        </div>
      </section>
    </main>
  );
}
