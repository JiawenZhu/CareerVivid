#!/usr/bin/env python3
"""
Regenerate the tailored real-time question banks in data/quest-category-banks.json.

Structure produced:
  questionBanks[category][stage] = { "easy": [...5], "medium": [...5], "hard": [...5] }
  for stage in screening / values / final.

Design rules:
  - SCREENING is a recruiter screen: light, get-to-know-you rapport. Even the
    "hard" tier stays light (relevant-background + logistics), never deep
    technical or scenario/team-fit questions.
  - VALUES and FINAL carry real difficulty progression and category-specific
    value/mission flavor.
  - Difficulty tier is chosen at runtime from the company's difficulty rating
    (see companyCategories.resolveQuestDifficulty), mirroring the coding round.

companyCategory and systemDesignOrder are preserved from the existing file.
Run: python3 scripts/gen-category-banks.py
"""
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PATH = os.path.join(ROOT, "data", "quest-category-banks.json")

# Per-category flavor tokens woven into the templates below.
CATS = {
    "big-tech": {
        "domain": "working at big-tech scale",
        "valueTheme": "raising the quality bar and thinking long-term for customers",
        "valueConcern": "you keep a high bar when the org is moving fast",
        "valueDilemma": "You find a shortcut that ships faster but adds long-term complexity for other teams. How do you decide?",
        "finalHard": "Tell me about the hardest technical trade-off you have owned at scale — would you make the same call again?",
    },
    "quant-trading": {
        "domain": "quantitative and trading work",
        "valueTheme": "precision, speed, and intellectual honesty",
        "valueConcern": "you stay exactly correct under time pressure",
        "valueDilemma": "You spot a bug that has quietly been making the firm money. What do you do, and how fast?",
        "finalHard": "Tell me about a decision you made under uncertainty that did not pay off — how had you sized the risk?",
    },
    "finance": {
        "domain": "the intersection of technology and finance",
        "valueTheme": "rigor, prudence, and earning trust",
        "valueConcern": "you stay meticulous about controls and correctness",
        "valueDilemma": "You are asked to ship something fast that skips a control step. How do you handle it?",
        "finalHard": "Tell me about the most high-stakes system you have owned — how did you keep it reliable and trusted?",
    },
    "fintech": {
        "domain": "building financial products",
        "valueTheme": "protecting users' money and earning trust",
        "valueConcern": "you design for correctness when money is involved",
        "valueDilemma": "A growth feature would boost conversion but slightly increases fraud risk. How do you weigh it?",
        "finalHard": "Tell me about the hardest correctness or consistency problem you have solved — what was at stake?",
    },
    "crypto": {
        "domain": "crypto and on-chain products",
        "valueTheme": "security-first thinking and resilience",
        "valueConcern": "you protect against irreversible, public failures",
        "valueDilemma": "You could ship faster by deferring a security review, and the market is hot. What do you do?",
        "finalHard": "Tell me about the most adversarial system you have built for — how did you make it safe?",
    },
    "ai-lab": {
        "domain": "frontier and applied AI",
        "valueTheme": "ambition balanced with responsibility",
        "valueConcern": "you deploy powerful capabilities responsibly",
        "valueDilemma": "A model behavior is impressive in demos but risky at scale. How do you decide whether to ship?",
        "finalHard": "What is a strong view you hold about where AI is heading — and what would change your mind?",
    },
    "dev-infra": {
        "domain": "developer tools and infrastructure",
        "valueTheme": "reliability and craft for the developers who depend on you",
        "valueConcern": "you do not break the people building on your APIs",
        "valueDilemma": "You need to change an API that customers cannot easily migrate off. How do you approach it?",
        "finalHard": "Tell me about the hardest reliability or scaling problem you have owned.",
    },
    "enterprise-saas": {
        "domain": "enterprise and B2B software",
        "valueTheme": "customer focus and cross-functional judgment",
        "valueConcern": "you build what customers actually need",
        "valueDilemma": "A big customer demands a feature that is wrong for the broader product. How do you handle it?",
        "finalHard": "Tell me about a time you shipped something that measurably improved customers' outcomes.",
    },
    "cybersecurity": {
        "domain": "security",
        "valueTheme": "adversarial thinking and integrity",
        "valueConcern": "you weigh security rigor against usability and speed",
        "valueDilemma": "You find a serious risk right before a launch. Do you block it? Walk me through your thinking.",
        "finalHard": "Tell me about the most serious incident or vulnerability you have handled.",
    },
    "consumer": {
        "domain": "consumer products",
        "valueTheme": "user empathy and healthy engagement",
        "valueConcern": "you balance growth with users' wellbeing and trust",
        "valueDilemma": "A change boosts engagement but nudges users in a way you are not sure is good for them. What do you do?",
        "finalHard": "Tell me about a product decision you are proud of — and one you would redo.",
    },
    "marketplace": {
        "domain": "marketplaces and commerce",
        "valueTheme": "balancing both sides and building trust",
        "valueConcern": "you keep supply and demand fair and safe",
        "valueDilemma": "A fix helps buyers but hurts sellers (or vice versa). How do you decide?",
        "finalHard": "Tell me about the most operationally messy problem you have solved at scale.",
    },
    "gaming": {
        "domain": "games and real-time systems",
        "valueTheme": "craft, performance, and love of the player experience",
        "valueConcern": "you balance polish against a hard launch date",
        "valueDilemma": "The game is fun but a feature is over budget on performance. How do you decide what to cut?",
        "finalHard": "Tell me about the most satisfying thing you have shipped in games or real-time systems.",
    },
    "hardware": {
        "domain": "hardware and systems",
        "valueTheme": "first-principles rigor and precision",
        "valueConcern": "you make decisions you cannot cheaply undo later",
        "valueDilemma": "A cleaner design is harder to manufacture and costs more. How do you weigh it?",
        "finalHard": "Tell me about the most constrained system you have optimized — how did you approach it?",
    },
    "deep-tech": {
        "domain": "this mission",
        "valueTheme": "mission focus and extreme ownership",
        "valueConcern": "you balance moving fast with the reliability the mission demands",
        "valueDilemma": "You are on a hard problem no one has solved, with real stakes if it fails. How do you proceed responsibly?",
        "finalHard": "Tell me about the hardest first-principles problem you have solved.",
    },
    "healthcare": {
        "domain": "health and clinical technology",
        "valueTheme": "care for patients and respect for privacy",
        "valueConcern": "you protect sensitive data and get it exactly right",
        "valueDilemma": "A faster approach would move quicker but weakens a privacy safeguard. What do you do?",
        "finalHard": "Tell me about a time getting something exactly right mattered more than shipping fast.",
    },
}

