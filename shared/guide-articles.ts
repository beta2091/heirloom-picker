/** Crisis-guide copy used by the React pages and by first-HTML prerender. */

import { GUIDE_FAQS, type GuideFaq } from "./guides";

export const DIVIDE_PARENTS_PATH = "/guides/divide-parents-belongings-fairly";
export const SIBLINGS_FIGHTING_PATH = "/guides/siblings-fighting-over-things";
export const EXECUTOR_PATH = "/guides/executor-personal-property";

export type InlineNode =
  | string
  | { href: string; label: string }
  | { em: string };

export type GuideBlock =
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "p"; parts: readonly InlineNode[] }
  | { type: "ul"; items: readonly string[] };

export type GuideRelated = {
  href: string;
  label: string;
  blurb: string;
};

export type GuidePhoto = {
  src: string;
  alt: string;
  width: number;
  height: number;
  caption: string;
};

export type GuideArticle = {
  path: string;
  kicker: string;
  headline: string;
  lede: string;
  photo: GuidePhoto;
  faqs: readonly GuideFaq[];
  related: readonly GuideRelated[];
  body: readonly GuideBlock[];
};

const h2 = (text: string): GuideBlock => ({ type: "h2", text });
const h3 = (text: string): GuideBlock => ({ type: "h3", text });
const p = (...parts: InlineNode[]): GuideBlock => ({ type: "p", parts });
const ul = (...items: string[]): GuideBlock => ({ type: "ul", items });
const a = (href: string, label: string) => ({ href, label });
const em = (text: string) => ({ em: text });

