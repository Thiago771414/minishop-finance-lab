import { SendHorizontal } from "lucide-react";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";

import { Button } from "@/components/ui/button";

export interface ComposerHandle {
  focus: () => void;
}

export const Composer = forwardRef<
  ComposerHandle,
  { onSend: (text: string) => boolean; busy: boolean }
>(function Composer({ onSend, busy }, ref) {
  const [value, setValue] = useState("");
  const [hint, setHint] = useState<string | null>(null);
  const areaRef = useRef<HTMLTextAreaElement>(null);

  useImperativeHandle(ref, () => ({ focus: () => areaRef.current?.focus() }), []);

  useEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [value]);

  const submit = () => {
    if (!value.trim()) {
      setHint("Digite uma pergunta antes de enviar.");
      return;
    }
    if (busy) return;
    if (onSend(value)) {
      setValue("");
      setHint(null);
    }
  };

  const empty = !value.trim();

  return (
    <div>
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="flex items-end gap-2 rounded-xl border bg-card p-2 shadow-soft focus-within:border-primary/50"
    >
      <label htmlFor="fin-message" className="sr-only">
        Mensagem para o Fin MiniShop
      </label>
      <textarea
        id="fin-message"
        ref={areaRef}
        rows={1}
        value={value}
        maxLength={500}
        onChange={(e) => {
          setValue(e.target.value);
          if (hint) setHint(null);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            submit();
          }
        }}
        placeholder="Pergunte sobre contas, saldos ou transações fictícias…"
        aria-describedby="fin-message-help"
        className="max-h-40 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-[15px] leading-6 placeholder:text-muted-foreground focus:outline-none focus-visible:outline-none"
      />
      <Button
        type="submit"
        size="icon"
        variant="brand"
        disabled={empty || busy}
        aria-label="Enviar mensagem"
        className="size-10 shrink-0 rounded-lg"
      >
        <SendHorizontal />
      </Button>
    </form>
      <p id="fin-message-help" className="mt-1 px-1 text-[11px] text-muted-foreground" role="status" aria-live="polite">
        {hint ? <span className="font-medium text-destructive">{hint}</span> : "Enter envia · Shift+Enter quebra a linha"}
      </p>
    </div>
  );
});
