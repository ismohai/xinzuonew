import { cn } from "@/lib/utils";

interface Props {
  className?: string;
}

export const UserAvatar = ({ className }: Props) => {
  return (
    <div className={cn("w-8 h-8 overflow-clip rounded-xl", className)}>
      <svg
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* 背景 */}
        <rect width="100" height="100" rx="20" fill="#6C5CE7" />

        {/* 脸 */}
        <circle cx="50" cy="48" r="26" fill="#FFEAA7" />

        {/* 眼睛 */}
        <ellipse cx="40" cy="45" rx="3.5" ry="4" fill="#2D3436" />
        <ellipse cx="60" cy="45" rx="3.5" ry="4" fill="#2D3436" />
        {/* 眼睛高光 */}
        <circle cx="41.5" cy="43.5" r="1.2" fill="#FFF" />
        <circle cx="61.5" cy="43.5" r="1.2" fill="#FFF" />

        {/* 腮红 */}
        <ellipse cx="33" cy="53" rx="5" ry="3" fill="#FAB1A0" opacity="0.6" />
        <ellipse cx="67" cy="53" rx="5" ry="3" fill="#FAB1A0" opacity="0.6" />

        {/* 微笑 */}
        <path d="M42 54 Q50 62 58 54" stroke="#2D3436" strokeWidth="2" fill="none" strokeLinecap="round" />

        {/* 头发 */}
        <path
          d="M24 42 Q24 22 50 20 Q76 22 76 42"
          fill="#2D3436"
        />
        {/* 刘海 */}
        <path
          d="M30 38 Q35 28 44 32 Q40 26 50 24 Q46 30 52 32 Q56 24 62 28 Q58 32 64 34 Q68 26 72 38"
          fill="#2D3436"
        />

        {/* 笔 (写作者标志) */}
        <g transform="translate(68, 65) rotate(-30)">
          <rect x="0" y="0" width="5" height="20" rx="1" fill="#FD79A8" />
          <polygon points="0,20 5,20 2.5,26" fill="#FDCB6E" />
          <rect x="0" y="0" width="5" height="4" rx="1" fill="#E17055" />
        </g>
      </svg>
    </div>
  );
};

export default UserAvatar;