export const GUIDE_ARTICLES = {
  divideParents: {
    path: DIVIDE_PARENTS_PATH,
    kicker: "A practical guide",
    headline: "Divide a parent's belongings fairly, without a fight",
    lede: "The will, if there is one, may have covered the house and the accounts. It often says nothing about the quilt, the good spoons, or the box of letters on the dresser. This guide is for that leftover list — the personal things siblings are now trying to share.",
    photo: {
      src: "/marketing/hero-keepsakes",
      alt: "Letters tied with a ribbon, a pocket watch, a gold ring, and an open jewelry box resting on a wooden table in warm light.",
      width: 933,
      height: 1400,
      caption: "Fairness here is not a spreadsheet. It is a process everyone can live with.",
    },
    faqs: GUIDE_FAQS.divideParents,
    related: [
      {
        href: SIBLINGS_FIGHTING_PATH,
        label: "When siblings start fighting over things",
        blurb: "If the hallway conversations have already gone sharp, start there.",
      },
      {
        href: EXECUTOR_PATH,
        label: "A calmer way for executors to divide personal property",
        blurb: "If you are the one holding the keys and the inventory, this is written for you.",
      },
    ],
    body: [
      h2("What “fair” usually means in a week like this"),
      p(
        "People say they want to divide a parent’s belongings fairly. They rarely mean “every cup is worth the same number.” They mean: no one is ambushed, no one is rewarded for living closest, and the person who loved the piano bench is not shamed for caring about a bench.",
      ),
      p(
        "Money equality is one kind of fairness. Voice is another. A sibling who lives across the country has the same right to hope for the locket as the sibling standing in the kitchen. A process that only happens in the house, in one afternoon, quietly leaves people out.",
      ),
      p(
        "You also do not have to finish in a weekend. Photographing what is there, then giving everyone time, is already a kinder first move than opening drawers while relatives watch.",
      ),
      h2("Start with a catalog, not a conversation in the hallway"),
      p(
        "Before anyone claims anything, make a list the whole family can see. A photograph and a short name are enough. A note helps when a piece has a story — “Dad wore this to work,” “this was on the Sunday table.” You are not writing an appraisal. You are making sure everyone is looking at the same house.",
      ),
      p(
        "Leave off the things that are not yours to give: titled vehicles, the house itself, accounts, anything the will or an attorney has already placed. This guide is about household items and keepsakes. If you are unsure whether an object is yours to divide, ",
        a("/legal", "pause and get counsel"),
        " before anyone takes it home.",
      ),
      p(
        "Once the list exists, ask people to mark what they hope to keep without performing it for the room. Private wishes prevent the worst version of this week: two people discovering, in front of everyone, that they both thought the same chair was “obviously mine.”",
      ),
      h2("Methods families already hear about"),
      p(
        "Relatives, attorneys, and late-night searches will offer you a handful of systems. They are not tricks. Each one solves a different problem — and each one can make a tired family worse if you pick it for the wrong list.",
      ),
      h3("Round-robin and the snake draft"),
      p(
        "You take turns. One person chooses one item, then the next person, until the list is done. A ",
        em("snake draft"),
        " (sometimes called a snake-order or reverse-round draft) flips the order after each round, so the person who picked last in round one picks first in round two.",
      ),
      p(
        "This is the method most families are reaching for when they say “we just want it to be even.” It works when the catalog is written down, the turn order is known in advance, and people have already thought about what they would choose. It fails when turns happen out loud with no list — the loudest voice still wins, only now it is called a draft.",
      ),
      p(
        "The kinder version is private first, public second: everyone ranks in private, then you run the turns. People are not bidding against a sibling’s face. They are choosing from a list they already sat with.",
      ),
      h3("Stickers, colored dots, and walking the house"),
      p(
        "Each person gets a color. They walk the rooms and mark what they want. It is fast. It is also public. You can see who put a dot on the china, and they can see that you saw. For some families that is honest. For others it is a fight with stationery.",
      ),
      p(
        "Stickers also favor whoever can stand in the house that day. Elderly relatives, people who are grieving too hard to tour every closet, and siblings who cannot fly in get a thinner voice. If you use stickers, photograph the marked items and leave a way for the people who are not there to add their marks later.",
      ),
      h3("Points and bidding"),
      p(
        "Everyone receives the same number of points and “spends” them on the pieces they want most. In theory this reveals intensity: the person who would give anything for the wedding ring can put their points there, while someone else saves points for furniture.",
      ),
      p(
        "In practice, points-bidding asks a grieving family to become a little auction house. It can feel like putting a price on a parent. It also rewards whoever is best at game theory, not whoever is most careful. Some families like the clarity. Many find it colder than the week can bear — especially when the objects are not valuable so much as familiar.",
      ),
      h3("Selling everything and splitting the money"),
      p(
        "An estate sale, or a few weekends of marketplace listings, can be the right answer for a dining set nobody can house, or for a storage unit that would otherwise become a second grief. Money splits cleanly. Memories do not.",
      ),
      p(
        "A useful rule: sell what nobody would stay up at night to keep. Draft the rest. If two people want the same lamp and neither will yield, selling that one lamp is sometimes kinder than forcing a winner — but it should be the exception, not the opening move for the whole house.",
      ),
      h2("When a private turn-based draft is the kinder option"),
      p(
        "Choose a private snake draft when most of the list is keepsakes, not inventory; when more than one person cares about the same pieces; when someone cannot be in the house; or when you can already feel a judge forming in the family — the eldest, the executor, the sibling who “has always been reasonable.”",
      ),
      p(
        "Skip it, or pause it, when there is an active legal dispute, when someone cannot consent, or when the will names specific gifts. A draft is a family agreement. It is not a court.",
      ),
      p(
        "You can run this process with a shared album, a spreadsheet, and a video call. Write the catalog. Collect ranked lists in separate notes or emails so siblings do not see each other. Draw or agree on an order. Take turns, one item at a time, snake-style. Write down who kept what before anyone leaves the call. That list is the whole point — memory fades, and a month later no one wants to reconstruct the afternoon from texts.",
      ),
      p(
        "Evenkeep is the hosted version of that draft: photographs, private rankings, a fair turn order, one item per turn. It is not bidding, not an estate sale, and ",
        a("/legal", "not a will"),
        ". If you never pay for a tool, the method above still stands. If you want the catalog and the turns in one private place, ",
        a("/how-it-works", "see how it works"),
        ", walk through a ",
        a("/demo", "sample estate"),
        ", or read the shorter page ",
        a("/for-families", "for families holding the house this week"),
        ".",
      ),
    ],
  },
  siblingsFighting: {
    path: SIBLINGS_FIGHTING_PATH,
    kicker: "When the room is already tense",
    headline: "When siblings start fighting over things",
    lede: "The fight is rarely about the lamp. It is about who was there, who was not, who was the favorite, and who is afraid of going home empty-handed. If your family is already arguing over belongings after a death, you do not need a pep talk. You need a way to stop deciding in the hallway.",
    photo: {
      src: "/marketing/locket",
      alt: "A gold floral locket and a dried flower beside a cup of tea on folded linen.",
      width: 1400,
      height: 933,
      caption: "Small objects carry old stories. That is why they spark large ones.",
    },
    faqs: GUIDE_FAQS.siblingsFighting,
    related: [
      {
        href: DIVIDE_PARENTS_PATH,
        label: "Divide a parent's belongings fairly, without a fight",
        blurb: "The longer guide to catalogs, snake drafts, stickers, points, and selling.",
      },
      {
        href: EXECUTOR_PATH,
        label: "A calmer way for executors to divide personal property",
        blurb: "If you are supposed to administer the estate and also keep the peace.",
      },
    ],
    body: [
      h2("Name what is actually happening"),
      p(
        "Siblings fighting over inheritance items is common enough that people search for it in the middle of the night, then feel ashamed they searched at all. You are not broken for wanting the chair. You are not greedy for wanting the letters. You are also not required to win.",
      ),
      p(
        "After a death, belongings become proof. Proof that you were close. Proof that you were not forgotten. Proof that the parent’s life will continue in your house and not only in someone else’s. When two people need that proof from the same object, a reasonable conversation is asking a lot of a raw week.",
      ),
      p(
        "Old family roles show up on cue. The eldest manages. The peacemaker smooths. The one who lived nearby feels they already paid. The one who lived far away feels they are being managed. None of that is solved by talking louder in the dining room.",
      ),
      h2("What not to do while the temperature is high"),
      p(
        "Do not hold an informal auction in the living room. Do not ask one sibling to “just be fair” and pick for everyone. Do not let the person with the house keys quietly fill their car first and call it “taking care of things.” Do not text the group chat a photo with “anyone want this?” unless you are truly ready for a pile-on.",
      ),
      p(
        "Do not invent a vote. Majority rule sounds democratic and feels like three people ganging up on one. And do not bring childhood grievances into the first conversation about the silver. Those grievances may be real. They will not be settled by a gravy boat.",
      ),
      p(
        "If someone has already taken items, or if there is a threat of a lawyer, stop the informal process. A family draft is for people who still want to share. It is not a way to outmaneuver a claim. ",
        a("/legal", "Evenkeep is not legal advice"),
        " — if the fight has left the kitchen, you need a person who should be in the fight.",
      ),
      h2("A pause that is not a surrender"),
      p(
        "The most useful sentence in a tense week is often: we are not deciding today. Then do something concrete so the pause is not a stall. Photograph the rooms. Number the boxes. Tell everyone, in writing, that nothing leaves until there is a list and a turn order.",
      ),
      p(
        "That message is not an accusation. It is a boundary that protects the sibling who is afraid of being robbed and the sibling who is afraid of being called a thief. Both fears can live in the same family. A written catalog lowers both.",
      ),
      h2("How the usual methods land when people are already angry"),
      p(
        "The same tools that look tidy on a blog can pour gasoline when siblings are already fighting over things.",
      ),
      h3("Stickers in a charged house"),
      p(
        "Colored dots ask people to perform desire in front of each other. If the week is already sharp, a sticker on “Mom’s ring” is not information. It is a dare. Use stickers only if the family can still be kind in the same room — or use them as a first pass for the uncontested items (the extra lamps, the extra mugs) and move contested pieces to a private list.",
      ),
      h3("Points-bidding when trust is thin"),
      p(
        "Points systems assume people will play in good faith. In a fight, they become another scoreboard: who “won” the estate. They also invite the accusation that someone is being strategic instead of loving. If you already cannot stand how a sibling negotiates, do not hand them a currency.",
      ),
      h3("Selling it all to “end the fighting”"),
      p(
        "Sometimes selling is the only clean exit, and there is no shame in that. An estate sale can keep a family from destroying itself over a sofa. It can also feel like erasing the person you just lost, especially to the sibling who wanted one drawer of letters. Sell the bulky and the unwanted. Keep a short list of memory pieces for a draft. If even that short list is radioactive, sell those too and split the money — with eyes open that you are choosing peace over objects.",
      ),
      h3("Round-robin out loud"),
      p(
        "Taking turns in the room, with an audience, still rewards composure. The person who cries is pressured to pass. The person who jokes is pressured to not care. A snake draft is fairer than grabbing, but it is kinder when the wishing happens in private and the choosing is one item at a time, without a chorus.",
      ),
      h2("A private ranking, then a snake draft"),
      p(
        "This is the sequence that most often lowers the temperature without pretending the conflict never happened.",
      ),
      p(
        "First, one person catalogs. Not secretly — everyone should know a list is being made — but without deciding. Second, each person receives the same list and marks what they hope to keep. No one sees anyone else’s marks. Third, you agree on a turn order before the first pick. Lottery, names from a hat, a simple rotation: the method matters less than the fact that it is not “whoever speaks.” Fourth, you snake through the list. One item per turn. Write the result down.",
      ),
      p(
        "People still will not get everything they want. That is the point of a draft. What they get is a reason that is not “because I said so” and not “because I live here.” For a family that has already started fighting, a reason they can repeat later is sometimes the whole gift.",
      ),
      p(
        "If a sibling refuses to participate, you can still catalog and leave them a seat. Do not fill their silence with your guesses about what they “would have wanted.” Invite them again, in writing. If they stay out, record that they were invited. Then continue only with items you have the right to share — and get advice if you do not.",
      ),
      h2("You can do this without software"),
      p(
        "A shared folder of photos, separate emails for rankings, and a scheduled call are enough. The discipline is the privacy of the rankings and the written results. If that is all you take from this page, it was worth writing.",
      ),
      p(
        "Evenkeep exists for families who want that same draft hosted: private links, no public gallery, a fair order, one pick at a time. It will not make a cruel person kind. It will not settle a lawsuit. It will keep the process from depending on who can stand in the kitchen the longest. Walk through a ",
        a("/demo", "sample estate"),
        " if you want to see the shape before you involve anyone. The ",
        a("/how-it-works", "how it works"),
        " page is the unhurried product walkthrough. And if you are the sibling holding the house, the ",
        a("/for-families", "page for families"),
        " is written for that specific tiredness.",
      ),
    ],
  },
  executor: {
    path: EXECUTOR_PATH,
    kicker: "For the person holding the keys",
    headline: "A calmer way for executors to divide personal property",
    lede: "You may be the executor, the personal representative, or simply the sibling everyone is calling. The legal work has a path. The household items often do not. This page is about dividing personal property without becoming the family judge.",
    photo: {
      src: "/marketing/table-catalog",
      alt: "A teapot, folded quilt, eyeglasses, handwritten card, and a small leather book arranged on a wooden table.",
      width: 1536,
      height: 1024,
      caption: "The table is not asking you to award prizes. It is asking for a process.",
    },
    faqs: GUIDE_FAQS.executor,
    related: [
      {
        href: DIVIDE_PARENTS_PATH,
        label: "Divide a parent's belongings fairly, without a fight",
        blurb: "A sibling-facing guide to the same methods, written without the legal hat.",
      },
      {
        href: SIBLINGS_FIGHTING_PATH,
        label: "When siblings start fighting over things",
        blurb: "If beneficiaries are already arguing, read this before you try to mediate the china.",
      },
    ],
    body: [
      h2("What you are — and are not — being asked to do"),
      p(
        "An executor’s job is to administer the estate: gather assets, pay debts, follow the will, keep records, and distribute what the law and the documents require. Families often add a second, unofficial job: decide who “deserves” the quilt.",
      ),
      p(
        "That second job will follow you for years. Every disappointed relative will remember that you chose. Every pleased relative will forget that you suffered for it. You do not have to accept the unofficial job. You can offer a process instead of a verdict.",
      ),
      p(
        "This is not a lecture about courage. It is permission to stop playing Solomon in the dining room.",
      ),
      h2("What “personal property” usually means on this page"),
      p(
        "In everyday family language, personal property is the movable stuff: furniture, jewelry, clothes, kitchenware, tools, photographs, the box in the closet. It is not the house, not the brokerage account, and usually not a titled car. Those follow the will, a trust, beneficiary forms, or probate.",
      ),
      p(
        "Wills are often specific about money and silent about the contents of the hutch. That silence is why executors get cornered. “Just divide the personal property” sounds like a chore. It is actually the part of the estate that holds the most feeling per cubic inch.",
      ),
      p(
        "Evenkeep, and this guide, are only about that household catalog. Completing a draft does not transfer legal title, satisfy probate, or decide who the executor is. If a document already gifts “my wedding ring to Jordan,” you follow the document. You do not put that ring in a draft.",
      ),
      h2("Follow the papers. Then choose a method for the silence."),
      p(
        "Read the will. Talk to the estate attorney when the value is high, when someone is left out, or when you are unsure you should be dividing things at all. ",
        a("/legal", "This is not legal advice"),
        ", and a calm website cannot see your facts.",
      ),
      p(
        "Where the papers are silent and the beneficiaries agree they want to share the household items, you still need a method. Here is how the usual ones feel from the executor’s chair.",
      ),
      h3("You pick, they complain"),
      p(
        "Fastest on Tuesday. Most expensive on the family for the next decade. Even if your choices are wise, they look like favoritism. If you must decide — a rotting fridge, a charity pickup tomorrow — decide the perishable and the worthless, and leave the keepsakes for a process.",
      ),
      h3("Stickers and an open house"),
      p(
        "Some executors host a “tag day.” It empties rooms. It also puts you in the role of referee when two colors land on the same dresser. Distant beneficiaries miss it. Elderly ones tire out. You will still be the person who allowed the scene.",
      ),
      p(
        "If you use a tag day, use it for uncontested bulk — linens, extra chairs — and move anything with a story onto a written list.",
      ),
      h3("Points-bidding or appraisals for everything"),
      p(
        "Appraisals matter when objects are valuable enough for taxes, insurance, or a true equalizing payment. They are heavy machinery for a box of holiday ornaments. Points-bidding can equalize intensity, and some professional fiduciaries like the paper trail. Families in grief often experience it as a market opening in the living room. Use it when the list is mostly value. Prefer turns when the list is mostly memory.",
      ),
      h3("Sell and split"),
      p(
        "Clean, documentable, and sometimes the only way to treat beneficiaries equally when no one can house the furniture. You can sell as executor in many situations — your attorney will tell you if yours is one of them. Still consider pulling a short list of low-value keepsakes for the family to draft. The estate sale does not have to take the letters.",
      ),
      h3("Round-robin / snake draft, with you as clerk"),
      p(
        "Beneficiaries take turns. You keep the list. A snake order (last becomes first next round) keeps the rotation from punishing the same person every time. Your role is to photograph, invite, record, and stop the draft if someone objects or if a legal issue appears. You are the clerk of the draft, not the donor of gifts.",
      ),
      p(
        "This is usually the calmer option when several people want the same household items and nobody needs you to be the hero.",
      ),
      h2("A process you can offer without picking winners"),
      p(
        "Write it down and send it once, so you are not renegotiating the rules in five phone calls:",
      ),
      ul(
        "You will catalog personal property that the will does not already gift.",
        "Each beneficiary may mark, in private, what they hope to keep.",
        "A turn order will be drawn or agreed before the first pick.",
        "Turns are one item at a time, snake order, until the list is done or set aside for sale.",
        "You will keep a written record of who received what.",
        "Anyone who wants counsel should get it; the draft pauses if the right to divide is in doubt.",
      ),
      p(
        "That letter is often enough to change the family weather. People stop lobbying you in the grocery store because there is a date and a method. You have replaced “please decide” with “please rank.”",
      ),
      p(
        "You can run those steps with a binder and email. Photograph each item; ",
        a(DIVIDE_PARENTS_PATH, "the family guide"),
        " walks through the same methods in more everyday language. If siblings are already fighting, ",
        a(SIBLINGS_FIGHTING_PATH, "read that guide first"),
        " — a draft will not hold if people are still grabbing.",
      ),
      h2("Elderly beneficiaries and people who are not in town"),
      p(
        "Do not design a process that only works for the fit adult standing in the house. A texted link, large type, and time to sit with a catalog are more respectful than a Saturday open house. The person in the recliner and the person on another coast should have the same kind of turn, even if they take it later in the day.",
      ),
      p(
        "If someone cannot participate, appointing a helper is better than guessing. Record that you offered a way in.",
      ),
      h2("Where Evenkeep fits — and where it does not"),
      p(
        "Evenkeep is a private snake draft for one estate: you photograph items, people rank privately, a fair order is drawn, and each turn is a single belonging. It does not bid. It does not run an estate sale. It does not write a will. Professionals who refer a family are not asked to learn software; there is a short page ",
        a("/for-professionals", "for attorneys, funeral homes, and others who already hold the door"),
        ".",
      ),
      p(
        "Use it when the family has the right, or the shared agreement, to divide the household catalog and you want to remain the organizer. Do not use it as cover for ignoring a will, cutting out a beneficiary, or skipping an attorney you already know you need.",
      ),
      p(
        "If you want to see the shape before you invite anyone, open the ",
        a("/demo", "sample estate"),
        ". The product walkthrough is on ",
        a("/how-it-works", "how it works"),
        ".",
      ),
    ],
  },
} satisfies Record<string, GuideArticle>;

