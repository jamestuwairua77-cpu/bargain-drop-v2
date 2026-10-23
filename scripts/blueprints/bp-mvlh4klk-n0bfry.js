:root {
  --b: #09090b;
  --f: #f8fafc;
  --m: #94a3b8;
  --l: rgba(255, 255, 255, 0.12);
  --l2: rgba(255, 255, 255, 0.2);
  --r: #ff1a3c;
  --g: #4ade80;
  --nh: 54px;
  --ph: 28px;
  --li: #ff1a3c;
  --t: #ffd600;
  --a: #ff1a3c;
  --p: 9999px;
  --card-bg: #12121a;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  background: var(--b);
  background-image: radial-gradient(1200px 600px at 100% -10%, rgba(255, 26, 60, 0.12), transparent 60%), radial-gradient(900px 500px at -10% 12%, rgba(20, 20, 20, 0.05), transparent 55%);
  color: var(--f);
  padding-top: calc(var(--nh) + var(--ph));
  padding-bottom: 120px;
  -webkit-font-smoothing: antialiased;
  overflow-x: hidden;
}

a {
  color: inherit;
  text-decoration: none;
}

.ps {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: var(--ph);
  background: linear-gradient(90deg, #e60023, #ff1a3c);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.62rem;
  font-weight: 700;
  z-index: 300;
  overflow: hidden;
  white-space: nowrap;
}

.ps span {
  display: flex;
  align-items: center;
  gap: 4px;
  animation: ma 20s linear infinite;
}

.ps .sp {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
}

@keyframes ma {
  0% { transform: translateX(100%); }
  100% { transform: translateX(-100%); }
}

.nb {
  position: fixed;
  top: var(--ph);
  left: 0;
  right: 0;
  height: var(--nh);
  background: #111116;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  padding: 0 14px;
  z-index: 299;
  gap: 6px;
}

.nb.hi {
  transform: translateY(-100%);
}

.nlogo {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  margin-right: auto;
}

.nlogo .li {
  width: 30px;
  height: 30px;
  background: linear-gradient(135deg, #ff1a3c, #ff4d6d);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 900;
  color: #fff;
  box-shadow: 0 2px 8px rgba(255, 26, 60, 0.4);
}

.nlogo .lt {
  font-size: 0.85rem;
  font-weight: 800;
  color: #fff;
  letter-spacing: -0.3px;
}

.na {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
}

.nbtn {
  position: relative;
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: #f1f5f9;
  background: none;
  border: none;
  cursor: pointer;
}

.nbtn:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.1);
}

.nbadge {
  position: absolute;
  top: 2px;
  right: 2px;
  background: var(--r);
  color: #fff;
  font-size: 0.5rem;
  min-width: 15px;
  height: 15px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  padding: 0 3px;
}

.tb {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background: #12121a;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  color: #fff;
  font-size: 0.7rem;
}

.tb a {
  color: #f1f5f9;
  font-weight: 600;
}

.w {
  max-width: 640px;
  margin: 0 auto;
  padding: 20px 16px;
}

.bc {
  font-size: 0.7rem;
  color: var(--m);
  margin-bottom: 8px;
}

.bc a {
  color: var(--m);
}

