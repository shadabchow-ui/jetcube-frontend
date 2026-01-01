import React, {
  createContext,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

/* ------------------------------------------------------------------ */
/* Constants */
/* ------------------------------------------------------------------ */

export const ASSISTANT_NAME = "Scout";
export const ASSISTANT_WELCOME_TITLE = "Welcome!";
export const ASSISTANT_WELCOME_TEXT =
  "Hi, I'm Scout, your shopping assistant. My answers are powered by AI, so I may not always get things right.";
export const ASSISTANT_LEARN_MORE_LABEL = "Learn more";

/* ------------------------------------------------------------------ */
/* Types */
/* ------------------------------------------------------------------ */

export type AssistantMsg = {
  id: string;
  role: "user" | "assistant";
  text: string;
};

export type AssistantMode = "mock" | "api";

export type ProductCtx = {
  productId?: string;
  productTitle?: string;
  productSku?: string;
  productCategory?: string;
  productTags?: string[];
};

type AssistantContextType = {
  open: boolean;
  setOpen: (v: boolean) => void;

  mode: AssistantMode;

  productId?: string;
  productTitle?: string;
  productSku?: string;
  productCategory?: string;
  productTags?: string[];
  setProductContext: (p?: ProductCtx) => void;

  suggestedQuestions: string[];

  messages: AssistantMsg[];
  clearMessages: () => void;

  send: (q: string) => Promise<void>;
};

/* ------------------------------------------------------------------ */
/* Context */
/* ------------------------------------------------------------------ */

const Ctx = createContext<AssistantContextType | null>(null);

/* ------------------------------------------------------------------ */
/* Helpers */
/* ------------------------------------------------------------------ */

function uid() {
  return Math.random().toString(36).slice(2);
}

function clampText(text: string, maxLen = 1200) {
  const t = String(text || "");
  if (t.length <= maxLen) return t;
  return t.slice(0, maxLen - 1) + "…";
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function safeStr(v: any) {
  return String(v ?? "").trim();
}

/* ------------------------------------------------------------------ */
/* Category inference + suggestions */
/* ------------------------------------------------------------------ */

function inferCategoryFromText(
  title: string,
  category?: string,
  tags?: string[]
) {
  const hay = [
    safeStr(category),
    safeStr(title),
    ...(Array.isArray(tags) ? tags.map((t) => safeStr(t)) : []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const has = (re: RegExp) => re.test(hay);

  if (
    has(
      /\b(shirt|dress|skirt|jean|pants|legging|hoodie|jacket|coat|sweater|top|blouse|bra|underwear|swimsuit|bikini|saree|kurta|suit|gown|tee|t-shirt)\b/
    )
  )
    return "apparel";

  if (has(/\b(shoe|sneaker|boot|heel|loafer|sandal|slipper|sock)\b/))
    return "shoes";

  if (
    has(
      /\b(serum|cleanser|moisturizer|lotion|cream|sunscreen|spf|mask|toner|retinol|vitamin c|makeup|foundation|concealer|lipstick|shampoo|conditioner)\b/
    )
  )
    return "beauty";

  if (
    has(
      /\b(headphone|earbud|speaker|tv|monitor|laptop|keyboard|mouse|usb|charger|cable|bluetooth|wifi|router|camera|webcam|phone|iphone|android)\b/
    )
  )
    return "electronics";

  if (
    has(
      /\b(pan|pot|knife|cutting board|kettle|mug|bottle|thermos|blender|air fryer|toaster|microwave|dishwasher|cookware)\b/
    )
  )
    return "kitchen";

  if (
    has(
      /\b(chair|table|sofa|couch|lamp|rug|curtain|pillow|blanket|mattress|frame|shelf|storage)\b/
    )
  )
    return "home";

  if (has(/\b(dog|cat|pet|leash|collar|treat|kibble|litter|aquarium)\b/))
    return "pets";

  if (has(/\b(tool|drill|screw|wrench|hammer|saw|socket|glove|ladder)\b/))
    return "tools";

  return "general";
}

export function buildSuggestedQuestions(p?: ProductCtx) {
  const title = safeStr(p?.productTitle);
  const category = inferCategoryFromText(
    title,
    p?.productCategory,
    p?.productTags
  );

  if (category === "apparel")
    return [
      "How does it fit (true to size)?",
      "Is it stretchy?",
      "Does it have pockets?",
      "How do I wash it?",
    ];

  if (category === "shoes")
    return [
      "Do these run true to size?",
      "Are they comfortable for all-day wear?",
      "Is the sole non-slip?",
      "How do I clean them?",
    ];

  if (category === "beauty")
    return [
      "Is it good for sensitive skin?",
      "How do I use it (AM/PM)?",
      "Does it have fragrance?",
      "What ingredients should I know?",
    ];

  if (category === "electronics")
    return [
      "Is it compatible with my device?",
      "What’s included in the box?",
      "Does it need batteries or charging?",
      "Any setup tips?",
    ];

  if (category === "kitchen")
    return [
      "Is it dishwasher safe?",
      "What are the dimensions?",
      "Is it food-grade / BPA-free?",
      "How much does it hold?",
    ];

  if (category === "home")
    return [
      "What are the dimensions?",
      "Is assembly required?",
      "Is it easy to clean?",
      "How durable is it?",
    ];

  return [
    "What’s included?",
    "What are the dimensions?",
    "Is it easy to use?",
    "Is it returnable?",
  ];
}

/* ------------------------------------------------------------------ */
/* Mock responder */
/* ------------------------------------------------------------------ */

async function mockAsk(productTitle: string | undefined, q: string) {
  await sleep(400 + Math.random() * 400);
  const title = productTitle ? ` for “${productTitle}”` : "";
  return `I can help with fit, materials, care, compatibility, and what’s included${title}. What would you like to know?`;
}

/* ------------------------------------------------------------------ */
/* Provider */
/* ------------------------------------------------------------------ */

export function AssistantProvider({
  children,
  mode = "mock",
}: {
  children: React.ReactNode;
  mode?: AssistantMode;
}) {
  const [open, setOpen] = useState(false);

  const [productId, setProductId] = useState<string | undefined>();
  const [productTitle, setProductTitle] = useState<string | undefined>();
  const [productSku, setProductSku] = useState<string | undefined>();
  const [productCategory, setProductCategory] = useState<string | undefined>();
  const [productTags, setProductTags] = useState<string[] | undefined>();

  const [messages, setMessages] = useState<AssistantMsg[]>([]);
  const inflight = useRef<Promise<void> | null>(null);

  const setProductContext = (p?: ProductCtx) => {
    setProductId(p?.productId);
    setProductTitle(p?.productTitle);
    setProductSku(p?.productSku);
    setProductCategory(p?.productCategory);
    setProductTags(p?.productTags);
  };

  const suggestedQuestions = useMemo(
    () =>
      buildSuggestedQuestions({
        productId,
        productTitle,
        productSku,
        productCategory,
        productTags,
      }),
    [productId, productTitle, productSku, productCategory, productTags]
  );

  const clearMessages = () => setMessages([]);

  const send = async (q: string) => {
    const question = clampText(q, 240);
    if (!question) return;

    if (inflight.current) await inflight.current;

    const p = (async () => {
      setMessages((m) => [
        ...m,
        { id: uid(), role: "user", text: question },
      ]);

      const answer =
        mode === "mock"
          ? await mockAsk(productTitle, question)
          : await mockAsk(productTitle, question);

      setMessages((m) => [
        ...m,
        { id: uid(), role: "assistant", text: clampText(answer, 1200) },
      ]);
    })();

    inflight.current = p;
    await p;
    inflight.current = null;
  };

  const value = useMemo(
    () => ({
      open,
      setOpen,
      mode,
      productId,
      productTitle,
      productSku,
      productCategory,
      productTags,
      setProductContext,
      suggestedQuestions,
      messages,
      clearMessages,
      send,
    }),
    [
      open,
      mode,
      productId,
      productTitle,
      productSku,
      productCategory,
      productTags,
      suggestedQuestions,
      messages,
    ]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/* ------------------------------------------------------------------ */
/* Hook */
/* ------------------------------------------------------------------ */

export function useAssistant() {
  const v = useContext(Ctx);
  if (!v)
    throw new Error("useAssistant must be used within AssistantProvider");
  return v;
}

/* ------------------------------------------------------------------ */
/* Alias (IMPORTANT) */
/* ------------------------------------------------------------------ */

// This alias is REQUIRED because AssistantLauncher imports it by this name
export { AssistantProvider as AssistantContextProvider };