export function guideArticleByPath(path: string): GuideArticle | undefined {
  return Object.values(GUIDE_ARTICLES).find((article) => article.path === path);
}

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderInline(parts: readonly InlineNode[]): string {
  return parts
    .map((part) => {
      if (typeof part === "string") return esc(part);
      if ("href" in part) return `<a href="${esc(part.href)}">${esc(part.label)}</a>`;
      return `<em>${esc(part.em)}</em>`;
    })
    .join("");
}

function renderBlock(block: GuideBlock): string {
  if (block.type === "h2") return `<h2>${esc(block.text)}</h2>`;
  if (block.type === "h3") return `<h3>${esc(block.text)}</h3>`;
  if (block.type === "ul") {
    const items = block.items.map((item) => `<li>${esc(item)}</li>`).join("");
    return `<ul>${items}</ul>`;
  }
  return `<p>${renderInline(block.parts)}</p>`;
}

/** First-HTML article for a crisis guide — h1, body, FAQs, and related links. */
export function renderGuideArticleHtml(article: GuideArticle): string {
  const body = article.body.map(renderBlock).join("");
  const faqs = article.faqs
    .map(
      (faq) =>
        `<div><dt>${esc(faq.question)}</dt><dd>${esc(faq.answer)}</dd></div>`,
    )
    .join("");
  const related = article.related
    .map(
      (item) =>
        `<li><a href="${esc(item.href)}">${esc(item.label)}</a><p>${esc(item.blurb)}</p></li>`,
    )
    .join("");

  return [
    "<article>",
    `<header><p>${esc(article.kicker)}</p><h1>${esc(article.headline)}</h1><p>${esc(article.lede)}</p></header>`,
    body,
    `<section><h2>Questions families actually ask</h2><dl>${faqs}</dl></section>`,
    `<nav aria-label="Related guides"><h2>Related guides</h2><ul>${related}</ul></nav>`,
    "</article>",
  ].join("");
}

