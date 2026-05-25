import React from "react";

const Footer: React.FC = () => {
  return (
    <footer className="relative mt-auto overflow-hidden border-t border-white/70 bg-slate-950 text-white">
      <div className="pointer-events-none absolute -left-20 top-0 h-48 w-48 rounded-full bg-teal-400/15 blur-3xl"></div>
      <div className="pointer-events-none absolute right-0 bottom-0 h-52 w-52 rounded-full bg-amber-300/10 blur-3xl"></div>

      <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-5 md:grid-cols-[1.3fr_0.9fr_0.8fr] md:items-start">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-400 to-emerald-300 text-slate-950 shadow-lg shadow-teal-500/20">
                <i className="fa-solid fa-graduation-cap"></i>
              </span>
              <div>
                <div className="text-xl font-black tracking-tight">UniTrade</div>
                <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-teal-200">Student market</div>
              </div>
            </div>
            <p className="mt-4 max-w-xl text-sm leading-6 text-slate-300">
              Nền tảng trao đổi đồ cũ dành riêng cho sinh viên Việt Nam: nhanh, tiết kiệm và thân thiện với campus.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-400/15 text-teal-200">
                <i className="fa-solid fa-headset"></i>
              </span>
              <div>
                <h3 className="text-sm font-black">Cần hỗ trợ?</h3>
                <a href="tel:0393680820" className="mt-1 inline-flex items-center gap-2 text-sm font-black text-teal-200 transition-colors hover:text-white">
                  <i className="fa-solid fa-phone text-xs"></i>
                  0393680820
                </a>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-black uppercase tracking-[0.22em] text-teal-200">Kết nối</h3>
            <div className="mt-3 flex gap-2 text-base text-slate-300">
              <a href="#" aria-label="Facebook" className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 transition-all hover:-translate-y-0.5 hover:bg-teal-400 hover:text-slate-950"><i className="fa-brands fa-facebook"></i></a>
              <a href="#" aria-label="Instagram" className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 transition-all hover:-translate-y-0.5 hover:bg-teal-400 hover:text-slate-950"><i className="fa-brands fa-instagram"></i></a>
              <a href="#" aria-label="Twitter" className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 transition-all hover:-translate-y-0.5 hover:bg-teal-400 hover:text-slate-950"><i className="fa-brands fa-twitter"></i></a>
              <a href="#" aria-label="Discord" className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 transition-all hover:-translate-y-0.5 hover:bg-teal-400 hover:text-slate-950"><i className="fa-brands fa-discord"></i></a>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2 border-t border-white/10 pt-4 text-xs font-semibold text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <span>&copy; 2026 UniTrade. Bản quyền thuộc về đội ngũ phát triển sinh viên.</span>
          <span className="inline-flex items-center gap-2 text-teal-200">
            <i className="fa-solid fa-heart"></i>
            Made for student communities
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
