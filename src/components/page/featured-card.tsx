"use client";

import { ChevronRight } from "lucide-react";
import { motion, useMotionValue, useTransform, useSpring } from "motion/react";
import { useState } from "react";

// Noise Overlay Component (simplified for demo)
export const NoiseOverlay = ({ theme }: { theme: any }) => (
  <div
    className="absolute inset-0 opacity-20"
    style={{
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
      mixBlendMode: "overlay",
    }}
  />
);

export const FeatureCard = ({
  title,
  href,
  imageSrc,
  description,
  Logo,
}: {
  title: string;
  href: string;
  imageSrc: string;
  description: string;
  Logo?: React.ReactNode;
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useTransform(mouseY, [-0.5, 0.5], [5, -5]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-5, 5]);

  const springConfig = { damping: 20, stiffness: 300 };
  const rotateXSpring = useSpring(rotateX, springConfig);
  const rotateYSpring = useSpring(rotateY, springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const x = (e.clientX - rect.left - width / 2) / width;
    const y = (e.clientY - rect.top - height / 2) / height;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
    setIsHovered(false);
  };

  return (
    <motion.div
      onClick={() => (window.location.href = href)}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      className="relative block h-[calc(100vh-12rem)] min-h-[600px] cursor-pointer"
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.3 }}>
      <div className="relative h-full w-full overflow-hidden rounded-lg border-2 border-border bg-background shadow-lg">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src={imageSrc}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-700"
            style={{
              transform: isHovered ? "scale(1.1)" : "scale(1)",
            }}
          />
        </div>

        {/* Content */}
        <div className="relative h-full z-10 flex flex-col justify-between p-8 items-center text-center">
          {/* Top Badge - static (no hover animation) */}
          <div className="w-full flex justify-center">
            <span className="px-3 py-0.5 text-xs font-medium tracking-wider uppercase bg-accent/20 text-accent  border border-accent/30">
              {/* Explore */}
            </span>
          </div>
          {Logo && (
            <div className="flex items-center max-w-[150px] justify-center">
              {Logo}
            </div>
          )}

          {/* Title, Logos (optional) and Description - always visible */}
          <div className="space-y-4 flex flex-col items-center">
            <h2 className="text-lg uppercase text-white tracking-[3px] font-medium">
              {title}
            </h2>

            <p className="text-md text-white leading-tight font-medium max-w-md mx-auto">
              {description}
            </p>

            {/* Arrow indicator - static (no hover animation) */}
            {/* <div className="flex items-center justify-center gap-2 text-accent underline italic">
              <span className="text-sm font-medium">Enter</span>
              <ChevronRight className="w-4 h-4" />
            </div> */}
          </div>
        </div>
        {/* Border Glow Effect */}
        <motion.div
          className="absolute inset-0 rounded-lg pointer-events-none"
          animate={{
            boxShadow: isHovered
              ? "0 0 0 2px rgba(var(--primary-rgb), 0.5), 0 20px 60px -15px rgba(0, 0, 0, 0.3)"
              : "0 0 0 2px transparent, 0 0 0 0 transparent",
          }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </motion.div>
  );
};
