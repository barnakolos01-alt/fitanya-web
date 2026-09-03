import React from "react";
import { C, serif } from "../../styles/tokens";

export default function SectionHeader({ title, subtitle, icon: Icon, rightAction }) {
  return (
    <div className="mb-5 flex items-start justify-between gap-2.5">
      <div className="flex items-start gap-2.5">
        {Icon && (
          <div
            className="w-8 h-8 rounded-2xl flex items-center justify-center flex-shrink-0 mt-0.5"
            style={{ backgroundColor: C.coral }}
          >
            <Icon size={15} color="#fff" />
          </div>
        )}
        <div>
          <h2 style={{ fontFamily: serif, color: C.textDark }} className="text-xl font-semibold leading-snug">
            {title}
          </h2>
          {subtitle && (
            <p style={{ color: C.textSoft }} className="text-sm mt-0.5 leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {rightAction}
    </div>
  );
}