.hdr {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.hdr h1 {
  font-size: 1.3rem;
  font-weight: 800;
  color: #ffffff;
}

.sub {
  font-size: 0.78rem;
  color: var(--m);
  margin-bottom: 16px;
}

.ci {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.cit {
  display: flex;
  gap: 12px;
  padding: 14px;
  border-radius: 14px;
  background: var(--card-bg);
  border: 1px solid var(--l);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  transition: all 0.2s ease;
}

.cit:hover {
  border-color: rgba(255, 26, 60, 0.3);
}

.ciimg {
  width: 84px;
  height: 84px;
  border-radius: 10px;
  background: #18182d;
  flex-shrink: 0;
  overflow: hidden;
  position: relative;
}

.ciimg img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.cidb {
  position: absolute;
  top: 4px;
  left: 4px;
  background: linear-gradient(135deg, #ff1a3c, #ff4d6d);
  color: #fff;
  font-size: 0.55rem;
  font-weight: 800;
  padding: 2px 6px;
  border-radius: 4px;
}

.ciinf {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.cititle {
  font-size: 0.85rem;
  font-weight: 600;
  line-height: 1.35;
  margin-bottom: 3px;
  color: #f8fafc !important;
}

.civ {
  font-size: 0.68rem;
  color: var(--m);
  margin-bottom: 6px;
}

.cip {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-bottom: 8px;
}

.cipp {
  font-size: 0.95rem;
  font-weight: 800;
  color: var(--r);
}

.cipo {
  font-size: 0.72rem;
  color: var(--m);
  text-decoration: line-through;
  text-decoration-color: #f43f5e;
}

.qr {
  display: flex;
  align-items: center;
  gap: 8px;
}

.qbtn {
  width: 32px;
  height: 30px;
  border-radius: 6px;
  border: 1px solid var(--l2);
  background: #1e1e2d;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-family: inherit;
  transition: all 0.15s;
}

.qbtn:hover {
  background: #28283d;
  border-color: var(--r);
}

.qbtn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.qv {
  font-size: 0.85rem;
  font-weight: 800;
  min-width: 24px;
  text-align: center;
  color: #ffffff;
}

.qrm {
  margin-left: auto;
  color: var(--m);
  font-size: 0.7rem;
  font-weight: 600;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: all 0.15s;
}

.qrm:hover {
  color: var(--r);
  background: rgba(255, 26, 60, 0.12);
}

.qsv {
  color: #ffd600;
  font-size: 0.68rem;
  font-weight: 600;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 3px;
}

.es {
  text-align: center;
  padding: 48px 20px;
  color: var(--m);
  margin-bottom: 16px;
  background: var(--card-bg);
  border-radius: 16px;
  border: 1px solid var(--l);
}

.es .ic {
  font-size: 3.5rem;
  margin-bottom: 12px;
}

.es h2 {
  font-size: 1rem;
  color: #ffffff;
  margin-bottom: 6px;
  font-weight: 800;
}

.es p {
  font-size: 0.78rem;
  margin-bottom: 18px;
  color: var(--m);
}

.es a {
  display: inline-block;
  padding: 12px 28px;
  background: linear-gradient(135deg, #ff1a3c, #e60023);
  color: #ffffff;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 700;
  box-shadow: 0 4px 14px rgba(230, 0, 35, 0.4);
}

.ss {
  margin-top: 12px;
}

.sh {
  font-size: 0.95rem;
  font-weight: 800;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  color: #ffffff;
}

.pt {
  background: none;
  border: none;
  color: #ff1a3c;
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
  padding: 4px 0;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.pf {
  display: none;
  margin-bottom: 12px;
}

.pf.on {
  display: flex;
  gap: 8px;
}

.pf input {
  flex: 1;
  padding: 12px 14px;
  border: 1px solid var(--l2);
  border-radius: 8px;
  font-size: 0.78rem;
  font-family: inherit;
  background: #1a1a24;
  color: #ffffff;
  outline: none;
}

.pf input::placeholder {
  color: var(--m);
}

.pf button {
  background: linear-gradient(135deg, #ff1a3c, #e60023);
  color: #ffffff;
  border: none;
  padding: 12px 18px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.75rem;
  cursor: pointer;
}

.pa {
  display: none;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  margin-bottom: 12px;
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #4ade80;
}

.pa.on {
  display: flex;
}

.pa button {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.85rem;
  color: #4ade80;
  margin-left: auto;
}

.sc {
  background: var(--card-bg);
  border-radius: 14px;
  padding: 18px;
  border: 1px solid var(--l);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}

.sr {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  font-size: 0.8rem;
}

.srm {
  color: var(--m);
}

.srs {
  color: #4ade80;
  font-weight: 700;
}

.sd {
  border: none;
  border-top: 1px solid var(--l);
  margin: 12px 0;
}

.st {
  font-size: 1rem;
  font-weight: 800;
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  color: #ffffff;
}

.stv {
  color: var(--r);
}

.cc {
  display: block;
  width: 100%;
  padding: 15px;
  margin-top: 14px;
  background: linear-gradient(135deg, #ff1a3c, #e60023);
  color: #ffffff;
  border: none;
  border-radius: 12px;
  font-size: 0.88rem;
  font-weight: 800;
  cursor: pointer;
  text-align: center;
  box-shadow: 0 4px 16px rgba(230, 0, 35, 0.4);
  transition: all 0.2s ease;
}

.cc:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(230, 0, 35, 0.5);
}

.cl {
  display: block;
  text-align: center;
  margin-top: 14px;
  font-size: 0.75rem;
  color: var(--m);
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.pb {
  display: flex;
  gap: 8px;
  justify-content: center;
  padding: 18px 0 10px;
  flex-wrap: wrap;
}

.pbb {
  height: 28px;
  padding: 0 12px;
  border-radius: 6px;
  border: 1px solid var(--l);
  background: #1a1a24;
  display: flex;
  align-items: center;
  font-size: 0.62rem;
  font-weight: 800;
  color: #f1f5f9;
}

.tr {
  display: flex;
  justify-content: center;
  gap: 18px;
  font-size: 0.68rem;
  color: var(--m);
  padding-bottom: 6px;
  flex-wrap: wrap;
}

.sl {
  display: block;
  text-align: center;
  font-size: 0.7rem;
  color: var(--m);
  padding: 10px 0 20px;
}

.to {
  position: fixed;
  bottom: 120px;
  left: 50%;
  transform: translateX(-50%);
  background: #111116;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff;
  padding: 10px 24px;
  border-radius: 20px;
  font-size: 0.78rem;
  font-weight: 600;
  z-index: 500;
  opacity: 0;
  transition: opacity 0.2s;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
}

.to.on {
  opacity: 1;
}

.nmo {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 400;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.25s;
}

.nmo.on {
  opacity: 1;
  pointer-events: auto;
}

.nm {
  position: fixed;
  top: 0;
  right: -280px;
  width: 280px;
  height: 100%;
  background: #111116;
  color: #ffffff;
  z-index: 401;
  transition: right 0.3s;
  overflow-y: auto;
  padding: 60px 20px 20px;
  box-shadow: -4px 0 16px rgba(0,0,0,0.4);
}

.nm.on {
  right: 0;
}

.nmc {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: #fff;
  font-size: 1.1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nm h3 {
  color: #94a3b8;
  font-size: 0.65rem;
  text-transform: uppercase;letter-spacing: 0.8px;
  margin: 20px 0 10px;
}

.nm h3:first-of-type {
  margin-top: 0;
}

.nm a {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
  color: rgba(255, 255, 255, 0.85);
  font-size: 0.78rem;
  font-weight: 600;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.nm a:hover {
  color: #fff;
}

.me {
  font-size: 0.9rem;
  width: 22px;
  text-align: center;
}

.so {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 450;
  display: none;
  align-items: flex-start;
  justify-content: center;
  padding-top: 100px;
}

.so.on {
  display: flex;
}

.sobox {
  width: min(520px, 90vw);
  background: #111116;
  border-radius: 14px;
  padding: 14px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.sobox input {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  font-size: 0.85rem;
  font-family: inherit;
  outline: none;
  color: #ffffff;
  background: #1a1a24;
}

.sobox input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.sobox input:focus {
  border-color: var(--a);
}

/* SLIDE OUT HAMBURGER MENU */
.slide-menu {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 500;
  pointer-events: none;
}

.slide-menu.open {
  pointer-events: auto;
}

.slide-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.55);
  opacity: 0;
  transition: opacity 0.25s ease;
}

.slide-menu.open .slide-backdrop {
  opacity: 1;
}

.slide-panel {
  position: absolute;
  top: 0;
  right: 0;
  width: 280px;
  max-width: 85vw;
  height: 100%;
  background: #08090a;
  color: #ffffff;
  padding: 68px 0 24px;
  transform: translateX(100%);
  transition: transform 0.25s ease;
  overflow-y: auto;
  box-shadow: -8px 0 28px rgba(0, 0, 0, 0.7);
  border-left: 1px solid #222425;
}

.slide-menu.open .slide-panel {
  transform: translateX(0);
}

.slide-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 13px 22px;
  font-size: 0.85rem;
  color: #f1f5f9;
  text-decoration: none;
  font-weight: 700;
  border-bottom: 1px solid #202223;
  transition: all 0.15s ease;
}

.slide-item:hover {
  background: #121515;
  color: #fe3442;
  padding-left: 26px;
}

.slide-ico {
  width: 32px;
  height: 32px;
  border-radius: 9px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #ffffff;
  font-size: 0.68rem;
  font-weight: 800;
  background: #121515;
  border: 1px solid #222425;
}

.slide-heading {
  font-size: 0.65rem;
  font-weight: 900;
  color: #fe3442;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 14px 22px 6px;
}

.slide-divider {
  height: 1px;
  background: #202223;
  margin: 8px 0;
}

.slide-close {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 34px;
  height: 34px;
  border-radius: 6px;
  border: 1px solid #222425;
  background: #121515;
  font-size: 1.2rem;
  cursor: pointer;
  color: #fe3442;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  transition: all 0.15s ease;
}

.slide-close:hover {
  background: #fe3442;
  color: #ffffff;
}