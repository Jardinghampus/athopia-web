"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Container, Label, Display, Reveal, Section } from "./primitives";

const FAQS = [
  {
    q: "Vad kostar Athopia?",
    a: "Det är gratis att börja — välj lag, följ flödet och läs forumet utan kreditkort. PRO kostar 99 kr/mån och Elite 199 kr/mån, och du kan avsluta när som helst.",
  },
  {
    q: "Finns Athopia som app?",
    a: "Athopia är byggd som en webapp med native-känsla. Lägg till den på hemskärmen från webbläsaren så öppnas den i fullskärm, med push-notiser — precis som en vanlig app, fast utan App Store.",
  },
  {
    q: "Vilka ligor och lag täcker ni?",
    a: "Allsvenskan är vårt fokus — alla 16 lag, varje omgång, hela säsongen. Fler ligor och sporter är på väg.",
  },
  {
    q: "Skriver AI all text?",
    a: "AI:n sammanfattar och rangordnar, men ingenting publiceras från en enskild källa. Varje analys kräver minst tre oberoende källor, och allt originalinnehåll är vårt eget — vi återpublicerar aldrig andras texter.",
  },
  {
    q: "Kan jag avsluta när som helst?",
    a: "Ja. En knapptryckning under kontoinställningar, inga frågor, ingen bindningstid. Du behåller gratisnivån så länge du vill.",
  },
];

function FaqItem({
  q,
  a,
  open,
  onToggle,
}: {
  q: string;
  a: string;
  open: boolean;
  onToggle: () => void;
}) {
  const reduced = useReducedMotion();
  return (
    <div className="border-b border-white/[0.06]">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex min-h-16 w-full items-center justify-between gap-4 py-4 text-left active:opacity-70"
      >
        <span className="text-[17px] font-semibold text-white">{q}</span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: reduced ? 0 : 0.25, ease: [0.23, 1, 0.32, 1] }}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10"
        >
          <ChevronDown className="h-4 w-4 text-white/50" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
            animate={reduced ? { opacity: 1 } : { height: "auto", opacity: 1 }}
            exit={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            className="overflow-hidden"
          >
            <p className="max-w-[640px] pb-6 text-[15px] leading-[1.7] text-white/55">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <Section id="faq">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
          <div>
            <Reveal>
              <Label>FAQ</Label>
            </Reveal>
            <Reveal delay={0.08}>
              <Display size="md" className="mt-4">
                Vanliga
                <br />
                frågor.
              </Display>
            </Reveal>
            <Reveal delay={0.16}>
              <p className="mt-6 max-w-[320px] text-[15px] leading-[1.7] text-white/45">
                Hittar du inte svaret? Hör av dig i forumet — vi läser allt.
              </p>
            </Reveal>
          </div>

          <Reveal delay={0.1}>
            <div className="border-t border-white/[0.06]">
              {FAQS.map(({ q, a }, i) => (
                <FaqItem
                  key={q}
                  q={q}
                  a={a}
                  open={openIndex === i}
                  onToggle={() => setOpenIndex(openIndex === i ? null : i)}
                />
              ))}
            </div>
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}
