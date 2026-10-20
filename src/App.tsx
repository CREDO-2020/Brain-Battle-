import { useEffect, useRef, useState } from "react";
import { Brain, ChevronRight, CircleHelp, Crown, Headphones, Home, Music2, Pause, Play, RotateCcw, Settings2, Sparkles, Timer, Trophy, Volume2, VolumeX, Zap } from "lucide-react";
import { supabase } from "./lib/supabase";

type Question = { category: string; question: string; options: string[]; answer: number; explanation: string };
const QUESTIONS: Question[] = [
  { category: "Science", question: "Which planet is known as the Red Planet?", options: ["Venus", "Mars", "Jupiter", "Mercury"], answer: 1, explanation: "Mars looks reddish because iron minerals in its soil have oxidized, or rusted." },
  { category: "Technology", question: "What does CPU stand for?", options: ["Computer Power Unit", "Central Processing Unit", "Core Program Utility", "Central Performance User"], answer: 1, explanation: "The CPU executes instructions and performs calculations for a computer." },
  { category: "General Knowledge", question: "What is the largest ocean on Earth?", options: ["Atlantic Ocean", "Indian Ocean", "Arctic Ocean", "Pacific Ocean"], answer: 3, explanation: "The Pacific Ocean is the largest and deepest ocean on Earth." },
  { category: "History", question: "The ancient pyramids of Giza are in which country?", options: ["Mexico", "Greece", "Egypt", "Sudan"], answer: 2, explanation: "The Giza pyramid complex is on the outskirts of Cairo, Egypt." },
  { category: "Sports", question: "How many players from one football team are on the pitch at kickoff?", options: ["9", "10", "11", "12"], answer: 2, explanation: "A standard football team fields eleven players, including the goalkeeper." },
  { category: "Science", question: "Which gas do plants absorb from the atmosphere?", options: ["Oxygen", "Carbon dioxide", "Nitrogen", "Hydrogen"], answer: 1, explanation: "Plants use carbon dioxide, water, and light to make sugars during photosynthesis." },
  { category: "Technology", question: "Which of these is a programming language?", options: ["Python", "Leopard", "Firefox", "Bluetooth"], answer: 0, explanation: "Python is a widely used programming language known for readable syntax." },
  { category: "General Knowledge", question: "How many sides does a hexagon have?", options: ["Five", "Six", "Seven", "Eight"], answer: 1, explanation: "The prefix 'hexa-' means six, so a hexagon has six sides." },
  { category: "History", question: "Which continent is home to the Sahara Desert?", options: ["Asia", "South America", "Africa", "Australia"], answer: 2, explanation: "The Sahara stretches across much of northern Africa." },
  { category: "Sports", question: "In tennis, what word means a score of zero?", options: ["Nil", "Love", "Blank", "Duck"], answer: 1, explanation: "In tennis scoring, zero points is called love." }
];
const categories = [
  { name: "All topics", emoji: "🌐", color: "violet" },
  { name: "Science", emoji: "🧪", color: "blue" },
  { name: "Technology", emoji: "💻", color: "cyan" },
  { name: "General Knowledge", emoji: "🧠", color: "pink" },
  { name: "Sports", emoji: "⚽", color: "green" },
  { name: "History", emoji: "🏛️", color: "orange" }
];

function useGameMusic() {
  const context = useRef<AudioContext | null>(null);
  const timer = useRef<number | null>(null);
  const note = useRef(0);
  const [enabled, setEnabled] = useState(false);
  const [volume, setVolume] = useState(0.16);
  const [ready, setReady] = useState(false);

  const start = async () => {
    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    if (!context.current) context.current = new AudioContextClass();
    await context.current.resume();
    setEnabled(true);
    setReady(true);
  };
  const stop = () => {
    setEnabled(false);
    if (timer.current !== null) window.clearInterval(timer.current);
    timer.current = null;
  };

  useEffect(() => {
    if (!enabled || !context.current) return;
    const ctx = context.current;
    const melody = [261.63, 329.63, 392, 329.63, 293.66, 349.23, 440, 349.23];
    timer.current = window.setInterval(() => {
      if (ctx.state !== "running") return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = melody[note.current++ % melody.length];
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume * 0.13), ctx.currentTime + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.65);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.7);
    }, 520);
    return () => { if (timer.current !== null) window.clearInterval(timer.current); timer.current = null; };
  }, [enabled, volume]);

  const playEffect = (correct: boolean) => {
    if (!context.current || !ready || context.current.state !== "running") return;
    const ctx = context.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(correct ? 660 : 180, ctx.currentTime);
    if (correct) osc.frequency.exponentialRampToValueAtTime(990, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.001, volume * 0.6), ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.22);
    osc.connect(gain); gain.connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + 0.24);
  };
  return { enabled, volume, setVolume, start, stop, playEffect };
}

