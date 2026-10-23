# P6 content review

Draft wording for every unit, map card and source in shake-up P6 (founder answer 12: **you review these before P6 ships**). Generated from `src/data/units.js` and `src/data/maps.js` on 2026-10-23, so it matches the app exactly.

**How to review:** mark anything to change right in this file (or tell me). Wording is mine, not yours yet. Facts are kept few on purpose: where a unit needs a number, it links to the source instead.

**What to look at hardest:**
- The money and career units (regulated-adjacent topics: they teach how things work, never "do this with your money").
- Every **link** and **source**: is it the right page, and are you OK sending people there?
- The three **"What good looks like"** lines on each deliverable: these are what people tick before handing in.
- The Ground fix wording (people pick it when life feels shaky).

## What do I like?

### 1. A page about you

- **Promise:** A real web page about you. Yours to change.
- **Why:** Making something about you shows what you care about faster than any quiz.
- **Time:** About 10 minutes

- **What a portfolio is:** A portfolio is **proof you can show**, not a list of claims. One page, a few real things, your words.
- **See one:** Open the Studio and look at a page the app makes. **Every part can be taken apart.**  
  _opens: Open the Studio (StudioScreen)_
- **Change one part:** Pick one part of your page and **make it yours**: a colour, a line, a card.  
  _opens: Change a part (StudioScreen) · ticks itself on `build-part-looked`_
- **Do it: A page about you** (build, Studio "page")
  - What good looks like: It says who I am in one line · It shows at least one thing I made or did · I changed at least one part myself

### 2. Three tastes

- **Promise:** Try three small things. Write one line about each.
- **Why:** You find out what you like by **trying**, not by thinking about it.
- **Time:** Three short sessions

- **What a taste is:** A taste is **ten minutes with something new**: a tool, a free class, a video, a real-life try. Small on purpose.
- **Today's Find:** Every day the app picks one **free, useful thing** to try. That's a taste ready to go.  
  _opens: See today's Find (Training)_
- **Try one:** Try one Find and tap **I tried it**.  
  _opens: Try a Find (Training) · ticks itself on `find-tried`_
- **Do it: My taste log** (reflection)
  - Asks: Taste 1: what I tried, and one line on how it felt · Taste 2: what I tried, and one line · Taste 3: what I tried, and one line
  - What good looks like: Three different things, not one thing three times · One honest line each, even "not for me" · I marked which one I want more of

### 3. What pulls me

- **Promise:** Name the pattern in what you tried.
- **Why:** A pull you can **name** is one you can follow on purpose.
- **Time:** About 15 minutes

- **Noticing:** Look back at your tastes. **What made time go fast?** That is the clue, not what sounded impressive.
- **Your sparks:** What you make and try fills **What you love**, one of your four circles on You.  
  _opens: See your circles (Profile)_
- **Try one more:** One more taste in the direction that pulled you.  
  _opens: Find one (Training) · ticks itself on `find-tried`_
- **Do it: What pulls me** (reflection)
  - Asks: What made time go fast · What I kept thinking about afterwards · What I want to try next because of it
  - What good looks like: It names real things I did · It says why, not just what · It ends with one next try

### 4. A rough dream

- **Promise:** Put a rough picture of the life you want into words.
- **Why:** A direction beats a destination. **Rough is fine.**
- **Time:** About 15 minutes

- **Four circles:** What you **love**, what you are **good at**, what the **world needs**, what you can **get paid for**. Where they overlap is worth walking toward.
- **Your circles:** You shows your four circles, filled from what you have done.  
  _opens: See your circles (Profile)_
- **Write the Dream:** Write or update your **Dream**: one rough line about the life you want.  
  _opens: Open your Dream (Profile) · ticks itself on `dream-saved`_
- **Do it: My rough dream** (reflection)
  - Asks: What I love doing · What I am getting good at · Who it could help, or what someone would pay for
  - What good looks like: Each circle has at least one real thing in it · It is in my words · It names one small next step

