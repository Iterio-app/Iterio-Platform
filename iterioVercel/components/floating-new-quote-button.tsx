"use client"

import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Plane, Hotel, Map } from "lucide-react";
import { useState } from "react";

const MODES: { key: 'flight' | 'flight_hotel' | 'full', icon: JSX.Element, title: string, desc: string }[] = [
  {
    key: "flight",
    icon: <Plane className="h-6 w-6 text-blue-600" />,
    title: "Vuelo",
    desc: "Solo cotiza vuelos para tu cliente."
  },
  {
    key: "flight_hotel",
    icon: <Hotel className="h-6 w-6 text-amber-500 inline-block" />,
    title: "Vuelo + Alojamiento",
    desc: "Cotiza vuelos y alojamiento juntos."
  },
  {
    key: "full",
    icon: <Map className="h-6 w-6 text-green-600" />,
    title: "Itinerario completo",
    desc: "Incluye vuelos, alojamiento, traslados y servicios."
  }
];

export default function FloatingNewQuoteButton({ onSelect }: { onSelect: (mode: 'flight' | 'flight_hotel' | 'full') => void }) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          size="default"
          className="fixed bottom-4 right-4 lg:bottom-6 lg:right-6 z-50 shadow-lg bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-3 py-2 lg:px-4 lg:py-2 text-sm lg:text-base font-semibold flex items-center gap-1 lg:gap-2 transition-transform duration-200 hover:scale-110"
          aria-label="Nueva Cotización"
        >
          <span className="text-lg lg:text-xl">+</span>
          <span className="hidden sm:inline">Nueva Cotización</span>
          <span className="sm:hidden">Nueva</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent sideOffset={10} className="w-[260px] p-2 py-2 rounded-xl shadow-xl border-0">
        <div className="mb-2 text-center text-base font-bold text-gray-900">¿Qué deseas cotizar?</div>
        <div className="flex flex-col gap-2">
          {MODES.map((mode) => (
            <button
              key={mode.key}
              className="flex items-center gap-3 p-2 rounded-lg border border-gray-200 bg-gray-50 hover:bg-blue-50 transition group focus:outline-none"
              onClick={() => { setOpen(false); onSelect(mode.key as 'flight' | 'flight_hotel' | 'full'); }}
              type="button"
            >
              <div className="flex-shrink-0">{mode.icon}</div>
              <div className="text-left">
                <div className="font-semibold text-gray-900 group-hover:text-blue-700 text-sm">{mode.title}</div>
                <div className="text-xs text-gray-500 group-hover:text-blue-600">{mode.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
} 