# Screening: light rapport for ALL tiers. Even "hard" stays a screen
# (relevant background + logistics), never deep-technical or scenario-based.
SCREENING = {
    "easy": [
        "Thanks for making the time. To start, tell me a little about yourself and what you are working on these days.",
        "What is prompting you to look at new opportunities right now?",
        "What are you hoping to find in your next role or team?",
        "What kind of work do you enjoy most day to day?",
        "How did you first get into this field?",
    ],
    "medium": [
        "What do you know about {company}, and what caught your interest?",
        "What draws you to {domain}?",
        "What would make a next role feel like a real step up for you?",
        "Is there anything about {company} you were hoping to learn more about today?",
        "What kind of team environment helps you do your best work?",
    ],
    "hard": [
        "Give me the short version of your background — just the parts most relevant to this role.",
        "What is your timeline, and are you in process anywhere else?",
        "Are there any logistics we should cover — location, work authorization, or start date?",
        "What are you looking for in terms of scope or level next?",
        "What would need to be true for you to say yes to a role like this?",
    ],
}

VALUES = {
    "easy": [
        "What kind of mission or environment brings out your best work?",
        "Why {company} specifically, rather than others in {domain}?",
        "What do you care about most in the teams you join?",
        "What does a good team culture look like to you?",
        "What motivates you beyond the day-to-day work?",
    ],
    "medium": [
        "Tell me about a time your work reflected {valueTheme}.",
        "How do you make sure {valueConcern}?",
        "Tell me about a time you disagreed with a decision — how did you handle it?",
        "Describe a time you took ownership of something outside your immediate job.",
        "When have you had to balance moving fast with doing things carefully?",
    ],
    "hard": [
        "{valueDilemma}",
        "Tell me about a time the right thing and the easy thing were different — what did you do?",
        "Describe a decision you made that you knew would be unpopular. How did you handle the fallout?",
        "When have you pushed back on leadership or a strong stakeholder? What happened?",
        "Tell me about a principle you will not compromise on, even under pressure.",
    ],
}