### 5. Pick a path

- **Promise:** Choose where to go next. You can change it any time.
- **Why:** Picking is how you **start walking**. Nothing here is forever.
- **Time:** About 10 minutes

- **The paths:** **What's next for me**, **Money on my own**, **Job to career**. Each is a few units with something real at the end.
- **Look at one:** Open My path and read the first unit of another path.  
  _opens: See the paths (PathScreen)_
- **Talk to someone:** Tell one person which path you are thinking about. **Saying it out loud** makes it real.
- **Do it: My next path** (reflection)
  - Asks: The path I pick · Why this one, in one line · The first thing I will do on it
  - What good looks like: It names one path · The why connects to what pulled me · The first thing is doable this week

## What's next for me

### 1. The map after school

- **Promise:** Every road, side by side: college, trades, work and more.
- **Why:** You can only choose between roads **you can see**.
- **Time:** About 20 minutes

- **The roads:** College, community college, a **trade or apprenticeship**, a job, the military, a gap year. Each costs and pays off differently.
- **The map:** Read the map cards. Each says **what it takes, what it costs and a first step**, with a source.  
  _shows the map: The map after school_
- **Star two:** Pick the **two roads** you would like to look at closer.
- **Do it: My two roads** (reflection)
  - Asks: Road 1, and why it interests me · Road 2, and why · One question I have about each
  - What good looks like: Two different roads · A real reason for each · A question I could get answered
