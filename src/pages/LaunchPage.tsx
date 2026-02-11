import { useState } from "react";
import { motion } from "framer-motion";
import { PenTool, ArrowLeft } from "lucide-react";

interface LaunchPageProps {
  onEnter: () => void;
}

type View = "login" | "register" | "forgot";

/* 通用输入框 / 按钮样式 */
const inputClass =
  "w-full px-4 py-2.5 rounded-lg border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-2 focus:ring-primary/30 transition-shadow";
const primaryBtnClass =
  "w-full px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity";
const outlineBtnClass =
  "w-full px-4 py-2.5 rounded-lg border border-border text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors";

/**
 * 启动页 — Logo 呼吸动画 + 登录 / 注册 / 找回密码 三个视图
 * MVP 阶段只做 UI，不写后端登录逻辑
 */
export function LaunchPage({ onEnter }: LaunchPageProps) {
  const [view, setView] = useState<View>("login");

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-background text-foreground select-none">
      {/* Logo 呼吸动画 */}
      <motion.div
        className="flex flex-col items-center gap-3 mb-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <motion.div
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center"
        >
          <PenTool className="w-10 h-10 text-primary" />
        </motion.div>
        <h1 className="text-2xl font-bold tracking-wide">心作</h1>
        <p className="text-sm text-muted-foreground">专为网络小说作家打造的写作 IDE</p>
      </motion.div>

      {/* 表单区域 — 根据 view 切换 */}
      <motion.div
        key={view}
        className="w-full max-w-xs flex flex-col gap-3"
        initial={{ opacity: 0, x: view === "login" ? 0 : 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        {view === "login" && <LoginForm onEnter={onEnter} onSwitch={setView} />}
        {view === "register" && <RegisterForm onEnter={onEnter} onSwitch={setView} />}
        {view === "forgot" && <ForgotPasswordForm onSwitch={setView} />}
      </motion.div>

      {/* 版本号 */}
      <motion.p
        className="absolute bottom-6 text-xs text-muted-foreground/50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        v0.1.0-alpha
      </motion.p>
    </div>
  );
}

/* ---- 登录表单 ---- */
function LoginForm({ onEnter, onSwitch }: { onEnter: () => void; onSwitch: (v: View) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <>
      <input type="email" placeholder="邮箱" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
      <input type="password" placeholder="密码" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} />
      <button onClick={onEnter} className={primaryBtnClass}>登录</button>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <button onClick={() => onSwitch("register")} className="hover:text-foreground transition-colors">
          注册账号
        </button>
        <button onClick={() => onSwitch("forgot")} className="hover:text-foreground transition-colors">
          忘记密码？
        </button>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <div className="flex-1 h-px bg-border" />
        <span>或</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <button onClick={onEnter} className={outlineBtnClass}>跳过，离线使用</button>
    </>
  );
}

/* ---- 注册表单 ---- */
function RegisterForm({ onEnter, onSwitch }: { onEnter: () => void; onSwitch: (v: View) => void }) {
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  return (
    <>
      <button onClick={() => onSwitch("login")} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors self-start mb-1">
        <ArrowLeft className="w-3.5 h-3.5" />
        返回登录
      </button>
      <p className="text-base font-medium text-center">创建账号</p>
      <input type="text" placeholder="笔名 / 昵称" value={nickname} onChange={(e) => setNickname(e.target.value)} className={inputClass} />
      <input type="email" placeholder="邮箱" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
      <input type="password" placeholder="密码" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} />
      <input type="password" placeholder="确认密码" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputClass} />
      <button onClick={onEnter} className={primaryBtnClass}>注册</button>
      <p className="text-xs text-center text-muted-foreground">
        注册即代表同意{" "}
        <span className="text-primary cursor-pointer">服务条款</span> 和{" "}
        <span className="text-primary cursor-pointer">隐私政策</span>
      </p>
    </>
  );
}

/* ---- 找回密码表单 ---- */
function ForgotPasswordForm({ onSwitch }: { onSwitch: (v: View) => void }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <>
      <button onClick={() => onSwitch("login")} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors self-start mb-1">
        <ArrowLeft className="w-3.5 h-3.5" />
        返回登录
      </button>
      <p className="text-base font-medium text-center">找回密码</p>
      <p className="text-xs text-muted-foreground text-center">输入注册时使用的邮箱，我们将发送重置链接</p>
      <input type="email" placeholder="邮箱" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
      {sent ? (
        <p className="text-xs text-center text-green-500">重置链接已发送，请查收邮箱</p>
      ) : (
        <button onClick={() => setSent(true)} className={primaryBtnClass}>发送重置链接</button>
      )}
    </>
  );
}
