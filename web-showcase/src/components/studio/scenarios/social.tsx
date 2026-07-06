"use client";

import { useStudio } from "../studio-context";
import {
  Heart,
  MessageCircle,
  Repeat2,
  Send,
  CheckCircle2,
  UserPlus,
  UserCheck,
} from "lucide-react";
import { useState } from "react";

export function SocialScenario() {
  const { roleMapping } = useStudio();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(142);
  const [shared, setShared] = useState(false);
  const [shareCount, setShareCount] = useState(38);
  const [followed, setFollowed] = useState(false);

  const toggleLike = () => {
    if (liked) {
      setLiked(false);
      setLikeCount((prev) => prev - 1);
    } else {
      setLiked(true);
      setLikeCount((prev) => prev + 1);
    }
  };

  const toggleShare = () => {
    if (shared) {
      setShared(false);
      setShareCount((prev) => prev - 1);
    } else {
      setShared(true);
      setShareCount((prev) => prev + 1);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Main Feed */}
      <div className="lg:col-span-8 space-y-4">
        {/* Post Card */}
        <div
          className="p-6 rounded-[2rem] border transition-colors duration-300"
          data-role="--ui-color-4"
          style={{
            backgroundColor: roleMapping["--ui-color-4"], // Card Surface
            borderColor: roleMapping["--ui-color-5"], // Subtle Border
          }}
        >
          {/* Post Header */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center font-black text-sm text-white"
                data-role="--ui-color-1"
                style={{ backgroundColor: roleMapping["--ui-color-1"] }} // Brand Primary
              >
                JD
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span
                    className="font-bold text-sm tracking-tight"
                    data-role="--ui-color-6"
                    style={{ color: roleMapping["--ui-color-6"] }} // Primary Text
                  >
                    Jane Designer
                  </span>
                  <CheckCircle2
                    className="h-4 w-4 fill-current"
                    data-role="--ui-color-1"
                    style={{ color: roleMapping["--ui-color-1"] }} // Brand Primary
                  />
                </div>
                <span
                  className="text-xs font-semibold"
                  data-role="--ui-color-7"
                  style={{ color: roleMapping["--ui-color-7"] }} // Muted Text
                >
                  @janedesigner • 2h
                </span>
              </div>
            </div>
            <button
              onClick={() => setFollowed(!followed)}
              className="flex items-center gap-1 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-300 active:scale-95"
              data-role={followed ? "--ui-color-5" : "--ui-color-1"}
              style={{
                backgroundColor: followed
                  ? roleMapping["--ui-color-5"]
                  : roleMapping["--ui-color-1"],
                color: followed
                  ? roleMapping["--ui-color-6"]
                  : roleMapping["--ui-color-4"],
              }}
            >
              {followed ? (
                <>
                  <UserCheck className="h-3 w-3" />
                  <span>Following</span>
                </>
              ) : (
                <>
                  <UserPlus className="h-3 w-3" />
                  <span>Follow</span>
                </>
              )}
            </button>
          </div>

          {/* Post Body */}
          <div className="space-y-4">
            <p
              className="text-sm leading-relaxed font-medium"
              data-role="--ui-color-6"
              style={{ color: roleMapping["--ui-color-6"] }}
            >
              Experimenting with our new color systems library. The palette
              values feel incredibly rich when mapped to interfaces! How does
              this look?{" "}
              <span
                className="font-bold hover:underline cursor-pointer"
                data-role="--ui-color-2"
                style={{ color: roleMapping["--ui-color-2"] }} // Accent Secondary
              >
                #uiux #designsystem #scss
              </span>
            </p>

            {/* Media Attachment (Gradient Block) */}
            <div
              className="h-48 sm:h-64 rounded-2xl relative overflow-hidden flex items-end p-6 border group"
              data-role="--ui-color-1"
              style={{
                background: `linear-gradient(135deg, ${roleMapping["--ui-color-1"]} 0%, ${roleMapping["--ui-color-2"]} 100%)`,
                borderColor: roleMapping["--ui-color-5"],
              }}
            >
              <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative z-10 bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-xl text-white max-w-sm">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/70">
                  Palette Preview
                </p>
                <h4 className="font-bold text-sm leading-tight mt-1">
                  Linear Gradient Mesh Simulation
                </h4>
              </div>
            </div>

            {/* Actions Footer */}
            <div
              className="flex justify-between items-center pt-2 border-t"
              data-role="--ui-color-5"
              style={{ borderColor: roleMapping["--ui-color-5"] }}
            >
              <div className="flex gap-6">
                {/* Comment Button */}
                <button
                  className="flex items-center gap-2 text-xs font-bold transition-colors group"
                  data-role="--ui-color-7"
                  style={{ color: roleMapping["--ui-color-7"] }}
                >
                  <MessageCircle className="h-4 w-4 group-hover:scale-110 transition-transform" />
                  <span>24</span>
                </button>

                {/* Retweet Button */}
                <button
                  onClick={toggleShare}
                  className="flex items-center gap-2 text-xs font-bold transition-colors group"
                  data-role={shared ? "--ui-color-8" : "--ui-color-7"}
                  style={{
                    color: shared
                      ? roleMapping["--ui-color-8"]
                      : roleMapping["--ui-color-7"],
                  }} // Success State
                >
                  <Repeat2 className="h-4 w-4 group-hover:rotate-180 transition-transform duration-500" />
                  <span>{shareCount}</span>
                </button>

                {/* Like Button */}
                <button
                  onClick={toggleLike}
                  className="flex items-center gap-2 text-xs font-bold transition-colors group"
                  data-role={liked ? "--ui-color-10" : "--ui-color-7"}
                  style={{
                    color: liked
                      ? roleMapping["--ui-color-10"]
                      : roleMapping["--ui-color-7"],
                  }} // Danger State (Red)
                >
                  <Heart
                    className={`h-4 w-4 group-hover:scale-125 transition-transform ${liked ? "fill-current" : ""}`}
                  />
                  <span>{likeCount}</span>
                </button>
              </div>

              <button
                className="flex items-center gap-1.5 text-xs font-bold transition-colors"
                data-role="--ui-color-7"
                style={{ color: roleMapping["--ui-color-7"] }}
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Side Column */}
      <div className="lg:col-span-4 flex flex-col gap-4">
        {/* Activity Card */}
        <div
          className="p-6 rounded-[2rem] border space-y-4"
          data-role="--ui-color-4"
          style={{
            backgroundColor: roleMapping["--ui-color-4"],
            borderColor: roleMapping["--ui-color-5"],
          }}
        >
          <h4
            className="text-[10px] font-black uppercase tracking-widest"
            data-role="--ui-color-7"
            style={{ color: roleMapping["--ui-color-7"] }}
          >
            Engagement Pulse
          </h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span
                className="text-xs font-bold"
                data-role="--ui-color-6"
                style={{ color: roleMapping["--ui-color-6"] }}
              >
                Active Users
              </span>
              <span
                className="text-xs font-black px-2 py-0.5 rounded-full"
                data-role="--ui-color-8"
                style={{
                  backgroundColor: roleMapping["--ui-color-8"] + "22",
                  color: roleMapping["--ui-color-8"],
                }}
              >
                +18%
              </span>
            </div>
            <div className="h-1.5 w-full bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                data-role="--ui-color-8"
                style={{
                  backgroundColor: roleMapping["--ui-color-8"],
                  width: "72%",
                }}
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span
                className="text-xs font-bold"
                data-role="--ui-color-6"
                style={{ color: roleMapping["--ui-color-6"] }}
              >
                Server Status
              </span>
              <span
                className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider"
                data-role="--ui-color-8"
                style={{ color: roleMapping["--ui-color-8"] }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping" />
                Operational
              </span>
            </div>
          </div>
        </div>

        {/* Tip Box */}
        <div
          className="p-6 rounded-[2rem] border transition-colors duration-300"
          data-role="--ui-color-1"
          style={{
            backgroundColor: roleMapping["--ui-color-1"] + "11",
            borderColor: roleMapping["--ui-color-1"] + "22",
          }}
        >
          <h4
            className="text-xs font-black uppercase mb-2 tracking-widest"
            data-role="--ui-color-1"
            style={{ color: roleMapping["--ui-color-1"] }}
          >
            Social Mock
          </h4>
          <p
            className="text-[11px] leading-relaxed font-medium"
            data-role="--ui-color-7"
            style={{ color: roleMapping["--ui-color-7"] }}
          >
            Verifying avatar surfaces against primary background and hover state
            changes for interactive components.
          </p>
        </div>
      </div>
    </div>
  );
}