BEHAVIORAL = {
    "easy": [
        "Tell me about a project or piece of work you really enjoyed. What made it satisfying?",
        "How do you like to work with a team day to day?",
        "Tell me about something you built or shipped that you are proud of.",
        "What drew you to {domain} in your past work?",
        "Describe a time you picked up something new quickly to get a job done.",
    ],
    "medium": [
        "Tell me about a time you disagreed with a teammate. How did it resolve?",
        "Describe a time you had to deliver under a tight deadline. What did you trade off?",
        "Tell me about a time you got hard feedback. What did you do with it?",
        "Describe a time you took ownership of something outside your role.",
        "Tell me about a time a project did not go as planned. What did you do?",
    ],
    "hard": [
        "Tell me about your biggest professional failure — what happened, and what did you change afterward?",
        "Describe a time you drove a difficult decision through real resistance.",
        "Tell me about the hardest conflict you have navigated on a team. How did you handle it?",
        "Describe a time you made a high-stakes call with incomplete information.",
        "Tell me about a time you had to influence people over whom you had no authority.",
    ],
}

FINAL = {
    "easy": [
        "What questions do you have for us — about the team, the role, or how we work?",
        "Is there anything you did not get to share that you would like us to know?",
        "What is your impression of the process so far?",
        "What are you most excited about in a role like this?",
        "How can we help you make a good decision from here?",
    ],
    "medium": [
        "Looking at your first few months at {company}, what would you want to focus on?",
        "What would make this role a great fit for you — or not?",
        "What do you need from a manager to do your best work?",
        "Where do you want to grow over the next couple of years?",
        "What would make you turn down an offer from us?",
    ],
    "hard": [
        "{finalHard}",
        "Tell me about the hardest decision you have made in your work. Would you make it again?",
        "If you joined and found things were not as described, how would you handle it?",
        "What is a risk you took in your career that shaped how you work today?",
        "Six months in, how would you want your teammates to describe your impact?",
    ],
}


def render(template_bank, tokens):
    out = {}
    for tier, items in template_bank.items():
        out[tier] = [s.format(**tokens) if ("{" in s) else s for s in items]
    return out


def main():
    data = json.load(open(PATH))
    banks = {}
    for cat, tokens in CATS.items():
        t = {"company": "{company}", **tokens}
        # Keep the literal {company} token intact for runtime substitution by
        # formatting with a placeholder that re-emits it.
        banks[cat] = {
            "screening": render(SCREENING, t),
            "behavioral": render(BEHAVIORAL, t),
            "values": render(VALUES, t),
            "final": render(FINAL, t),
        }
    data["questionBanks"] = banks
    # Refresh the header note.
    data["_comment"] = (
        "Single source of truth for CareerVivid quest category taxonomy + tailored question banks. "
        "questionBanks[category][stage] = {easy, medium, hard} for screening/values/final; the quest "
        "picks a tier from the company's difficulty rating. Screening is intentionally light (rapport). "
        "Edited by the twice-weekly research task; read by src/lib/companyCategories.ts. Keep {company} tokens intact."
    )
    with open(PATH, "w") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write("\n")

    # sanity
    for cat, stages in banks.items():
        for st, tiers in stages.items():
            for tier, qs in tiers.items():
                assert len(qs) == 5, f"{cat}/{st}/{tier}={len(qs)}"
                for q in qs:
                    assert q.strip(), f"empty in {cat}/{st}/{tier}"
    n_stages = len(next(iter(banks.values())))
    print(f"Wrote {PATH}: {len(banks)} categories x {n_stages} stages x 3 tiers x 5 questions")


if __name__ == "__main__":
    main()
