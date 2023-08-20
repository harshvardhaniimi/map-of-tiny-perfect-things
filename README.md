# A Map of Tiny Perfect Things

Your stomach rumbles. Do you go to the Italian restaurant that you know and love, or the new Thai place that just opened up? Do you go to the cafe rated 4.6 stars on Google Maps that looks hip or the cafe that promises to provide an ambient reading environment? What about the momos stall that aren't even listed on Google Maps?

Is there an *Atlas Obscura* of restaurants, cafes, parks, hikes and viewpoints?

Until now, the answer was no. But starting today, Dea and I present to the world the first iteration of "The Map of Tiny Perfect Things".

What are tiny perfect things?

Mark and Margaret had been living the same da over and over for several years. Every day, they woke up to the same routine where everyone, oblivious to what they did yesterday, did the exact same thing. Except the two of them. Eventually, Mark started making a map of the "tiny perfect things" in the world. Places where you had to be at the right time to observe something spectacular.

This map captures some of them from our (and now your) own experience. No AI, no robots, no machines. Good old crowd-based knowledge.

Share away!

### Github Files Organisation

Here are some notes on how the files are organised here.

1. `master_data` has the master data files in two formats: CSV and JSON. All apps (map, chatbots) should build from there. One source of truth.
2. `data_creation` has Quarto (R) notebooks for getting data from [Google Forms](https://docs.google.com/forms/d/e/1FAIpQLSf3zX9ItXAS6JM4cO9JdrQFSpNtew-AETsG88M7jPOhexa-Dg/viewform) (its corresponding Google Sheets) to get the required information and add it to master data.
   1. `01_create_master_data` is the first notebook that creates data from Dea and Harsh's entries.
   2. `02_add_new_places` adds new places from the Google Forms.
   3. **To Do:** Set up Github Actions to automate running of 02 notebook periodically. Not a priority right now.
3. `chatbot` has files related to GPT based chatbot.
4. `old_attempts` are irrelevant attempts that didn't make the cut. 

### Ideas

If you have a concrete idea, raise an issue. When you do it, close it via a pull request/making a change.

If you have a *maybe* idea, put it in Projects tracker.