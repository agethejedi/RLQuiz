import React, { useEffect, useMemo, useState } from "react";
import { CheckCircle2, CircleHelp, Headphones, Info, Trophy, Volume2, VolumeX, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";

const SAMPLE_QUESTIONS = [
  { id: "q1", type: "matching", title: "What type of wallet will you be using?",
    pairsLeft: ["Hot Wallet","Cold Wallet","Coinbase","Crypto.com","Bitcoin","My advisors","FTX","DOGE"],
    pairsRight: ["Green Flag","Red Flag"],
    correctMap: {0:0,1:0,2:0,3:0,4:1,5:1,6:1,7:1},
    rationale: "Valid wallet types/providers are Hot Wallet, Cold Wallet, Coinbase, Crypto.com (Green Flags). Bitcoin, My advisors, FTX, and DOGE are not wallet types (Red Flags)."},
  { id: "q2", type: "tf", title: "The Satoshi Rule requires wallets inactive for three years to be closed and assets turned over to the IRS.",
    correctBool: false, rationale: "No such 'Satoshi Rule' exists. It's a scam pretext, not a real regulation."},
  { id: "q3", type: "tf", title: "A crypto wallet address is public information.", correctBool: true,
    rationale: "Addresses are public and viewable on block explorers. Keep private keys / seed phrases secret."},
  { id: "q4", type: "mcq", title: "A ______________ is used to access a hot wallet and is comprised of 12 words or phrases.",
    choices: ["Secret Recovery Phrase","Passkey","Node","Hash"], correctIndex: 0,
    rationale: "A Secret Recovery Phrase (seed phrase), typically 12 or 24 words, is the backup to access your wallet."},
  { id: "q5", type: "mcq", title: "Which statement best describes a crypto wallet?",
    choices: ["It stores your cryptocurrencies physically on your phone.","It stores private/public keys that control access to your crypto on a blockchain.","It is the same as a crypto exchange account.","It mints new coins for you automatically."],
    correctIndex: 1, rationale: "A wallet manages your keys. Assets remain on-chain; the private key authorizes spending and the public key/address receives funds."},
  { id: "q6", type: "multi", title: "Choose the Red Flags:",
    choices: ["My Advisor has my wallet address","My girlfriend in the Philippines created my wallet.","I posted my wallet address on Reddit","I saved my recovery phrase in a password manager"],
    correctAnswers: [0,1,2], rationale: "Red flags include giving control to an 'advisor', letting a romantic partner set up your wallet, or posting your wallet address publicly. Saving a recovery phrase in a reputable password manager is generally acceptable."},
  { id: "q7", type: "mcq", title: "Etherscan is an example of a:",
    choices: ["Institutional Wallet","Public Database of known crypto investors","Blockchain Explorer"], correctIndex: 2,
    rationale: "Etherscan is a blockchain explorer that lets you search Ethereum transactions, wallet addresses, and smart contracts."},
  { id: "q8", type: "mcq", title: "Which of the following tools provides an image of the relationships and connections between wallets, allowing viewers to gain insight on the relative risks associated with wallets and their activity?",
    choices: ["Blockchain","Node","Hash","Visual Blockchain Explorer"], correctIndex: 3,
    rationale: "A Visual Blockchain Explorer provides graphical representations of wallet connections and activity patterns to assess relative risk."},
  { id: "q9", type: "tf", title: "Are Crypto Wallet Holders required to provide their social security number or other identifying information at the time of wallet creation?",
    correctBool: false, rationale: "Creating a wallet does not require providing government-issued identification. This contrasts with opening accounts at regulated exchanges, which require KYC."},
  { id: "q10", type: "mcq", title: "A customer wires money for the first time in the amount of $237,000 to an account at Coinbase:",
    choices: ["Red Flag","Green Flag"], correctIndex: 0,
    rationale: "A first-time, large-dollar wire ($237,000) to a crypto exchange is a classic red flag for potential fraud or money movement risk."},
  { id: "q11", type: "mcq", title: "The same customer receives a wire of $250,000 10 days later from the same Coinbase account.",
    choices: ["Red Flag","Green Flag"], correctIndex: 0,
    rationale: "Incoming large wires from a crypto exchange are also suspicious. Coinbase typically does not initiate wires to individual accounts. This pattern is abnormal (Red Flag)."},
  { id: "q12", type: "mcq", title: "Three days later the customer sends $350,000 back to the same Coinbase account.",
    choices: ["Red Flag","Green Flag"], correctIndex: 0,
    rationale: "Rapid round-trip wires (send → receive → send again) to/from exchanges are classic money-laundering red flags."},
  { id: "q13", type: "mcq", title: "When asked the customer relays that they will be sending the money onto a pooled wallet so that they can receive higher returns.",
    choices: ["Red Flag","Green Flag"], correctIndex: 0,
    rationale: "Promises of higher returns via pooled wallets are a hallmark of fraud schemes. Definitely a Red Flag."},
  { id: "q14", type: "mcq", title: "What could a fraud wallet potentially look like in a blockchain explorer?",
    choices: ["Starburst","Donut","Cylinder","Trapezoid"], correctIndex: 0,
    rationale: "Fraudulent or scam wallets often appear as a 'Starburst' pattern, with many inbound transfers feeding a central wallet that then disperses quickly."},
  { id: "q15", type: "mcq", title: "A customer is pressured to move their crypto assets urgently due to a 'security alert' phone call. How should this be classified?",
    choices: ["Legitimate Security Measure","Potential Scam / Social Engineering","Green Flag","Routine Account Maintenance"], correctIndex: 1,
    rationale: "Urgent calls demanding immediate transfers are a key red flag for social engineering and fraud scams."}
];

const CYAN = "#00E5FF";

function useBritishFemaleVoice() {
  const [voice, setVoice] = useState(null);
  useEffect(() => {
    const pickVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      const target =
        voices.find((v) => /en-GB/i.test(v.lang) && /female/i.test(v.name)) ||
        voices.find((v) => /en-GB/i.test(v.lang)) ||
        voices.find((v) => /female/i.test(v.name)) ||
        voices[0] || null;
      setVoice(target || null);
    };
    pickVoice();
    window.speechSynthesis.onvoiceschanged = pickVoice;
  }, []);
  return voice;
}