/**
 * Homepage first HTML needs a real <a href> into the crisis guides.
 * React (wouter Link) is not present until JavaScript runs.
 */
export function renderHomeCrawlableHtml(): string {
  return [
    "<main>",
    "<h1>The hard part is not the stuff. It is coming apart over it.</h1>",
    "<p>Dividing belongings can split a family. What something is worth in dollars is not what it is worth to the person. Evenkeep is a private, fair process: rank what you love, then take turns one item at a time. Nobody has to be the judge.</p>",
    '<nav aria-label="Guides for a hard week">',
    "<p>Practical pages, written for the search you actually make.</p>",
    `<a href="${DIVIDE_PARENTS_PATH}">How to divide a parent's belongings fairly</a>`,
    `<a href="${SIBLINGS_FIGHTING_PATH}">When siblings start fighting over things</a>`,
    `<a href="${EXECUTOR_PATH}">A calmer way for executors to divide personal property</a>`,
    "</nav>",
    "</main>",
  ].join("");
}

/** Body HTML injected into #root so the first response is crawlable. */
export function crawlableBodyForPath(path: string): string | undefined {
  if (path === "/") return renderHomeCrawlableHtml();
  const article = guideArticleByPath(path);
  return article ? renderGuideArticleHtml(article) : undefined;
}
