const colors = ['#c8f23a', '#138a57', '#e2402f', '#5ab8f0', '#f2b33a', '#9be36d'];

// Short burst of falling confetti for the "You are all set!" screen.
export const Confetti = () => (
  <div className="confetti" aria-hidden>
    {Array.from({ length: 70 }, (_, i) => {
      const r = (n: number) => {
        const x = Math.sin(i * 7919 + n * 104729) * 10000;
        return x - Math.floor(x);
      };
      return (
        <i
          key={i}
          style={{
            left: `${r(1) * 100}%`,
            background: colors[i % colors.length],
            animationDuration: `${2.4 + r(2) * 2.6}s`,
            animationDelay: `${r(3) * 0.9}s`,
            width: r(4) > 0.5 ? 7 : 5,
            height: r(4) > 0.5 ? 9 : 5,
            borderRadius: r(5) > 0.6 ? '50%' : 2,
          }}
        />
      );
    })}
  </div>
);
