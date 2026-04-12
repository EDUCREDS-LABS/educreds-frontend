import React from 'react';

const VerificationSection = () => {
  return (
    <section className="w-full bg-gradient-to-b from-slate-950 via-slate-900 to-black text-white">
      <div className="relative mx-auto max-w-7xl px-6 py-20 lg:py-28">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_transparent_55%)]" />
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
              Verification Platform
            </p>
            <h2 className="mt-4 text-4xl font-bold leading-tight text-blue-500 md:text-5xl lg:text-6xl">
              Product-grade credential verification for modern institutions
            </h2>
            <p className="mt-6 text-lg text-slate-300 md:text-xl">
              EduCreds turns certificates into verifiable digital assets. Issue, verify, and audit credentials with a
              secure workflow that integrates cleanly with your existing systems.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <button className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-200">
                Request a Demo
              </button>
              <button className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/40">
                Explore the Product
              </button>
            </div>
            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                <p className="text-sm font-semibold text-slate-200">Instant Checks</p>
                <p className="mt-2 text-sm text-slate-400">Verify authenticity in seconds with a single scan.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                <p className="text-sm font-semibold text-slate-200">Tamper Proof</p>
                <p className="mt-2 text-sm text-slate-400">Immutable records prevent edits or duplication.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                <p className="text-sm font-semibold text-slate-200">API Ready</p>
                <p className="mt-2 text-sm text-slate-400">Connect to HR, SIS, and compliance systems.</p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-2 rounded-[32px] bg-gradient-to-br from-blue-500/30 via-transparent to-emerald-400/20 blur-2xl" />
            <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-slate-900/60 shadow-2xl">
              <img
                src="https://res.cloudinary.com/dycszahnr/image/upload/q_auto/f_auto/v1775824626/bg_efqyw6.png"
                alt="EduCreds product dashboard"
                className="h-full w-full object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent p-6">
                <div className="flex flex-wrap items-center gap-4">
                  <span className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
                    Secure by Design
                  </span>
                  <span className="text-sm text-slate-300">
                    Purpose-built for academic, government, and enterprise credential flows.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
              <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12l4 4L19 6" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-blue-500">Issuance Control</h3>
            <p className="mt-2 text-sm text-slate-300">
              Manage who can issue, revoke, and renew credentials with role-based workflows.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
              <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l9 4.5-9 4.5-9-4.5L12 3z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10.5l9 4.5 9-4.5" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 15l9 4.5 9-4.5" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-blue-500">Multi-party Verification</h3>
            <p className="mt-2 text-sm text-slate-300">
              Share verifiable proof across employers, regulators, and partner institutions.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
              <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h10" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-blue-500">Audit Insights</h3>
            <p className="mt-2 text-sm text-slate-300">
              Track issuance and verification activity with real-time reporting.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default VerificationSection;
