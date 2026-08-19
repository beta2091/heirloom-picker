/** Shared FAQ copy for crisis guides — rendered on the page and in JSON-LD. */

export type GuideFaq = {
  question: string;
  answer: string;
};

export const GUIDE_FAQS = {
  divideParents: [
    {
      question: "How do you divide a parent's belongings fairly between siblings?",
      answer:
        "Fairness is rarely about splitting every object into equal dollars. Start with a written list and photographs so everyone sees the same catalog. Let each person say, in private, which pieces they hope to keep. Then take turns in a known order — often a snake draft, where the last person in one round picks first in the next — so no one is rewarded for speaking loudest or living closest. Sell and split money only for things nobody wants to keep.",
    },
    {
      question: "What is a snake draft for inherited items?",
      answer:
        "A snake draft is a turn-based way to share a list. People pick one item at a time. After the last person picks, the order reverses for the next round. That keeps the person who went last from always going last. Combined with private rankings beforehand, it is calmer than arguing in the hallway.",
    },
    {
      question: "Should we sell everything and split the money?",
      answer:
        "Selling can be kind for furniture nobody can house, or for pieces that would start a fight no one can afford. It is a poor first move for the small things that hold a voice or a Saturday morning — a locket, a handwritten card, a quilt. Many families keep the memory pieces and sell the rest.",
    },
    {
      question: "Does using a draft or Evenkeep replace a will?",
      answer:
        "No. A draft is a family agreement about personal belongings. It does not create, change, or replace a will, trust, or beneficiary designation, and it does not transfer legal title. If there is a will, a dispute, or real property, talk with an estate attorney.",
    },
    {
      question: "What does Evenkeep cost?",
      answer:
        "Setup is free: photograph items and invite relatives without paying. You pay a one-time fee per estate only when you run the live draft and export who kept what.",
    },
  ],
  siblingsFighting: [
    {
      question: "Why do siblings fight over things after a parent dies?",
      answer:
        "The argument is often not about the lamp. Grief, old roles, and the fear of being left out all arrive in the same week. A belonging becomes a stand-in for love, fairness, or a childhood that felt uneven. Naming that does not excuse cruelty — it explains why a quiet process helps more than a hallway debate.",
    },
    {
      question: "What should you do when the family is already arguing about belongings?",
      answer:
        "Pause the in-person deciding. Write down what is in the house. Ask everyone to mark what they hope to keep without seeing each other's lists. Agree on a turn order before anyone chooses. Do not ask one sibling to play judge. If someone needs legal counsel, stop and get it — a draft is for sharing items, not settling a lawsuit.",
    },
    {
      question: "Is it better to let one sibling decide who gets what?",
      answer:
        "It is faster, and it often costs the family later. The person who stayed in town becomes the villain of every disappointment. A known turn order and private rankings spread the deciding so no one has to award the quilt.",
    },
    {
      question: "Can a private draft help if someone is already angry?",
      answer:
        "It can lower the temperature when people still want a fair share and are willing to take turns. It cannot force a person who refuses to participate, and it cannot replace mediation or an attorney when the conflict is already legal. You can still catalog the house and leave a seat open.",
    },
    {
      question: "Is Evenkeep legal advice?",
      answer:
        "No. Evenkeep is a private coordination tool for a family draft. It is not a will and not legal advice. Read the boundary on the legal page if you are unsure whether you should be dividing things at all.",
    },
  ],
  executor: [
    {
      question: "How should an executor divide personal property?",
      answer:
        "Follow the will and local law first. Where the papers are silent — as they often are about household items — offer the family a written catalog, private wishes, and a fair turn order instead of choosing favorites yourself. Keep notes of what was offered and who took what. That is administration, not a popularity contest.",
    },
    {
      question: "Does the executor have to decide who gets each item?",
      answer:
        "Not if the family can agree on a process. Many executors get stuck because relatives expect them to be both the legal point of contact and the judge of the china. A snake draft lets you stay the organizer: you photograph, you invite, you run the turns. You do not award prizes.",
    },
    {
      question: "What is personal property in an estate?",
      answer:
        "In everyday family language it means the movable things in the house — furniture, jewelry, papers, kitchenware, tools, the box in the closet. It is not the house itself, bank accounts, or titled vehicles, which usually follow the will, a trust, or other legal process. Evenkeep is only for the household catalog, not for transferring title.",
    },
    {
      question: "Can an executor use a snake draft for household items?",
      answer:
        "Yes, when beneficiaries agree and the will does not require a different method. A private ranking plus a snake draft is one of the calmer ways to share a long list. If someone objects, or values are high enough to matter legally, pause and ask the estate attorney.",
    },
    {
      question: "Is Evenkeep a substitute for probate or a will?",
      answer:
        "No. Evenkeep does not open probate, appoint an executor, or replace a will. It is a coordination tool for photographing belongings, gathering private rankings, and running a fair draft once the family has the right to share those items.",
    },
  ],
} as const satisfies Record<string, GuideFaq[]>;