function speak(text, voice) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  if (voice) u.voice = voice;
  u.rate = 1.02;
  u.pitch = 1.0;
  window.speechSynthesis.speak(u);
}

function getBadges(score, total) {
  const pct = (score / total) * 100;
  const badges = [];
  if (pct === 100) badges.push("Perfect Score");
  if (pct >= 80) badges.push("Crypto Guardian");
  if (pct >= 50) badges.push("Risk Watcher");
  if (pct < 50) badges.push("Trainee — Review Needed");
  return badges;
}

function Pill({ children }) {
  return <span className="px-3 py-1 rounded-full border border-slate-700 text-slate-200 text-xs tracking-wide">{children}</span>;
}
function SectionCard({ title, right, children }) {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-slate-100 font-semibold text-lg">{title}</h3>
        <div>{right}</div>
      </div>
      {children}
    </div>
  );
}
function ProgressBar({ value, max }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
      <div className="h-full" style={{ width: `${pct}%`, background: CYAN }} />
    </div>
  );
}

function MCQ({ q, response, setResponse }) {
  return (
    <div className="space-y-2">
      {q.choices.map((c, i) => (
        <label key={i} className="flex items-center gap-3 p-3 rounded-xl border border-slate-800 hover:border-slate-700 cursor-pointer">
          <input type="radio" name={q.id} className="accent-cyan-400" checked={response === i} onChange={() => setResponse(i)} />
          <span className="text-slate-200">{c}</span>
        </label>
      ))}
    </div>
  );
}
function MultiSelect({ q, response = [], setResponse }) {
  const current = Array.isArray(response) ? response : [];
  const toggle = (idx) => {
    const set = new Set(current);
    if (set.has(idx)) set.delete(idx); else set.add(idx);
    setResponse(Array.from(set));
  };
  return (
    <div className="space-y-2">
      {q.choices.map((c, i) => (
        <label key={i} className="flex items-center gap-3 p-3 rounded-xl border border-slate-800 hover:border-slate-700 cursor-pointer">
          <input type="checkbox" className="accent-cyan-400" checked={current.includes(i)} onChange={() => toggle(i)} />
          <span className="text-slate-200">{c}</span>
        </label>
      ))}
    </div>
  );
}
function TrueFalse({ q, response, setResponse }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {[true, false].map((val, i) => (
        <label key={i} className="flex items-center gap-3 p-3 rounded-xl border border-slate-800 hover:border-slate-700 cursor-pointer">
          <input type="radio" name={q.id} className="accent-cyan-400" checked={response === val} onChange={() => setResponse(val)} />
          <span className="text-slate-200">{val ? "True" : "False"}</span>
        </label>
      ))}
    </div>
  );
}
function FillInBlank({ q, response = [], setResponse }) {
  const arr = response.length ? response : Array(q.blanks || 1).fill("");
  return (
    <div className="space-y-3">
      {arr.map((v, i) => (
        <input key={i} value={v} onChange={(e) => { const next = [...arr]; next[i] = e.target.value; setResponse(next); }}
          placeholder={`Blank ${i + 1}`} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500" />
      ))}
    </div>
  );
}
function Matching({ q, response = {}, setResponse }) {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="space-y-3">
        {q.pairsLeft.map((label, idx) => (
          <div key={idx} className="p-3 rounded-xl border border-slate-800">
            <div className="text-slate-300 text-sm mb-2">{label}</div>
            <select className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100"
              value={response[idx] ?? ""} onChange={(e) => setResponse({ ...response, [idx]: Number(e.target.value) })}>
              <option value="" disabled>Select category</option>
              {q.pairsRight.map((r, i) => (<option key={i} value={i}>{r}</option>))}
            </select>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-slate-800 p-3 bg-slate-950/40">
        <div className="text-slate-400 text-xs mb-2">Categories</div>
        <ul className="list-disc pl-6 space-y-1 text-slate-300 text-sm">
          {q.pairsRight.map((r, i) => (<li key={i}>{r}</li>))}
        </ul>
      </div>
    </div>
  );
}

function Results({ summary, onRestart }) {
  const total = summary.length;
  const correct = summary.filter((s) => s.correct).length;
  const badges = getBadges(correct, total);

  useEffect(() => { if (badges.length > 0) { confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } }); } }, [badges]);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-2">
          <Trophy size={22} style={{ color: CYAN }} />
          <h2 className="text-slate-100 text-xl font-semibold">Your Report</h2>
        </div>
        <div className="text-slate-300 mb-2">
          Score: <span className="font-semibold" style={{ color: CYAN }}>{Math.round((correct / total) * 100)}%</span> ({correct} / {total})
        </div>
        <div className="flex flex-wrap gap-2">
          {badges.map((b, i) => (
            <span key={i} className="inline-flex items-center gap-1 px-3 py-1 rounded-full border border-slate-700 text-xs text-slate-200 animate-pulse"
              style={{ background: "#112", color: CYAN }}>
              <Sparkles size={14} /> {b}
            </span>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        {summary.map((s, i) => (
          <div key={s.id} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="text-slate-200 font-medium">Q{i + 1}. {s.title}</div>
              <div className={`text-xs px-2 py-1 rounded-full ${s.correct ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                {s.correct ? 'Correct' : 'Incorrect'}
              </div>
            </div>
            <div className="text-slate-400 text-sm mb-2">Your answer: {s.userAnswerLabel ?? '—'}</div>
            <div className="text-slate-300 text-sm"><span className="font-semibold" style={{ color: CYAN }}>Rationale:</span> {s.rationale}</div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between pt-2">
        <button onClick={onRestart} className="px-4 py-2 rounded-xl border border-slate-700 text-slate-200 hover:bg-slate-800">Restart</button>
        <button className="px-4 py-2 rounded-xl border border-slate-700 text-slate-200 hover:bg-slate-800">Download Report (PDF)</button>
      </div>
    </div>
  );
}

export default function App() {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [summary, setSummary] = useState([]);
  const voice = useBritishFemaleVoice();
  const questions = SAMPLE_QUESTIONS;
  const current = questions[index];

  const score = useMemo(() => {
    let correct = 0;
    questions.forEach((q) => {
      const r = answers[q.id];
      if (!submitted[q.id]) return;
      if (q.type === 'mcq' && r === q.correctIndex) correct++;
      if (q.type === 'tf' && r === q.correctBool) correct++;
      if (q.type === 'fib' && Array.isArray(r)) {
        const a = r.map((x) => (x || '').trim().toLowerCase());
        const ok = a.length === q.answers.length && a.every((v, i) => v === q.answers[i]);
        if (ok) correct++;
      }
      if (q.type === 'matching' && r) {
        const ok = Object.keys(q.correctMap).every((k) => Number(r[k]) === q.correctMap[k]);
        if (ok) correct++;
      }
      if (q.type === 'multi' && Array.isArray(r)) {
        const corr = (q.correctAnswers || []).slice().sort();
        const user = r.slice().sort();
        const ok = corr.length === user.length && corr.every((v, i) => v === user[i]);
        if (ok) correct++;
      }
    });
    return correct;
  }, [answers, submitted, questions]);

  const progress = Object.keys(submitted).length;

  function computeCorrect(q, r) {
    if (q.type === 'mcq') return r === q.correctIndex;
    if (q.type === 'tf') return r === q.correctBool;
    if (q.type === 'fib') {
      if (!Array.isArray(r)) return false;
      const a = r.map((x) => (x || '').trim().toLowerCase());
      return a.length === (q.answers?.length || 0) && a.every((v, i) => v === q.answers[i]);
    }
    if (q.type === 'matching') {
      if (!r) return false;
      return Object.keys(q.correctMap).every((k) => Number(r[k]) === q.correctMap[k]);
    }
    if (q.type === 'multi') {
      if (!Array.isArray(r)) return false;
      const corr = (q.correctAnswers || []).slice().sort();
      const user = r.slice().sort();
      return corr.length === user.length && corr.every((v, i) => v === user[i]);
    }
    return false;
  }

  function labelAnswer(q, r) {
    if (r == null) return null;
    if (q.type === 'mcq') return q.choices[r];
    if (q.type === 'tf') return r ? 'True' : 'False';
    if (q.type === 'fib') return Array.isArray(r) ? r.join(' | ') : '';
    if (q.type === 'matching')
      return Object.keys(r).map((k) => `${q.pairsLeft[k]} → ${q.pairsRight[r[k]] ?? '—'}`).join('; ');
    if (q.type === 'multi')
      return Array.isArray(r) ? r.map((i) => q.choices[i]).join(' | ') : '';
    return null;
  }

  function onSubmit() {
    const id = current.id;
    if (!submitted[id]) {
      setSubmitted({ ...submitted, [id]: true });
      const rationale = current.rationale || "We'll add a detailed explanation here.";
      const wasCorrect = computeCorrect(current, answers[id]);
      const prefix = wasCorrect ? "Congratulations, you answered correctly. " : "Thanks for your answer. Let's review: ";
      speak(prefix + rationale, voice);
    }
  }
  function nextOrFinish() { if (index < questions.length - 1) setIndex(index + 1); else finish(); }
  function prev() { if (index > 0) setIndex(index - 1); }
  function finish() {
    const sum = questions.map((q) => {
      const r = answers[q.id];
      return { id: q.id, title: q.title, correct: computeCorrect(q, r), userAnswerLabel: labelAnswer(q, r), rationale: q.rationale };
    });
    setSummary(sum); setShowResults(true); window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function resetAll() { setIndex(0); setAnswers({}); setSubmitted({}); setShowResults(false); setSummary([]); }

  const response = answers[current.id];
  const setResponse = (val) => setAnswers({ ...answers, [current.id]: val });

  const QuestionBlock = () => {
    if (current.type === 'mcq') return <MCQ q={current} response={response} setResponse={setResponse} />;
    if (current.type === 'tf') return <TrueFalse q={current} response={response} setResponse={setResponse} />;
    if (current.type === 'fib') return <FillInBlank q={current} response={response} setResponse={setResponse} />;
    if (current.type === 'matching') return <Matching q={current} response={response} setResponse={setResponse} />;
    if (current.type === 'multi') return <MultiSelect q={current} response={response} setResponse={setResponse} />;
    return <div className="text-slate-400">Unsupported question type.</div>;
  };

  if (showResults) {
    return (
      <div className="min-h-screen bg-[#0B0F14] text-slate-200">
        <Header score={score} total={questions.length} progress={progress} />
        <main className="px-5 md:px-8 py-6">
          <Results summary={summary} onRestart={resetAll} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F14] text-slate-200">
      <Header score={score} total={questions.length} progress={progress} />
      <main className="px-5 md:px-8 py-6 max-w-5xl mx-auto space-y-5">
        <SectionCard
          title={<div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-slate-800 text-sm" style={{ color: CYAN }}>{index + 1}</span>
            <span>{current.title}</span>
          </div>}
          right={<div className="flex items-center gap-2">
            <Pill>Crypto Wallets</Pill>
            <Pill>{current.type.toUpperCase()}</Pill>
            <button className="ml-2 inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-700 text-slate-100 hover:bg-slate-800"
              onClick={() => speak(current.title, voice)} title="Read question aloud">
              <Volume2 size={16} /> Read aloud
            </button>
          </div>}
        >
          <div className="space-y-4">
            <QuestionBlock />
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-3">
                <button onClick={prev} disabled={index === 0} className="px-4 py-2 rounded-xl border border-slate-700 text-slate-200 disabled:opacity-40 hover:bg-slate-800">Previous</button>
                <button onClick={() => setAnswers({ ...answers, [current.id]: undefined })} className="px-4 py-2 rounded-xl border border-slate-700 text-slate-200 hover:bg-slate-800">Clear</button>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={onSubmit} className="px-4 py-2 rounded-xl border border-slate-700 text-slate-900" style={{ background: CYAN }}>Submit Answer</button>
                <button onClick={nextOrFinish} className="px-4 py-2 rounded-xl border border-slate-700 text-slate-200 hover:bg-slate-800">{index < questions.length - 1 ? 'Next' : 'Finish'}</button>
              </div>
            </div>
          </div>
        </SectionCard>
        <SectionCard title={<div className="flex items-center gap-2"><Info size={18} style={{ color: CYAN }} /><span>Feedback & Rationale</span></div>} right={<Pill>Auto narration</Pill>}>
          {submitted[current.id] ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                {(() => {
                  const ok = computeCorrect(current, answers[current.id]);
                  return ok ? (<><CheckCircle2 size={16} className="text-emerald-400" /><span className="text-emerald-300">Congratulations, you answered correctly.</span></>)
                            : (<><CircleHelp size={16} className="text-rose-300" /><span className="text-rose-300">Not quite. Review the explanation below.</span></>);
                })()}
              </div>
              <div className="text-slate-200 leading-relaxed">{current.rationale}</div>
              <div className="flex items-center gap-2">
                <button className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-700 text-slate-100 hover:bg-slate-800" onClick={() => speak(current.rationale, voice)}>
                  <Headphones size={16} /> Listen to rationale
                </button>
                <button className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-700 text-slate-100 hover:bg-slate-800" onClick={() => window.speechSynthesis.cancel()}>
                  <VolumeX size={16} /> Stop audio
                </button>
              </div>
            </div>
          ) : (<div className="text-slate-400 text-sm">Submit your answer to reveal feedback and rationale (with narration).</div>)}
        </SectionCard>
      </main>
      <footer className="sticky bottom-0 left-0 right-0 backdrop-blur bg-[#0B0F14]/75 border-t border-slate-800">
        <div className="max-w-5xl mx-auto px-5 md:px-8 py-3">
          <div className="flex items-center gap-4">
            <div className="w-40 text-xs text-slate-400">Progress {/* answered count */}</div>
            <div className="flex-1"><div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden"><div className="h-full" style={{ width: `${Math.round((Object.keys(submitted).length / questions.length) * 100)}%`, background: CYAN }} /></div></div>
            <div className="w-24 text-right text-xs text-slate-400">Score {(() => {
              let correct = 0; questions.forEach((q) => { const r = answers[q.id]; if (!submitted[q.id]) return;
                if (q.type === 'mcq' && r === q.correctIndex) correct++;
                if (q.type === 'tf' && r === q.correctBool) correct++;
                if (q.type === 'fib' && Array.isArray(r)) { const a = r.map((x) => (x || '').trim().toLowerCase()); const ok = a.length === (q.answers?.length || 0) && a.every((v, i) => v === q.answers[i]); if (ok) correct++; }
                if (q.type === 'matching' && r) { const ok = Object.keys(q.correctMap).every((k) => Number(r[k]) === q.correctMap[k]); if (ok) correct++; }
                if (q.type === 'multi' && Array.isArray(r)) { const corr = (q.correctAnswers || []).slice().sort(); const user = r.slice().sort(); const ok = corr.length === user.length && corr.every((v, i) => v === user[i]); if (ok) correct++; }
              }); return `${correct}/${questions.length}`; })()}</div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Header({ score, total, progress }) {
  return (
    <header className="border-b border-slate-800 bg-[#0B0F14]/90 backdrop-blur sticky top-0 z-20">
      <div className="max-w-5xl mx-auto px-5 md:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 grid place-items-center">
            <div className="w-4 h-4 rounded-full" style={{ background: "#00E5FF" }} />
          </div>
          <div>
            <div className="text-slate-200 font-semibold leading-tight">Risk Lab — Scenario</div>
            <div className="text-[11px] tracking-wide" style={{ color: "#00E5FF" }}>Public: Crypto Wallets</div>
          </div>
        </div>
        <div className="flex items-center gap-5">
          <div className="hidden md:block text-xs text-slate-400">Questions answered: {progress}</div>
          <div className="text-xs text-slate-400">Score: <span className="font-semibold" style={{ color: "#00E5FF" }}>{score}</span> / {total}</div>
        </div>
      </div>
    </header>
  );
}