- **Sources:** [BLS Occupational Outlook Handbook](https://www.bls.gov/ooh/) (US government work (public domain), checked 2026-10-23); [Apprenticeship.gov](https://www.apprenticeship.gov/) (US government work (link out), checked 2026-10-23); [Federal Student Aid](https://studentaid.gov/) (US government work (link out), checked 2026-10-23)

### 2. Try two roads

- **Promise:** Get a real look at both: a visit, a shadow day, a free intro.
- **Why:** An hour on the inside **beats a week of reading**.
- **Time:** Two short tries

- **Ways to try:** A campus visit, **shadowing** someone at work, a free intro class, a call with someone doing it.
- **Find one near you:** CareerOneStop lists local training and apprenticeships.  
  _link: [Open CareerOneStop](https://www.careeronestop.org/)_
- **Plan it:** Put one try **on a real day** in Today.  
  _opens: Plan a try (PlannerScreen) · ticks itself on `planner-item-added`_
- **Do it: What I saw** (reflection)
  - Asks: Try 1: what I did and what surprised me · Try 2: what I did and what surprised me · Which one I could see myself in
  - What good looks like: I actually did both, not just read · One surprise each · An honest lean
- **Sources:** [CareerOneStop](https://www.careeronestop.org/) (US Dept. of Labor (link out), checked 2026-10-23)

### 3. Compare them

- **Promise:** Side by side: time, cost, what you would do all day.
- **Why:** Writing it down **turns a feeling into a choice**.
- **Time:** About 20 minutes

- **What to compare:** **Time** to get there, **cost**, what a normal day looks like, and what it leads to.
- **Real numbers:** The Occupational Outlook Handbook has pay and training for most jobs.  
  _link: [Open the Handbook](https://www.bls.gov/ooh/)_
- **Make the sheet:** Build your **compare sheet** in the Studio.  
  _opens: Make the compare sheet (StudioScreen) · ticks itself on `build-made:plan`_
- **Do it: My compare sheet** (build, Studio "plan")
  - What good looks like: Both roads on one page · Time, cost and a normal day for each · Where I found the numbers
- **Sources:** [BLS Occupational Outlook Handbook](https://www.bls.gov/ooh/) (US government work (public domain), checked 2026-10-23)

### 4. Decide and plan

- **Promise:** One page: the road you pick and the first three steps.
- **Why:** A decision with **dates on it** is a plan. Without them it is a wish.
- **Time:** About 20 minutes

- **A decision plan:** Say the choice, the **reason**, the first three steps and **when**. You can change it later.
- **Money for it:** If school is on your road, Federal Student Aid explains the FAFSA.  
  _link: [Open studentaid.gov](https://studentaid.gov/)_
- **Make the plan:** Build your **decision plan**.  
  _opens: Make the plan (StudioScreen) · ticks itself on `build-exported:plan`_
- **Do it: My decision plan** (build, Studio "plan")
  - What good looks like: One road, said plainly · Three steps with dates · One person I will tell
- **Sources:** [Federal Student Aid](https://studentaid.gov/) (US government work (link out), checked 2026-10-23)

### 5. First real step

- **Promise:** Book the first step. On a real day.
- **Why:** The first step is the one **most people never take**.
- **Time:** One step

- **Booked, not planned:** An application sent, a visit **booked**, a call scheduled. Something with a date someone else knows about.
- **Apprenticeships:** Apprenticeship.gov lists paid apprenticeships you can apply to.  
  _link: [Open Apprenticeship.gov](https://www.apprenticeship.gov/)_
- **Put it on Today:** Add the step to **a real day**.  
  _opens: Plan it (PlannerScreen) · ticks itself on `planner-item-added`_
- **Do it: First step booked** (checklist)
  - Checklist: I picked the step · I booked or sent it · It is on a day in Today
  - What good looks like: Someone else knows about it · It has a date · I know what comes after
- **Sources:** [Apprenticeship.gov](https://www.apprenticeship.gov/) (US government work (link out), checked 2026-10-23)

## Money on my own

### 1. Read your pay stub

- **Promise:** Know where every line on it goes.
- **Why:** You cannot plan around money you **do not understand yet**.
- **Time:** About 15 minutes

- **Gross and net:** **Gross** is what you earned. **Net** is what lands. The lines between are taxes and deductions.
- **A walkthrough:** The CFPB has plain guides to pay, banking and budgets.  
  _link: [Open the CFPB tools](https://www.consumerfinance.gov/consumer-tools/)_
- **Find yours:** Find **gross**, **net** and **one deduction** on your own stub (or a sample).
- **Do it: My pay stub, read** (checklist)
  - Checklist: I found my gross pay · I found my net pay · I named one deduction and what it is for
  - What good looks like: I can say the difference in one line · I know what each deduction pays for · I know my net per month
- **Sources:** [Consumer Financial Protection Bureau](https://www.consumerfinance.gov/consumer-tools/) (US government work (public domain), checked 2026-10-23)

### 2. Your money sheet

- **Promise:** One page: what you are saving for and how it grows.
- **Why:** Money with a **goal and a number** starts to move.
- **Time:** About 20 minutes

- **A plan on one page:** Name the **goal**, the amount you can put in, and watch the growth. **Small and steady** beats big and rare.
- **The same math:** Investor.gov has the government's free compound calculator.  
  _link: [Open the calculator](https://www.investor.gov/financial-tools-calculators/calculators/compound-interest-calculator)_
- **Make the sheet:** Make your **money sheet** in the Studio.  
  _opens: Make the money sheet (StudioScreen) · ticks itself on `build-made:money`_
- **Do it: My money sheet** (build, Studio "money")
  - What good looks like: It names a real goal · The amount is one I could really put in · I changed at least one part myself
- **Sources:** [Investor.gov (SEC)](https://www.investor.gov/) (US government work (public domain), checked 2026-10-23)

### 3. An account that fits

- **Promise:** Open or check a bank or credit union account.
- **Why:** A safe place for money is **the floor everything else stands on**.
- **Time:** About 20 minutes

- **What to check:** **Fees**, minimums, and whether it is insured. Banks: FDIC. Credit unions: NCUA.
- **Insured, explained:** The FDIC explains what deposit insurance covers.  
  _link: [Open the FDIC page](https://www.fdic.gov/resources/deposit-insurance)_
- **Check yours:** Look up the fees on **your own account**, or one you might open.
- **Do it: My account, checked** (checklist)
  - Checklist: I know the monthly fee (or that there is none) · I know if there is a minimum balance · I checked it is insured
  - What good looks like: I looked it up, not guessed · I know one fee I could avoid · I know where to find this again
- **Sources:** [FDIC: Deposit insurance](https://www.fdic.gov/resources/deposit-insurance) (US government work (public domain), checked 2026-10-23); [Consumer Financial Protection Bureau](https://www.consumerfinance.gov/consumer-tools/) (US government work (public domain), checked 2026-10-23)

### 4. A $500 cushion

- **Promise:** A plan for a small cushion, so one surprise is not a crisis.
- **Why:** A small cushion **changes what a bad week costs you**.
- **Time:** About 15 minutes

- **Why a cushion:** A car fix or a missed shift. **A little set aside** keeps it from turning into debt.
- **Small amounts:** Split the target into **weekly bits** you would barely notice.
- **Put it on Today:** Add a **weekly money check** to Today, in Financial.  
  _opens: Plan it (PlannerScreen) · ticks itself on `planner-item-added:financial`_
- **Do it: My cushion plan** (reflection)
  - Asks: How much a week, and from where · Where it will sit · What it is for, and what it is not for
  - What good looks like: The weekly amount is real for me · It sits somewhere separate · I know when I would use it
- **Sources:** [Consumer Financial Protection Bureau](https://www.consumerfinance.gov/consumer-tools/) (US government work (public domain), checked 2026-10-23)

### 5. Make it automatic

- **Promise:** Set one money move to happen by itself.
- **Why:** What happens **without you deciding** every time is what lasts.
- **Time:** About 10 minutes

- **Pay yourself first:** An **automatic transfer on payday**, even small, saves before spending gets a vote.
- **How others do it:** Look at your bank app for **scheduled transfers**.
- **Set it up:** Set up **one** automatic move.
- **Do it: One automation set up** (checklist)
  - Checklist: I picked the amount · I set the day (payday or the day after) · It is set up and running
  - What good looks like: It runs without me · The amount will not cause a shortfall · I know how to change or stop it
- **Sources:** [Consumer Financial Protection Bureau](https://www.consumerfinance.gov/consumer-tools/) (US government work (public domain), checked 2026-10-23)

## Job to career

### 1. What fits

- **Promise:** Find careers that match what you like and can do.
- **Why:** A good fit is **specific**. "Something better" is not a direction.
- **Time:** About 20 minutes

- **Fit:** Fit is **what you do all day**, who you do it with, and what it pays. Not just the title.
- **Career cards:** Career Explorer shows careers with what they take.  
  _opens: Open Career Explorer (CareerExplorationScreen)_
- **Look one up:** Look up one career on **O*NET**: tasks, skills, outlook.  
  _link: [Open O*NET](https://www.onetonline.org/)_
- **Do it: Three that fit** (reflection)
  - Asks: Career 1, and the task that pulls me · Career 2, and why · Career 3, and why
  - What good looks like: Three specific careers · A real task for each, not just the title · One I could start toward this year
- **Sources:** [O*NET OnLine](https://www.onetonline.org/) (CC BY 4.0 (O*NET, US Dept. of Labor), checked 2026-10-23); [BLS Occupational Outlook Handbook](https://www.bls.gov/ooh/) (US government work (public domain), checked 2026-10-23)

### 2. One real conversation

- **Promise:** Talk to one person who does the work.
- **Why:** Fifteen minutes with someone **in the job** beats any article.
- **Time:** One chat

- **An informational chat:** You ask; they talk. **Not a job interview.** Three questions, fifteen minutes, a thank-you.
- **Good questions:** "What is a normal day?" "What do you wish you knew?" "How did you start?"
- **Ask someone:** Send **one message** asking for fifteen minutes.
- **Do it: What I learned** (reflection)
  - Asks: Who I talked to and what they do · The most surprising thing they said · What I will do because of it
  - What good looks like: A real conversation happened · One surprise · One next action

### 3. The skill gap

- **Promise:** Name the one skill between you and the next job.
- **Why:** One skill you can **name** is one you can learn.
- **Time:** About 15 minutes

- **Gap, not wall:** Compare what the job asks for with **what you can already show**. The gap is usually one or two things.
- **What jobs ask for:** O*NET lists the skills each job uses most.  
  _link: [Open O*NET](https://www.onetonline.org/)_
- **Pick the skill:** Pick **one** skill to learn first.
- **Do it: My skill gap** (reflection)
  - Asks: The job I am aiming at · What I can already show · The one skill to learn first, and where
  - What good looks like: A specific job · Honest about what I have · One skill and one place to learn it
- **Sources:** [O*NET OnLine](https://www.onetonline.org/) (CC BY 4.0 (O*NET, US Dept. of Labor), checked 2026-10-23)

### 4. Proof project

- **Promise:** Learn the skill by making something that shows it.
- **Why:** Proof is **something someone can see**. A certificate is a claim.
- **Time:** A few sessions

- **A class for it:** Pick a **class or lesson** for the skill. Learn just enough to make something.  
  _opens: Open Classes (ClassesStack)_
- **Start small:** One small thing that **uses the skill for real**.
- **Start the project:** Start it as a project in the **Workshop**.  
  _opens: Start a project (ProjectsScreen) · ticks itself on `project-started`_
- **Do it: My proof project** (reflection)
  - Asks: What I made · The skill it shows · Where someone can see it
  - What good looks like: It is finished enough to show · It uses the skill for real · I can explain one choice I made

### 5. Resume and one application

- **Promise:** A resume that leads with proof, and one real application.
- **Why:** An application sent is **a door you can walk through**.
- **Time:** About 30 minutes

- **A resume that works:** Lead with **what you did and what changed**. Short lines. Your proof project near the top.
- **Free help:** CareerOneStop has free resume guides and job search tools.  
  _link: [Open CareerOneStop](https://www.careeronestop.org/)_
- **Make the resume:** Build your **resume** in the Studio.  
  _opens: Make the resume (StudioScreen) · ticks itself on `build-made:resume`_
- **Do it: My resume** (build, Studio "resume")
  - What good looks like: It leads with what I did · My proof project is on it · I sent it to one real job
- **Sources:** [CareerOneStop](https://www.careeronestop.org/) (US Dept. of Labor (link out), checked 2026-10-23)

## GED (starting-point overlay on What's next)

### 1. Which test, where

- **Promise:** Find out which high school equivalency test your state uses.
- **Why:** States differ. **Knowing yours** saves wasted study.
- **Time:** About 10 minutes

- **Two tests:** Most states use the **GED** or the **HiSET**. Your state decides which, and the rules.
- **GED by state:** GED.com lists each state's rules and prices.  
  _link: [Open GED.com](https://ged.com/)_
- **HiSET too:** Check HiSET as well, in case your state uses it.  
  _link: [Open HiSET](https://hiset.org/)_
- **Do it: My test, found** (checklist)
  - Checklist: I know which test my state uses · I know the cost or that it is free · I know where to sign up
  - What good looks like: From the official site, not a guess · Written down where I can find it · I know the next step
- **Sources:** [GED Testing Service](https://ged.com/) (Link out (their terms), checked 2026-10-23); [HiSET](https://hiset.org/) (Link out (their terms), checked 2026-10-23)

### 2. A free practice test

- **Promise:** Take one practice test to see where you are.
- **Why:** A starting score is **not a grade**. It is a map.
- **Time:** About an hour

- **Practice, not pressure:** A practice test tells you **what to study**, so you do not study what you already know.
- **Where to take one:** The official site has practice tests.  
  _link: [Open GED.com](https://ged.com/)_
- **Plan it:** Put the practice test **on a day** in Today.  
  _opens: Plan it (PlannerScreen) · ticks itself on `planner-item-added`_
- **Do it: My first practice score** (test)
  - Asks: Which subject · My score, or how it went
  - What good looks like: I took it, start to end · I wrote down the result · No shame: it is a starting point
- **Sources:** [GED Testing Service](https://ged.com/) (Link out (their terms), checked 2026-10-23)

### 3. Your weakest subject

- **Promise:** Name the subject to start with.
- **Why:** Starting with the **hardest one** frees up the rest.
- **Time:** About 10 minutes

- **Four subjects:** The GED has four: **math, reading and writing, science, social studies**. You can take them one at a time.
- **Free lessons:** GCFGlobal has free lessons for most of them.  
  _link: [Open GCFGlobal](https://edu.gcfglobal.org/)_
- **Pick one:** Pick the subject you will start with.
- **Do it: Where I start** (reflection)
  - Asks: The subject · Why this one first · Where I will learn it
  - What good looks like: One subject · Based on the practice score · A real place to learn it
- **Sources:** [GED Testing Service](https://ged.com/) (Link out (their terms), checked 2026-10-23); [GCFGlobal](https://edu.gcfglobal.org/) (Link out (their terms), checked 2026-10-23)

### 4. A study plan on Today

- **Promise:** Short study blocks, on real days.
- **Why:** Thirty minutes most days **beats one long night**.
- **Time:** About 10 minutes

- **Short and often:** Short blocks you **actually keep** beat long ones you skip.
- **Your week:** Look at your week in Today and find **three open times**.  
  _opens: Open Today (Home)_
- **Add a block:** Add a repeating **study block**.  
  _opens: Plan a study block (PlannerScreen) · ticks itself on `planner-item-added`_
- **Do it: My study plan** (checklist)
  - Checklist: Three blocks a week on Today · Each block names the subject · One person knows my plan
  - What good looks like: The times are realistic for my week · It repeats · I know what each block is for

### 5. A passing practice score

- **Promise:** Pass a practice test in your first subject.
- **Why:** A passing practice score means **you are ready to book the real one**.
- **Time:** A few weeks

- **Ready check:** When your practice score passes, **book the real test** while it is fresh.
- **Booking:** You book the real test on the official site.  
  _link: [Open GED.com](https://ged.com/)_
- **Take it again:** Take the practice test again in the same subject.
- **Do it: Passed practice test** (test)
  - Asks: The subject · My new score
  - What good looks like: It passed the practice mark · Better than my first try · The real test is my next step
- **Sources:** [GED Testing Service](https://ged.com/) (Link out (their terms), checked 2026-10-23)

## Ground fix (one per life area)

One unit per life area (Physical, Mental, Social, Financial, Creative, Professional, Spiritual, Digital), all the same shape. Shown once, for **Physical**; the others swap the area name.

### Ground fix: Physical

- **Promise:** One small fix for your physical life, this week.
- **Why:** Steady ground first. **Everything else stands on it.**
- **Time:** A week of small steps

- **Rate it:** How is your **physical** life right now, 1 to 5? Only you see it.  
  _opens: Rate it (LifeAreaScreen) · ticks itself on `area-rated:physical`_
- **One small fix:** Pick **one small thing** and put it on a day this week.  
  _opens: Plan the fix (PlannerScreen) · ticks itself on `planner-item-added:physical`_
- **Then vs now:** After the fix, **rate it again**. Any change counts, even none.  
  _opens: Rate it again (LifeAreaScreen) · ticks itself on `area-rerated:physical`_
- **Do it: My reset plan** (reflection)
  - Asks: Where I was · What I changed · What's next
  - What good looks like: It says where I started, honestly · It names the one thing I did · It has one next step

## Map: The map after school

Every card has the same template, so roads read side by side. No figures on purpose: pay, time and cost change, so each card links out.

### A four-year college

- **What:** A bachelor's degree in a subject you pick.
- **Takes:** About four years of classes.
- **Costs:** Tuition and living costs. **Aid and scholarships** can cut it a lot.
- **Leads to:** Jobs that ask for a degree, or more school.
- **First step:** Look up one college's net price calculator.
- **Link:** [Federal Student Aid](https://studentaid.gov/)
- **Sources:** [Federal Student Aid](https://studentaid.gov/) (US government work (link out), checked 2026-10-23); [BLS Occupational Outlook Handbook](https://www.bls.gov/ooh/) (US government work (public domain), checked 2026-10-23)

### Community college

- **What:** Two-year degrees and short certificates, close to home.
- **Takes:** Months to about two years.
- **Costs:** Usually **far less** than a four-year college.
- **Leads to:** A job, a certificate, or a transfer to a four-year school.
- **First step:** Look at one program at your nearest community college.
- **Link:** [CareerOneStop training finder](https://www.careeronestop.org/)
- **Sources:** [CareerOneStop](https://www.careeronestop.org/) (US Dept. of Labor (link out), checked 2026-10-23); [Federal Student Aid](https://studentaid.gov/) (US government work (link out), checked 2026-10-23)

### Trade school

- **What:** Hands-on training for one trade: electrical, welding, HVAC and more.
- **Takes:** Months to a couple of years.
- **Costs:** Tuition varies a lot. **Compare what you get** for it.
- **Leads to:** Skilled work, and often a license.
- **First step:** Look up the trade in the Occupational Outlook Handbook.
- **Link:** [The Handbook](https://www.bls.gov/ooh/)
- **Sources:** [BLS Occupational Outlook Handbook](https://www.bls.gov/ooh/) (US government work (public domain), checked 2026-10-23)

### An apprenticeship

- **What:** A **paid job** with training built in.
- **Takes:** Often one to five years, earning as you learn.
- **Costs:** You are paid while you train.
- **Leads to:** A certified skill and a job.
- **First step:** Search open apprenticeships near you.
- **Link:** [Apprenticeship.gov](https://www.apprenticeship.gov/)
- **Sources:** [Apprenticeship.gov](https://www.apprenticeship.gov/) (US government work (link out), checked 2026-10-23)

### Straight to work

- **What:** A job now, learning on the way.
- **Takes:** As soon as you are hired.
- **Costs:** Nothing up front. **You earn from day one.**
- **Leads to:** Experience, references, and later choices.
- **First step:** Pick a job you could apply to this week.
- **Link:** [CareerOneStop job search](https://www.careeronestop.org/)
- **Sources:** [CareerOneStop](https://www.careeronestop.org/) (US Dept. of Labor (link out), checked 2026-10-23)

### The military

- **What:** Service with training in a specific job.
- **Takes:** A commitment of several years.
- **Costs:** Paid service. Education benefits can come with it.
- **Leads to:** A trained skill, benefits, and later choices.
- **First step:** Read about one military job in the Handbook.
- **Link:** [The Handbook](https://www.bls.gov/ooh/)
- **Sources:** [BLS Occupational Outlook Handbook](https://www.bls.gov/ooh/) (US government work (public domain), checked 2026-10-23)

### A gap year

- **What:** A planned year to work, volunteer or travel first.
- **Takes:** About a year, **with a plan**.
- **Costs:** Depends on the plan. Work can pay for it.
- **Leads to:** Clearer choices, and stories you can tell.
- **First step:** Write what the year would be for, in one line.
- **Sources:** _none: this card states no facts_

## Sources and credits screen

The new **Sources and credits** page (My path → "Sources and credits") lists every source above, with its licence and checked date, then the art packs. The art list is copied from the licence notes in the code (`characterRigs.js`, `sceneArt.js`, `assets/32rogues/LICENSE.txt`). **Please confirm the art credits** before release; I only linked the two whose URLs the code records (CraftPix, ToffeeCraft).

## Questions for you

1. Any unit you would cut, merge or reorder?
2. OK to link out to GED.com and HiSET.org, or official state pages only?
3. The money units teach "how it works" and link to CFPB, Investor.gov and FDIC. Anything there you want a stronger "not advice" line on?
4. The welcome's page counts as unit 1 of What do I like? (handed in already). Keep it that way?
