import { Link } from "wouter";
import { GuidePage } from "@/components/guide-layout";
import { GUIDE_FAQS } from "@shared/guides";
import { SEO } from "@shared/seo";

export default function ExecutorPersonalPropertyGuide() {
  return (
    <GuidePage
      page={SEO.executorPersonalProperty}
      kicker="For the person holding the keys"
      headline="A calmer way for executors to divide personal property"
      lede="You may be the executor, the personal representative, or simply the sibling everyone is calling. The legal work has a path. The household items often do not. This page is about dividing personal property without becoming the family judge."
      photo={{
        src: "/marketing/table-catalog",
        alt: "A teapot, folded quilt, eyeglasses, handwritten card, and a small leather book arranged on a wooden table.",
        width: 1536,
        height: 1024,
        caption: "The table is not asking you to award prizes. It is asking for a process.",
      }}
      faqs={GUIDE_FAQS.executor}
      related={[
        {
          href: "/guides/divide-parents-belongings-fairly",
          label: "Divide a parent's belongings fairly, without a fight",
          blurb: "A sibling-facing guide to the same methods, written without the legal hat.",
        },
        {
          href: "/guides/siblings-fighting-over-things",
          label: "When siblings start fighting over things",
          blurb: "If beneficiaries are already arguing, read this before you try to mediate the china.",
        },
      ]}
    >
      <h2>What you are — and are not — being asked to do</h2>
      <p>
        An executor’s job is to administer the estate: gather assets, pay debts, follow the will, keep records, and distribute what the law and the documents require. Families often add a second, unofficial job: decide who “deserves” the quilt.
      </p>
      <p>
        That second job will follow you for years. Every disappointed relative will remember that you chose. Every pleased relative will forget that you suffered for it. You do not have to accept the unofficial job. You can offer a process instead of a verdict.
      </p>
      <p>
        This is not a lecture about courage. It is permission to stop playing Solomon in the dining room.
      </p>

      <h2>What “personal property” usually means on this page</h2>
      <p>
        In everyday family language, personal property is the movable stuff: furniture, jewelry, clothes, kitchenware, tools, photographs, the box in the closet. It is not the house, not the brokerage account, and usually not a titled car. Those follow the will, a trust, beneficiary forms, or probate.
      </p>
      <p>
        Wills are often specific about money and silent about the contents of the hutch. That silence is why executors get cornered. “Just divide the personal property” sounds like a chore. It is actually the part of the estate that holds the most feeling per cubic inch.
      </p>
      <p>
        Evenkeep, and this guide, are only about that household catalog. Completing a draft does not transfer legal title, satisfy probate, or decide who the executor is. If a document already gifts “my wedding ring to Jordan,” you follow the document. You do not put that ring in a draft.
      </p>

      <h2>Follow the papers. Then choose a method for the silence.</h2>
      <p>
        Read the will. Talk to the estate attorney when the value is high, when someone is left out, or when you are unsure you should be dividing things at all.{" "}
        <Link href="/legal">This is not legal advice</Link>, and a calm website cannot see your facts.
      </p>
      <p>
        Where the papers are silent and the beneficiaries agree they want to share the household items, you still need a method. Here is how the usual ones feel from the executor’s chair.
      </p>

      <h3>You pick, they complain</h3>
      <p>
        Fastest on Tuesday. Most expensive on the family for the next decade. Even if your choices are wise, they look like favoritism. If you must decide — a rotting fridge, a charity pickup tomorrow — decide the perishable and the worthless, and leave the keepsakes for a process.
      </p>

      <h3>Stickers and an open house</h3>
      <p>
        Some executors host a “tag day.” It empties rooms. It also puts you in the role of referee when two colors land on the same dresser. Distant beneficiaries miss it. Elderly ones tire out. You will still be the person who allowed the scene.
      </p>
      <p>
        If you use a tag day, use it for uncontested bulk — linens, extra chairs — and move anything with a story onto a written list.
      </p>

      <h3>Points-bidding or appraisals for everything</h3>
      <p>
        Appraisals matter when objects are valuable enough for taxes, insurance, or a true equalizing payment. They are heavy machinery for a box of holiday ornaments. Points-bidding can equalize intensity, and some professional fiduciaries like the paper trail. Families in grief often experience it as a market opening in the living room. Use it when the list is mostly value. Prefer turns when the list is mostly memory.
      </p>

      <h3>Sell and split</h3>
      <p>
        Clean, documentable, and sometimes the only way to treat beneficiaries equally when no one can house the furniture. You can sell as executor in many situations — your attorney will tell you if yours is one of them. Still consider pulling a short list of low-value keepsakes for the family to draft. The estate sale does not have to take the letters.
      </p>

      <h3>Round-robin / snake draft, with you as clerk</h3>
      <p>
        Beneficiaries take turns. You keep the list. A snake order (last becomes first next round) keeps the rotation from punishing the same person every time. Your role is to photograph, invite, record, and stop the draft if someone objects or if a legal issue appears. You are the clerk of the draft, not the donor of gifts.
      </p>
      <p>
        This is usually the calmer option when several people want the same household items and nobody needs you to be the hero.
      </p>

      <h2>A process you can offer without picking winners</h2>
      <p>
        Write it down and send it once, so you are not renegotiating the rules in five phone calls:
      </p>
      <ul>
        <li>You will catalog personal property that the will does not already gift.</li>
        <li>Each beneficiary may mark, in private, what they hope to keep.</li>
        <li>A turn order will be drawn or agreed before the first pick.</li>
        <li>Turns are one item at a time, snake order, until the list is done or set aside for sale.</li>
        <li>You will keep a written record of who received what.</li>
        <li>Anyone who wants counsel should get it; the draft pauses if the right to divide is in doubt.</li>
      </ul>
      <p>
        That letter is often enough to change the family weather. People stop lobbying you in the grocery store because there is a date and a method. You have replaced “please decide” with “please rank.”
      </p>
      <p>
        You can run those steps with a binder and email. Photograph each item;{" "}
        <Link href="/guides/divide-parents-belongings-fairly">the family guide</Link> walks through the same methods in more everyday language. If siblings are already fighting,{" "}
        <Link href="/guides/siblings-fighting-over-things">read that guide first</Link> — a draft will not hold if people are still grabbing.
      </p>

      <h2>Elderly beneficiaries and people who are not in town</h2>
      <p>
        Do not design a process that only works for the fit adult standing in the house. A texted link, large type, and time to sit with a catalog are more respectful than a Saturday open house. The person in the recliner and the person on another coast should have the same kind of turn, even if they take it later in the day.
      </p>
      <p>
        If someone cannot participate, appointing a helper is better than guessing. Record that you offered a way in.
      </p>

      <h2>Where Evenkeep fits — and where it does not</h2>
      <p>
        Evenkeep is a private snake draft for one estate: you photograph items, people rank privately, a fair order is drawn, and each turn is a single belonging. It does not bid. It does not run an estate sale. It does not write a will. Professionals who refer a family are not asked to learn software; there is a short page{" "}
        <Link href="/for-professionals">for attorneys, funeral homes, and others who already hold the door</Link>.
      </p>
      <p>
        Use it when the family has the right, or the shared agreement, to divide the household catalog and you want to remain the organizer. Do not use it as cover for ignoring a will, cutting out a beneficiary, or skipping an attorney you already know you need.
      </p>
      <p>
        If you want to see the shape before you invite anyone, open the{" "}
        <Link href="/demo">sample estate</Link>. The product walkthrough is on{" "}
        <Link href="/how-it-works">how it works</Link>.
      </p>
    </GuidePage>
  );
}