export default function App() {
  const [category, setCategory] = useState("All topics");
  const [screen, setScreen] = useState<"home" | "quiz" | "results" | "leaderboard">("home");
  const [questionBank, setQuestionBank] = useState<Question[]>(QUESTIONS);
  const [questions, setQuestions] = useState<Question[]>(QUESTIONS);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(15);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [soundOn, setSoundOn] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signup");
  const [authEmail, setAuthEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [leaderboard, setLeaderboard] = useState<{display_name:string;score:number;category:string;correct_answers:number;total_questions:number;created_at:string}[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [authPassword, setAuthPassword] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [saveStatus, setSaveStatus] = useState("Your score will be saved when this round finishes.");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const music = useGameMusic();
  const current = questions[index];
  const progress = questions.length ? (index / questions.length) * 100 : 0;

  useEffect(() => {
    if (!supabase) return;
    supabase.from("questions").select("category, question, options, correct_index, explanation").eq("is_active", true).limit(50)
      .then(({ data, error }) => {
        if (error || !data?.length) return;
        const loaded = data.map((q: any) => ({ category: q.category, question: q.question, options: q.options as string[], answer: q.correct_index, explanation: q.explanation ?? "" }));
        setQuestionBank(loaded);
        setQuestions(loaded);
      });
  }, []);

  const startQuiz = (selectedCategory = category) => {
    const sourceQuestions = questionBank.length ? questionBank : QUESTIONS;
    const pool = sourceQuestions.filter(q => selectedCategory === "All topics" || q.category === selectedCategory);
    const next = [...pool].sort(() => Math.random() - 0.5);
    setQuestions(next.length ? next : QUESTIONS);
    setCategory(selectedCategory);
    setIndex(0); setSelected(null); setSecondsLeft(15); setScore(0); setAnswers([]);
    setScreen("quiz");
  };

  useEffect(() => {
    if (screen !== "quiz" || selected !== null || secondsLeft <= 0) return;
    const timerId = window.setInterval(() => setSecondsLeft(s => Math.max(0, s - 1)), 1000);
    return () => window.clearInterval(timerId);
  }, [screen, selected, secondsLeft]);

  useEffect(() => {
    if (screen === "quiz" && secondsLeft === 0 && selected === null) {
      setSelected(-1);
      setAnswers(a => [...a, false]);
    }
  }, [screen, secondsLeft, selected]);

  const chooseAnswer = (choice: number) => {
    if (selected !== null) return;
    setSelected(choice);
    const correct = choice === current.answer;
    if (correct) setScore(s => s + 100);
    setAnswers(a => [...a, correct]);
    if (soundOn) music.playEffect(correct);
  };

  const nextQuestion = () => {
    if (index + 1 >= questions.length) { setScreen("results"); return; }
    setIndex(i => i + 1); setSelected(null); setSecondsLeft(15);
  };

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setUserEmail(data.session?.user.email ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setUserEmail(session?.user.email ?? null));
    return () => listener.subscription.unsubscribe();
  }, []);

  const handleAuth = async () => {
    if (!supabase) { setAuthMessage("Add your Supabase URL and publishable key to enable accounts."); return; }
    setAuthMessage("");
    const result = authMode === "signup"
      ? await supabase.auth.signUp({ email: authEmail.trim(), password: authPassword, options: { data: { display_name: displayName.trim() } } })
      : await supabase.auth.signInWithPassword({ email: authEmail.trim(), password: authPassword });
    if (result.error) { setAuthMessage(result.error.message); return; }
    if (authMode === "signup" && !result.data.session) {
      setAuthMessage("Account created. Check your email to confirm it, then sign in.");
    } else {
      setUserEmail(result.data.user?.email ?? authEmail.trim());
      setShowAuth(false);
      setAuthPassword("");
    }
  };

  const handleSignOut = async () => {
    if (supabase) await supabase.auth.signOut();
    setUserEmail(null);
  };

  useEffect(() => {
    if (screen !== "leaderboard") return;
    setLeaderboardLoading(true);
    if (!supabase) { setLeaderboardLoading(false); return; }
    supabase.from("leaderboard").select("display_name,score,category,correct_answers,total_questions,created_at").order("score", { ascending: false }).order("created_at", { ascending: true }).limit(50).then(({ data, error }) => {
      if (!error && data) setLeaderboard(data as typeof leaderboard);
      setLeaderboardLoading(false);
    });
  }, [screen]);

  const saveResult = async () => {
    if (!supabase) {
      setSaveStatus("Score not saved: Supabase is not configured. Check your .env.local file.");
      return;
    }
    setSaveStatus("Saving your score…");
    const { data, error: userError } = await supabase.auth.getUser();
    if (userError || !data.user) {
      setSaveStatus("Score not saved: please sign in again, then finish another quiz.");
      return;
    }
    const { error } = await supabase.from("quiz_attempts").insert({ user_id: data.user.id, category, score, total_questions: questions.length, correct_answers: answers.filter(Boolean).length });
    if (error) {
      console.error("Brain Battle could not save quiz result:", error);
      setSaveStatus("Score not saved: " + error.message);
      return;
    }
    setSaveStatus("Score saved successfully!");
  };
  useEffect(() => { if (screen === "results") void saveResult(); }, [screen]);

  return <div className="app-shell">
    <div className="ambient ambient-one" /><div className="ambient ambient-two" />
    <header className="topbar">
      <button className="brand" onClick={() => setScreen("home")} aria-label="Brain Battle home"><span className="brand-icon"><Brain size={23}/></span><span>brain<span className="brand-accent">battle</span><small>THINK FAST. PLAY SMART.</small></span></button>
      <nav><button className={screen === "home" ? "nav-active" : ""} onClick={() => setScreen("home")}><Home size={16}/> Home</button><button className={screen === "leaderboard" ? "nav-active" : ""} onClick={() => setScreen("leaderboard")}><Trophy size={16}/> Scores</button><button onClick={() => setShowSettings(v => !v)}><Settings2 size={16}/> Settings</button></nav>
      <div className="topbar-actions">{userEmail ? <button className="account-button" onClick={() => void handleSignOut()} title="Click to sign out"><span className="account-dot"/> {userEmail.split("@")[0]} · Sign out</button> : <button className="account-button" onClick={() => { setShowAuth(true); setAuthMessage(""); }}><CircleHelp size={15}/> Sign in</button>}<button className="sound-button" onClick={() => setShowSettings(v => !v)} aria-label="Sound settings">{music.enabled ? <Music2 size={18}/> : <VolumeX size={18}/>}<span>Sound</span></button></div>
    </header>

    {showAuth && <div className="modal-backdrop" onClick={() => setShowAuth(false)}><section className="auth-panel" onClick={e => e.stopPropagation()}><button className="auth-close" onClick={() => setShowAuth(false)} aria-label="Close sign in">×</button><div className="auth-mark"><Brain size={24}/></div><span className="eyebrow">YOUR PERSONAL SCORECARD</span><h2>{authMode === "signup" ? "Join Brain Battle" : "Welcome back"}</h2><p>Save your quiz results and keep track of your progress.</p><form onSubmit={e => { e.preventDefault(); void handleAuth(); }}>{authMode === "signup" && <><label>Display name</label><input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Your player name" maxLength={24} autoComplete="nickname" required/></>}<label>Email address</label><input type="email" value={authEmail} onChange={e => setAuthEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" required/><label>Password</label><input type="password" value={authPassword} onChange={e => setAuthPassword(e.target.value)} placeholder="At least 6 characters" minLength={6} autoComplete={authMode === "signup" ? "new-password" : "current-password"} required/><button className="primary-button auth-submit" type="submit">{authMode === "signup" ? "Create account" : "Sign in"} <ChevronRight size={16}/></button></form>{authMessage && <p className="auth-message">{authMessage}</p>}<div className="auth-switch">{authMode === "signup" ? "Already have an account?" : "New to Brain Battle?"}<button onClick={() => { setAuthMode(authMode === "signup" ? "signin" : "signup"); setAuthMessage(""); }}>{authMode === "signup" ? "Sign in" : "Create account"}</button></div><small className="auth-footnote">Your password is handled securely by Supabase Auth.</small></section></div>}

    {showSettings && <section className="settings-panel">
      <div className="settings-heading"><div><strong>Audio settings</strong><p>Make the vibe yours.</p></div><button className="icon-button" onClick={() => setShowSettings(false)}>×</button></div>
      <div className="setting-row"><span><Music2 size={17}/> Background music</span><button className={music.enabled ? "toggle toggle-on" : "toggle"} onClick={() => music.enabled ? music.stop() : void music.start()}>{music.enabled ? "On" : "Off"}</button></div>
      <div className="setting-row"><span><Headphones size={17}/> Answer sound effects</span><button className={soundOn ? "toggle toggle-on" : "toggle"} onClick={() => setSoundOn(v => !v)}>{soundOn ? "On" : "Off"}</button></div>
      <label className="volume-label"><span>Music volume</span><span>{Math.round(music.volume * 100)}%</span></label><input className="volume-slider" type="range" min="0" max="0.5" step="0.01" value={music.volume} onChange={e => music.setVolume(Number(e.target.value))}/>
      {!music.enabled && <p className="settings-note">Tap music On to start the original synthesized soundtrack. No audio files or extra downloads needed.</p>}
    </section>}

    {screen === "home" && <>
      <main className="hero">
        <div className="hero-copy"><div className="eyebrow"><Sparkles size={14}/> YOUR NEXT BRAIN BREAK</div><h1>Ready to test<br/>your <span>brain power?</span></h1><p>Challenge your knowledge, beat the clock, and climb your way to the top. Every question gets you closer to genius status.</p><div className="hero-actions"><button className="primary-button" onClick={() => startQuiz()}><Zap size={18} fill="currentColor"/> Play now <ChevronRight size={18}/></button><button className="secondary-button" onClick={() => { setShowSettings(true); if (!music.enabled) void music.start(); }}><Music2 size={17}/> Feel the vibe</button></div><div className="hero-proof"><span className="avatar-stack"><i>🧠</i><i>⚡</i><i>🎯</i></span><span><strong>Curiosity looks good on you.</strong><small>10 quick questions • 5 categories</small></span></div></div>
        <div className="hero-art"><div className="orbit orbit-a"/><div className="orbit orbit-b"/><div className="brain-card"><div className="brain-glow">🧠</div><span className="floating-tag tag-top"><Zap size={15}/> +100 XP</span><span className="floating-tag tag-bottom"><Crown size={15}/> TOP THINKER</span><span className="sparkle s-one">✦</span><span className="sparkle s-two">✧</span></div><div className="mini-stat stat-left"><span className="stat-icon purple"><Zap size={16}/></span><span><small>Quick round</small><strong>2–4 min</strong></span></div><div className="mini-stat stat-right"><span className="stat-icon green">✓</span><span><small>Keep learning</small><strong>One Q at a time</strong></span></div></div>
      </main>
      <section className="category-section"><div className="section-heading"><div><span className="eyebrow">PICK YOUR CHALLENGE</span><h2>Choose a category</h2></div><span className="category-count"><CircleHelp size={15}/> 5 categories</span></div><div className="category-grid">{categories.map(c => <button key={c.name} onClick={() => { setCategory(c.name); startQuiz(c.name); }} className={"category-card " + c.color}><span className="category-emoji">{c.emoji}</span><span className="category-name">{c.name}</span><span className="category-sub">{c.name === "All topics" ? "Mixed questions" : "Test your knowledge"}</span><span className="category-arrow"><ChevronRight size={17}/></span></button>)}</div></section>
      <footer className="footer"><span>© 2026 Brain Battle</span><span><Sparkles size={13}/> Made for curious minds</span><button onClick={() => { setShowSettings(true); window.scrollTo({top:0,behavior:"smooth"}); }}><Volume2 size={14}/> Audio settings</button></footer>
    </>}

    {screen === "leaderboard" && <main className="leaderboard-wrap"><div className="leaderboard-heading"><span className="eyebrow"><Crown size={14}/> THE BRAIN BATTLE ARENA</span><h1>Top <span>thinkers.</span></h1><p>Every round is a chance to climb the ranks. Play a quiz to get on the board.</p><button className="secondary-button" onClick={() => startQuiz("All topics")}><Zap size={16}/> Play a round</button></div><section className="leaderboard-card"><div className="leaderboard-card-title"><div><Trophy size={18}/><strong>Leaderboard</strong></div><span>ALL-TIME SCORES</span></div>{leaderboardLoading ? <p className="leaderboard-empty">Loading scores…</p> : leaderboard.length === 0 ? <div className="leaderboard-empty"><span>🏆</span><strong>Be the first brain champion</strong><p>Sign in and complete a quiz to start building the leaderboard.</p></div> : <div className="leaderboard-list">{leaderboard.map((entry,i) => <div className="leaderboard-row" key={`${entry.display_name}-${entry.created_at}-${i}`}><span className={`leaderboard-rank rank-${i+1}`}>{i===0?"♛":String(i+1).padStart(2,"0")}</span><span className="leaderboard-avatar">{entry.display_name.trim().charAt(0).toUpperCase() || "B"}</span><span className="leaderboard-player"><strong>{entry.display_name}</strong><small>{entry.category} · {entry.correct_answers}/{entry.total_questions} correct</small></span><strong className="leaderboard-points">{entry.score.toLocaleString()} <small>PTS</small></strong></div>)}</div>}<button className="leaderboard-refresh" onClick={() => { setLeaderboardLoading(true); if (supabase) void supabase.from("leaderboard").select("display_name,score,category,correct_answers,total_questions,created_at").order("score",{ascending:false}).order("created_at",{ascending:true}).limit(50).then(({data,error})=>{if(!error&&data)setLeaderboard(data as typeof leaderboard);setLeaderboardLoading(false);}); else setLeaderboardLoading(false); }}>Refresh scores <RotateCcw size={14}/></button></section></main>}

    {screen === "quiz" && current && <main className="quiz-wrap"><div className="quiz-topline"><button className="back-link" onClick={() => setScreen("home")}><Home size={15}/> Exit quiz</button><span className="round-label">ROUND {String(index + 1).padStart(2, "0")} <i>/ {String(questions.length).padStart(2, "0")}</i></span><span className="score-pill"><Zap size={15} fill="currentColor"/> {score} pts</span></div><div className="progress-track"><div style={{width: progress + "%"}}/></div><section className="question-card"><div className="question-meta"><span className="topic-pill">{categories.find(c => c.name === current.category)?.emoji} {current.category}</span><span className={"quick-pill timer-pill " + (secondsLeft <= 5 && selected === null ? "timer-urgent" : "")}><Timer size={13}/> {selected === -1 ? "TIME UP" : `${String(secondsLeft).padStart(2,"0")} SEC`}</span></div><div className="question-number">QUESTION {String(index + 1).padStart(2, "0")}</div><h1>{current.question}</h1><p className="question-hint">Choose the best answer below.</p><div className="answers-grid">{current.options.map((option, i) => <button key={option} disabled={selected !== null} onClick={() => chooseAnswer(i)} className={"answer-option " + (selected !== null && i === current.answer ? "answer-correct" : selected === i ? "answer-wrong" : "")}><span className="answer-letter">{String.fromCharCode(65 + i)}</span><span>{option}</span><span className="answer-status">{selected !== null && i === current.answer ? "✓" : selected === i ? "×" : ""}</span></button>)}</div>{selected !== null && <div className={"explanation " + (selected === current.answer ? "explanation-good" : "explanation-bad")}><strong>{selected === current.answer ? "Brilliant! +100 points" : selected === -1 ? "Time’s up! Keep moving." : "Not quite — keep going!"}</strong><p>{current.explanation}</p></div>}<div className="question-footer"><span><CircleHelp size={15}/> {selected === null ? "Trust your instincts" : "Answer locked in"}</span><button className="primary-button" disabled={selected === null} onClick={nextQuestion}>{index + 1 === questions.length ? "See results" : "Next question"} <ChevronRight size={17}/></button></div></section><div className="quiz-bottom"><span><Music2 size={15}/> {music.enabled ? "Chill mode is on" : "Want a soundtrack?"}</span><button onClick={() => music.enabled ? music.stop() : void music.start()}>{music.enabled ? <Pause size={14}/> : <Play size={14}/>} {music.enabled ? "Pause music" : "Play music"}</button><button onClick={() => setShowSettings(true)}><Settings2 size={14}/> Sound settings</button></div></main>}

    {screen === "results" && <main className="results-wrap"><div className="results-card"><div className="results-medal">{score >= questions.length * 70 ? "🏆" : score > 0 ? "⚡" : "🧠"}</div><span className="eyebrow">ROUND COMPLETE</span><h1>{score >= questions.length * 70 ? "You're on fire!" : "Good game, thinker!"}</h1><p>Every round makes your brain a little stronger.</p><p role="status" aria-live="polite" className="save-status">{saveStatus}</p><div className="results-score">{score}<small>POINTS</small></div><div className="results-stats"><div><strong>{answers.filter(Boolean).length}/{questions.length}</strong><span>Correct answers</span></div><div><strong>{Math.round(answers.filter(Boolean).length / Math.max(1, questions.length) * 100)}%</strong><span>Accuracy</span></div><div><strong>{questions.length * 100}</strong><span>Max points</span></div></div><div className="results-actions"><button className="primary-button" onClick={() => startQuiz(category)}><RotateCcw size={17}/> Play again</button><button className="secondary-button" onClick={() => setScreen("home")}><Home size={17}/> Back home</button></div></div></main>}
  </div>;
}