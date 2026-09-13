# Lore (working name): the daily game about your world (13 Sep 2026)

**The brief now.** Something people open every day and pull their friends into. Universal. Spreads inside communities like a campus without needing events. Innovative and barely available. Not a utility.

## 1. What got eliminated, and why

AI made simple consumer apps cheap to build, so every obvious "hooky" idea already exists as a small 2026 app:

| Idea | Who already built it |
|---|---|
| Daily real-world side quests with friends | QuestDay, Grail, Quest Buddy, QuestGen, and four apps named SideQuest |
| Predictions with friends, play money | Called It (literally), PROPS, frr, BeTeam |
| Fantasy league of your friends' real-life stats | Life League, OutGrind (money stakes) |
| "How well do you know your friends" | Dozens, including AI versions |
| Social focus and phone-down | Opal, Focus Friend, FocusDown, LOCK IN |
| AI member of the group chat | Meta AI, ChatGPT groups, Jarvie, Pally, Series |

The lesson: a real hook now has to be something a two-person team cannot build in a weekend. The only durable hooks left are ones that need a hard content engine, a data network, or both.

## 2. The idea: Lore

**The NYT Games of your community.** Every morning, a three-minute set of games built from your world instead of the whole world: your campus (clubs, dining, professors, slang, this week's news), your company (Slack, wiki, all-hands), your friend group (memories and inside jokes the group adds), your city, your fandom, your team. Shareable spoiler-free result grids, streaks, and a leaderboard per community. Anyone can start a community in thirty seconds, and the AI keeps it fed every day with zero admin work.

**Why it hooks.** The daily-puzzle ritual is the most proven habit on the internet: Wordle holds 10 million daily players, Connections 9 million, 3.3 billion plays in 2024, and NYT Games carries a 12.8 million digital subscriber base. Lore keeps that ritual and adds the two things NYT cannot: inside knowledge as social currency ("only someone from our school gets this one") and a leaderboard of people you actually know.

**Why it spreads inside communities.** A community's puzzle is only fun with people from that community. The first player at a school invites their group chat; the group chat competes; the school leaderboard forms. No organizer, no event, no marketing office required.

**Why nobody has it.** Every daily-game app (Puzzlit, Crossover Games, Daily Games, SyncKwick) serves identical generic content. Custom Connections makers are manual. AI crossword generators make one-off gifts. Slack trivia bots (Water Cooler Trivia at $1 per user per month, Trivia by Springworks in 40,000 workspaces) prove companies pay for daily games but serve generic trivia. The hard part, and the moat, is the content engine: grounding puzzles in a community's real sources, keeping them accurate, fresh, fair, and fun, every day, for thousands of communities at once. That is not a weekend build.

**Games in the daily set (original formats, not NYT's names or trade dress):**
1. **Sixteen.** Sixteen tiles, four hidden groups of four, drawn from the community's world. Four mistakes allowed. The flagship, playable in the prototype.
2. **Two Truths.** Three statements about the community, one invented. Sourced from the community's own pages and the members' submissions.
3. **Who Said It.** A line from the community's public feed or the group's chat (opt-in), four possible authors.
4. **The Local.** One photo clue from around the community; guess the place.

**Sources, by community type.** Campus: the school's public pages, student paper, subreddit, club lists, dining menus, athletics, the members' submissions. Company: Slack channels the admin allows, wiki, all-hands notes. Friend group: a shared "lore book" the members fill with memories, jokes and photos, which is itself a hook. Members can dispute any clue; disputes feed corrections and count for points, so accuracy becomes a game too.

## 3. Business model

- Free: today's set for one community, streaks, sharing.
- Plus, $4.99 a month or $39.99 a year: every community you belong to, the archive, stats, and the private friend-group lore book with unlimited entries. The NYT Games price band.
- Teams: $1 per member per month for companies, delivered in Slack and Teams, the Water Cooler Trivia price band, sold bottom-up by whoever starts the company's Lore.
- Campus: sponsors appear as answers in The Local (a coffee shop is a fair clue), and a university can license "the official daily [School] game" for orientation and alumni engagement, without ever being required.

## 4. Risks

- **Accuracy.** A wrong "fact" about a campus is a bad puzzle. Ground every clue in a source, show the source after the game, and let members dispute; ship the friend-group mode first, where members supply the facts.
- **Cold start per community.** Seed from public sources so day one works with a single player; the friend-group mode needs three people and a few memories.
- **Privacy.** Friend-group content is opt-in and private to the group; nothing from a group ever appears in another community's game.
- **Format IP.** Original names and mechanics; the NYT owns its brands, not the idea of grouping tiles.
- **Hits risk.** Daily games are a hit business; the community angle is the wedge, and the Teams tier makes revenue less dependent on consumer virality.

## 5. Prototype

`site/lore/index.html`, published as an artifact: play Sixteen about a community you name (generated live by Claude when the page is opened signed in), with a canned campus puzzle for anyone else, a result grid to share, and a streak. Judge the hook by playing it.
