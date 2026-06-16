import csv, datetime, pathlib

OUT = pathlib.Path(r"c:\Projects\CircaLog\docs")

def xl_date(s):
    return (datetime.date(1899, 12, 30) + datetime.timedelta(days=int(s))).isoformat()

def xl_time(f):
    if str(f).strip() in ("Bedtime", "As needed", ""):
        return str(f).strip()
    m = round(float(f) * 1440)
    return f"{m // 60:02d}:{m % 60:02d}"

# ── SLEEP LOG ──────────────────────────────────────────────────────────────────
sleep_rows = [
    [46171,0.131944,0.166667,0.416667,"0h 50m","6h 0m","6h 50m","Main Sleep",3,"No","N/A","Peed twice","By the morning meds alarm",1],
    [46172,0.227778,0.252083,0.569444,"0h 35m","7h 37m","8h 12m","Main Sleep",4,"No","N/A","none","woke up by the dohr athan",2],
    [46173,0.267361,0.295833,0.479167,"0h 41m","4h 24m","5h 5m","Main Sleep",3,"No","N/A","none","",3],
    [46173,0.965278,0.025694,0.236111,"1h 27m","5h 3m","6h 30m","Main Sleep",3,"No","N/A","Peed once","",4],
    [46174,0.900694,0.908333,0.222222,"0h 11m","7h 32m","7h 43m","Main Sleep",4,"No","N/A","N/A","",5],
    [46175,0.5625,0.574306,0.652778,"0h 17m","1h 53m","2h 10m","Nap",1,"No","N/A","N/A","Bloated! Less than 2 hours of eating. Could barely breath during sleeping.",6],
    [46175,0.658333,0.659722,0.711806,"0h 2m","1h 15m","1h 17m","Nap",1,"No","N/A","N/A","",7],
    [46176,0.013889,0.134722,0.345833,"2h 54m","5h 4m","7h 58m","Main Sleep",1,"Yes","Multiple what IFs nightmares about what might happen to my wife's journey to Egypt.","After multiple interruptions that woke me up with each nightmare by 08:18 AM, I told myself that was enough and got out of bed.","",8],
    [46177,0.009028,0.026389,0.4,"0h 25m","8h 58m","9h 23m","Main Sleep",4,"Yes","Acquiring hotels deals for Pals Tours","Peed once","Discomfort masking pain in bones and muscles, likely from sleeping too long as muscles wake up.",9],
    [46177,0.961806,0.152778,0.339583,"4h 35m","4h 29m","9h 4m","Main Sleep",1,"No","N/A","Multiple! Kept sweating all night. By the time I woke up, all my clothes were wet","Worst sleeping session I have had in weeks",10],
    [46179,0.168056,0.199306,0.478472,"0h 45m","6h 42m","7h 27m","Main Sleep",4,"Yes","Don't remember","Peed twice","",11],
    [46179,0.644444,0.666667,0.859028,"0h 32m","4h 37m","5h 9m","Main Sleep",2,"No","N/A","Peed once, couldn't go back to sleep","Too hot after the sunrise. Woke up all wet from sweating.",12],
    [46180,0.673611,0.694444,0.791667,"0h 30m","2h 20m","2h 50m","Nap",1,"No","N/A","Peed twice","Too hot, kept sweating",13],
    [46181,0.151389,0.170139,0.439583,"0h 27m","6h 28m","6h 55m","Main Sleep",3,"No","N/A","Peed once","",14],
    [46182,0.174306,0.197222,0.53125,"0h 33m","8h 1m","8h 34m","Main Sleep",4,"Yes",'One nightmare that kept repeating itself in different places and at different times of day; my wife safely arrived in Egypt, found a good-paying job, paid back OUR debts in Egypt and the Philippines, then she left me because I am poor and she\'s rich by saying: "I don\'t need you anymore!"',"Peed once","",15],
    [46183,0.218056,0.247917,0.541667,"0h 43m","7h 3m","7h 46m","Main Sleep",4,"Yes",'One nightmare that kept repeating itself in different places and at different times of day; my wife safely arrived in Egypt, found a good-paying job, paid back OUR debts in Egypt and the Philippines, then she left me because I am poor and she\'s rich by saying: "I don\'t need you anymore!"',"Peed once","The alarm for the morning meds (10 AM) woke me up. I used the bathroom, took my morning meds late 20 minutes, smoked, then went back to sleep.",16],
    [46184,0.114583,0.127778,0.434722,"0h 19m","7h 22m","7h 41m","Main Sleep",5,"No","N/A","N/A","",17],
    [46185,0.133333,0.170833,0.530556,"0h 54m","8h 38m","9h 32m","Main Sleep",4,"No","N/A","Peed once","Woke up at 8 AM, all sweaty. Had to open the AC to continue sleeping.",18],
    [46186,0.226389,0.241667,0.555556,"0h 22m","7h 32m","7h 54m","Main Sleep",4,"No","N/A","Peed once","The alarm for the morning meds (10 AM) woke me up. I used the bathroom, took my morning meds late 20 minutes, smoked, then went back to sleep.",19],
    [46187,0.227083,0.248611,0.5,"0h 31m","6h 2m","6h 33m","Main Sleep",4,"No","N/A","Peed once","At 8AM",20],
    [46187,0.647917,0.952778,0.05,"7h 19m","2h 20m","9h 39m","Nap",2,"No","","Pain, Hunger, Other","Since waking up in the last cycle, I've been feeling sleepy but couldn't sleep despite going to bed repeatedly. When my 4 PM medication alarm sounded, I took it, worked briefly, then returned to bed. By 7 PM, I was hungry—nearly 26 hours since my last meal—so I ordered food (Koshary and beef lasagna), played a game, and then went back to bed for the sixteenth time. At 10 PM, I took my last medication and finally managed to sleep a bit before 11 PM, getting about two hours of sleep.",21],
    [46188,0.286111,0.333333,0.506944,"1h 8m","4h 10m","5h 18m","Main Sleep",1,"No","","Pain, Other","",22],
    [46188,0.667361,0.831944,0.849306,"3h 57m","0h 25m","4h 22m","Nap",1,"No","","Pain, Hunger, other","My sister called me and woke me up",23],
]

with open(OUT / "Sleep_Log_2026-05-29_to_2026-06-15.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f)
    w.writerow(["Date","Bed Time","Sleep Start","Wake Time","Sleep Onset Latency","Sleep Duration","Time in Bed","Session Type","Quality","Had Dreams","Dream Notes","Interruptions","Notes","Cycle Number"])
    for r in sleep_rows:
        w.writerow([xl_date(r[0]), xl_time(r[1]), xl_time(r[2]), xl_time(r[3]),
                    r[4], r[5], r[6], r[7], r[8], r[9], r[10], r[11], r[12], r[13]])
print(f"Sleep Log: {len(sleep_rows)} rows")

# ── MEDICATION LOG ─────────────────────────────────────────────────────────────
med_rows = [
    [46171,"Sugarlo Plus (Metformin)",0.416667,0.416667,"Taken",""],
    [46171,"Thiotacid 300 (Alpha-lipoic Acid) — 1st Dose",0.416667,0.416667,"Taken",""],
    [46171,"Thiotacid 300 (Alpha-lipoic Acid) — 2nd Dose",0.666667,0.666667,"Taken",""],
    [46171,"Milga Advance",0.666667,0.75,"Taken",""],
    [46171,"Davalindi (Vitamin D3)",0.666667,0.777778,"Taken","Ate late"],
    [46171,"Thiotacid 300 (Alpha-lipoic Acid) — 3rd Dose",0.916667,0.916667,"Taken",""],
    [46172,"Melatonin Copad","Bedtime",0.222222,"Taken",""],
    [46172,"Sugarlo Plus (Metformin)",0.416667,0.569444,"Taken",""],
    [46172,"Thiotacid 300 (Alpha-lipoic Acid) — 1st Dose",0.416667,"","Missed","Woke up almost 4 hours late; next dose in 2 hours, so I skipped it to prevent overdosing."],
    [46172,"Milga Advance",0.666667,0.666667,"Taken","Mistook it for Thiotacid"],
    [46172,"Thiotacid 300 (Alpha-lipoic Acid) — 2nd Dose",0.666667,"","Skipped","Less than 3 hours to the last dose"],
    [46172,"Davalindi (Vitamin D3)",0.666667,0.8125,"Taken","Because I ate late"],
    [46172,"Thiotacid 300 (Alpha-lipoic Acid) — 3rd Dose",0.916667,0.913194,"Taken",""],
    [46173,"Melatonin Copad","Bedtime",0.256944,"Taken",""],
    [46173,"Sugarlo Plus (Metformin)",0.416667,0.479167,"Taken",""],
    [46173,"Thiotacid 300 (Alpha-lipoic Acid) — 1st Dose",0.416667,0.479167,"Taken",""],
    [46173,"Thiotacid 300 (Alpha-lipoic Acid) — 2nd Dose",0.666667,0.666667,"Taken",""],
    [46173,"Milga Advance",0.666667,0.902778,"Taken",""],
    [46173,"Davalindi (Vitamin D3)",0.666667,0.925,"Taken",""],
    [46173,"Thiotacid 300 (Alpha-lipoic Acid) — 3rd Dose",0.916667,0.925,"Taken",""],
    [46174,"Melatonin Copad","Bedtime","","Skipped","Didn't take it last night"],
    [46174,"Sugarlo Plus (Metformin)",0.416667,0.416667,"Taken",""],
    [46174,"Thiotacid 300 (Alpha-lipoic Acid) — 1st Dose",0.416667,0.416667,"Taken",""],
    [46174,"Milga Advance",0.666667,0.734028,"Taken","Forgot to take it before eating"],
    [46174,"Davalindi (Vitamin D3)",0.666667,0.775694,"Taken",""],
    [46174,"Thiotacid 300 (Alpha-lipoic Acid) — 3rd Dose",0.916667,0.895833,"Taken","Was too sleepy all day, so I took the med early in case I slept before 10 PM"],
    [46174,"Melatonin Copad","Bedtime",0.895833,"Taken",""],
    [46175,"Sugarlo Plus (Metformin)",0.416667,0.416667,"Taken",""],
    [46175,"Thiotacid 300 (Alpha-lipoic Acid) — 1st Dose",0.416667,0.416667,"Taken",""],
    [46175,"Milga Advance",0.666667,0.46875,"Taken","Ate early"],
    [46175,"Davalindi (Vitamin D3)",0.666667,0.486111,"Taken","Ate early"],
    [46175,"Thiotacid 300 (Alpha-lipoic Acid) — 2nd Dose",0.666667,0.723611,"Taken","Late because I was napping"],
    [46175,"Thiotacid 300 (Alpha-lipoic Acid) — 3rd Dose",0.916667,0.916667,"Taken",""],
    [46176,"Melatonin Copad","Bedtime",0.011111,"Taken","Took two pills because I have to sleep and wake up by 9 AM to buy things for my wife's return to Egypt"],
    [46176,"Sugarlo Plus (Metformin)",0.416667,0.416667,"Taken",""],
    [46176,"Thiotacid 300 (Alpha-lipoic Acid) — 1st Dose",0.416667,0.416667,"Taken",""],
    [46176,"Milga Advance",0.666667,0.552083,"Taken",""],
    [46176,"Davalindi (Vitamin D3)",0.666667,0.584722,"Taken",""],
    [46176,"Propranolol (Indreral) 10mg","As needed",0.666667,"Taken","Started my headache directly after eating. It kept getting worse gradually. The headache gradually went away starting at 19:15. Now, at 20:02, it's totally gone."],
    [46176,"Paracetamol (Awadist) 1000mg","As needed",0.666667,"Taken","Started my headache directly after eating. It kept getting worse gradually. The headache gradually went away starting at 19:15. Now, at 20:02, it's totally gone."],
    [46176,"Thiotacid 300 (Alpha-lipoic Acid) — 2nd Dose",0.666667,0.666667,"Taken",""],
    [46176,"Thiotacid 300 (Alpha-lipoic Acid) — 3rd Dose",0.916667,0.916667,"Taken",""],
    [46176,"Melatonin Copad","Bedtime",0.998611,"Taken",""],
    [46177,"Sugarlo Plus (Metformin)",0.416667,0.411111,"Taken",""],
    [46177,"Thiotacid 300 (Alpha-lipoic Acid) — 1st Dose",0.416667,0.411111,"Taken",""],
    [46177,"Milga Advance",0.666667,0.553472,"Taken",""],
    [46177,"Davalindi (Vitamin D3)",0.666667,0.616667,"Taken",""],
    [46177,"Thiotacid 300 (Alpha-lipoic Acid) — 2nd Dose",0.666667,0.666667,"Taken",""],
    [46177,"Thiotacid 300 (Alpha-lipoic Acid) — 3rd Dose",0.916667,0.916667,"Taken",""],
    [46177,"Melatonin Copad","Bedtime",0.934722,"Taken",""],
    [46178,"Sugarlo Plus (Metformin)",0.416667,0.420139,"Taken",""],
    [46178,"Thiotacid 300 (Alpha-lipoic Acid) — 1st Dose",0.416667,0.420139,"Taken",""],
    [46178,"Milga Advance",0.666667,0.584722,"Taken",""],
    [46178,"Davalindi (Vitamin D3)",0.666667,0.638889,"Taken",""],
    [46178,"Thiotacid 300 (Alpha-lipoic Acid) — 3rd Dose",0.916667,0.916667,"Taken",""],
    [46179,"Melatonin Copad","Bedtime",0.130556,"Taken",""],
    [46179,"Sugarlo Plus (Metformin)",0.416667,0.503472,"Taken",""],
    [46179,"Thiotacid 300 (Alpha-lipoic Acid) — 1st Dose",0.416667,0.503472,"Taken",""],
    [46179,"Milga Advance",0.666667,0.629167,"Taken",""],
    [46179,"Thiotacid 300 (Alpha-lipoic Acid) — 2nd Dose",0.666667,0.666667,"Taken",""],
    [46179,"Davalindi (Vitamin D3)",0.666667,0.695833,"Taken",""],
    [46179,"Thiotacid 300 (Alpha-lipoic Acid) — 3rd Dose",0.916667,0.916667,"Taken",""],
    [46179,"Melatonin Copad","Bedtime",0.152778,"Taken",""],
    [46180,"Thiotacid 300 (Alpha-lipoic Acid) — 1st Dose",0.416667,0.416667,"Taken",""],
    [46180,"Sugarlo Plus (Metformin)",0.416667,0.416667,"Taken",""],
    [46180,"Milga Advance",0.666667,0.585417,"Taken",""],
    [46180,"Davalindi (Vitamin D3)",0.666667,0.644444,"Taken",""],
    [46180,"Thiotacid 300 (Alpha-lipoic Acid) — 2nd Dose",0.666667,0.666667,"Taken",""],
    [46180,"Paracetamol (Awadist) 1000mg","As needed",0.899306,"Taken",""],
    [46180,"Nasonex Spray (mometasone)","As needed",0.899306,"Taken",""],
    [46180,"Ryaltris (olopatadine + mometasone)","As needed",0.899306,"Taken",""],
    [46180,"Thiotacid 300 (Alpha-lipoic Acid) — 3rd Dose",0.916667,0.916667,"Taken",""],
    [46181,"Melatonin Copad","Bedtime",0.083333,"Taken",""],
    [46181,"Thiotacid 300 (Alpha-lipoic Acid) — 1st Dose",0.416667,0.444444,"Taken",""],
    [46181,"Sugarlo Plus (Metformin)",0.416667,0.444444,"Taken",""],
    [46181,"Milga Advance",0.666667,0.652778,"Taken",""],
    [46181,"Thiotacid 300 (Alpha-lipoic Acid) — 2nd Dose",0.666667,0.667361,"Taken",""],
    [46181,"Davalindi (Vitamin D3)",0.666667,0.704167,"Taken",""],
    [46182,"Melatonin Copad","Bedtime",0.161111,"Taken",""],
    [46182,"Sugarlo Plus (Metformin)",0.416667,0.430556,"Taken",""],
    [46182,"Thiotacid 300 (Alpha-lipoic Acid) — 1st Dose",0.416667,0.430556,"Taken",""],
    [46182,"Milga Advance",0.666667,0.626389,"Taken",""],
    [46182,"Thiotacid 300 (Alpha-lipoic Acid) — 2nd Dose",0.666667,0.65625,"Taken",""],
    [46182,"Davalindi (Vitamin D3)",0.666667,0.690972,"Taken",""],
    [46182,"Thiotacid 300 (Alpha-lipoic Acid) — 3rd Dose",0.916667,0.916667,"Taken",""],
    [46183,"Melatonin Copad","Bedtime",0.209722,"Taken",""],
    [46183,"Sugarlo Plus (Metformin)",0.416667,0.430556,"Taken",""],
    [46183,"Thiotacid 300 (Alpha-lipoic Acid) — 1st Dose",0.416667,0.430556,"Taken",""],
    [46183,"Milga Advance",0.666667,0.666667,"Taken",""],
    [46183,"Thiotacid 300 (Alpha-lipoic Acid) — 2nd Dose",0.666667,0.666667,"Taken",""],
    [46183,"Davalindi (Vitamin D3)",0.666667,0.711111,"Taken",""],
    [46183,"Thiotacid 300 (Alpha-lipoic Acid) — 3rd Dose",0.916667,0.920139,"Taken",""],
    [46184,"Melatonin Copad","Bedtime",0.090972,"Taken",""],
    [46184,"Sugarlo Plus (Metformin)",0.416667,0.434722,"Taken",""],
    [46184,"Thiotacid 300 (Alpha-lipoic Acid) — 1st Dose",0.416667,0.434722,"Taken",""],
    [46184,"Milga Advance",0.666667,0.658333,"Taken",""],
    [46184,"Thiotacid 300 (Alpha-lipoic Acid) — 2nd Dose",0.666667,0.694444,"Taken",""],
    [46184,"Davalindi (Vitamin D3)",0.666667,0.694444,"Taken",""],
    [46185,"Thiotacid 300 (Alpha-lipoic Acid) — 3rd Dose",0.916667,0.009028,"Taken",""],
    [46185,"Melatonin Copad","Bedtime",0.109028,"Taken",""],
    [46185,"Thiotacid 300 (Alpha-lipoic Acid) — 1st Dose",0.416667,"","Skipped","Overslept, so skipped it that way I don't overtake the med 3 to 4 hours later"],
    [46185,"Sugarlo Plus (Metformin)",0.416667,0.658333,"Taken",""],
    [46185,"Milga Advance",0.666667,0.658333,"Taken",""],
    [46185,"Thiotacid 300 (Alpha-lipoic Acid) — 2nd Dose",0.666667,0.658333,"Taken",""],
    [46185,"Davalindi (Vitamin D3)",0.666667,0.726389,"Taken",""],
    [46185,"Thiotacid 300 (Alpha-lipoic Acid) — 3rd Dose",0.916667,0.916667,"Taken",""],
    [46186,"Melatonin Copad","Bedtime",0.195833,"Taken",""],
    [46186,"Sugarlo Plus (Metformin)",0.416667,0.444444,"Taken",""],
    [46186,"Thiotacid 300 (Alpha-lipoic Acid) — 1st Dose",0.416667,0.444444,"Taken",""],
    [46186,"Thiotacid 300 (Alpha-lipoic Acid) — 2nd Dose",0.666667,0.666667,"Taken",""],
    [46186,"Milga Advance",0.666667,0.75,"Taken",""],
    [46186,"Davalindi (Vitamin D3)",0.666667,0.823611,"Taken",""],
    [46186,"Thiotacid 300 (Alpha-lipoic Acid) — 3rd Dose",0.916667,0.920833,"Taken",""],
    [46187,"Melatonin Copad","Bedtime",0.193056,"Taken",""],
    [46187,"Sugarlo Plus (Metformin)",0.416667,0.506944,"Taken",""],
    [46187,"Thiotacid 300 (Alpha-lipoic Acid) — 1st Dose",0.416667,0.506944,"Taken",""],
    [46187,"Thiotacid 300 (Alpha-lipoic Acid) — 2nd Dose",0.666667,0.663194,"Taken","Took it 5 mins early, because I am planning to take a nap now."],
    [46187,"Milga Advance",0.666667,0.823611,"Taken",""],
    [46187,"Davalindi (Vitamin D3)",0.666667,0.852083,"Taken",""],
    [46187,"Thiotacid 300 (Alpha-lipoic Acid) — 3rd Dose",0.916667,0.916667,"Taken",""],
    [46188,"Melatonin Copad","Bedtime",0.28125,"Taken",""],
    [46188,"Sugarlo Plus (Metformin)",0.416667,0.513194,"Taken",""],
    [46188,"Thiotacid 300 (Alpha-lipoic Acid) — 1st Dose",0.416667,0.513194,"Taken",""],
    [46188,"Thiotacid 300 (Alpha-lipoic Acid) — 2nd Dose",0.666667,0.666667,"Taken",""],
    [46188,"Thiotacid 300 (Alpha-lipoic Acid) — 3rd Dose",0.916667,0.916667,"Taken",""],
]

with open(OUT / "Medication_Log_2026-05-29_to_2026-06-15.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f)
    w.writerow(["Date","Medication Name","Scheduled Time","Actual Time Taken","Status","Notes"])
    for r in med_rows:
        w.writerow([xl_date(r[0]), r[1], xl_time(r[2]), xl_time(r[3]), r[4], r[5]])
print(f"Medication Log: {len(med_rows)} rows")

# ── FOOD LOG ───────────────────────────────────────────────────────────────────
food_rows = [
    [46171,0.770833,"Lunch","Large","Vegetable soup + 3 large baladi bread",0.9375,"411h 31m"],
    [46172,0.798611,"Lunch","Large","Vegetable soup + 4 small baladi bread",0.965278,"386h 51m"],
    [46173,0.232639,"Dinner","Normal","A mix of Romi cheese with cold cuts (Lanchon beef + Smoked Turkey)",0.399306,"376h 26m"],
    [46173,0.909722,"Lunch","Large","Vegetable soup + 2 large 1 med baladi bread",0.076389,"360h 11m"],  # 1.076389 mod 1
    [46174,0.722222,"Lunch","Large","Cooked potatoes + 3 medium baladi bread",0.888889,"340h 41m"],
    [46175,0.472222,"Lunch","Large","Sausage beef + pasta",0.638889,"322h 41m"],
    [46176,0.569444,"Lunch","Large","Vegetable soup + 4 small baladi bread",0.736111,"296h 21m"],
    [46177,0.601389,"Lunch","Large","Vegetable soup + 4 small baladi bread",0.768056,"271h 35m"],
    [46178,0.616667,"Lunch","Large","Cooked potatoes + 4 small baladi bread",0.783333,"247h 13m"],
    [46179,0.678472,"Lunch","Large","Vegetable stew + 4 small baladi bread",0.845139,"221h 44m"],
    [46180,0.575,"Lunch","Large","Vegetable stew + 4 small baladi bread",0.741667,"200h 13m"],
    [46181,0.684722,"Lunch","Large","Vegetable stew + 4 small baladi bread",0.851389,"173h 35m"],
    [46182,0.672917,"Lunch","Large","Vegetable stew + 4 small baladi bread",0.839583,"149h 52m"],
    [46183,0.694444,"Lunch","Large","Vegetable stew + 4 small baladi bread",0.861111,"125h 21m"],
    [46184,0.676389,"Lunch","Large","Vegetable stew + 4 small baladi bread",0.843056,"101h 47m"],
    [46185,0.706944,"Lunch","Large","Foul + 6 eggs + 4 small baladi bread",0.873611,"77h 3m"],
    [46186,0.809722,"Lunch","Large","Vegetable stew + 4 small baladi bread",0.976389,"50h 35m"],
    [46187,0.833333,"Lunch","Large","Koshary + Beef Lazania",0.0,"26h 1m"],  # 1.0 mod 1 = midnight = 00:00
]

with open(OUT / "Food_Log_2026-05-29_to_2026-06-15.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f)
    w.writerow(["Date","Meal Time","Meal Name","Meal Size","Notes","Safe to Sleep After","Hours Since Meal"])
    for r in food_rows:
        w.writerow([xl_date(r[0]), xl_time(r[1]), r[2], r[3], r[4], xl_time(r[5]), r[6]])
print(f"Food Log: {len(food_rows)} rows")

# ── DASHBOARD ──────────────────────────────────────────────────────────────────
dashboard = """# Dashboard Snapshot — 15 June 2026

## Section 1 — Last Sleep Session
- Date: 15/06/2026
- Bed Time: 16:01
- Sleep Start: 19:58
- Wake Time: 20:23
- Sleep Onset Latency: 3h 57m
- Sleep Duration: 0h 25m
- Time in Bed: 4h 22m
- Quality Rating: 1 (worst)

## Section 2 — Food & GERD Safety
- Last Meal Date & Time: 14/06/2026 20:00
- Hours Since Last Meal: 26h 1m
- Safe to Sleep Right Now?: Safe to sleep

## Section 3 — Today's Medications (15/06/2026)
- Sugarlo Plus (Metformin) | Scheduled: 10:00 | Taken at 12:19
- Thiotacid 300 (Alpha-lipoic Acid) — 1st Dose | Scheduled: 10:00 | Taken at 12:19
- Milga Advance | Scheduled: 16:00 | Due — take now
- Davalindi (Vitamin D3) | Scheduled: 16:00 | Due — take now
- Thiotacid 300 (Alpha-lipoic Acid) — 2nd Dose | Scheduled: 16:00 | Taken at 16:00
- Thiotacid 300 (Alpha-lipoic Acid) — 3rd Dose | Scheduled: 22:00 | Taken at 22:00
- Melatonin Copad | Scheduled: Bedtime | Taken at 06:45

## Section 4 — Sleep Onset Latency Trend (Last 7 Sessions)
| Session | Date       | Latency (min) |
|---------|------------|---------------|
| 1 (most recent) | 15/06/2026 | 237 |
| 2       | 15/06/2026 | 68  |
| 3       | 14/06/2026 | 439 |
| 4       | 14/06/2026 | 31  |
| 5       | 13/06/2026 | 22  |
| 6       | 12/06/2026 | 54  |
| 7 (oldest) | 11/06/2026 | 19 |
"""
(OUT / "Dashboard_2026-06-15.md").write_text(dashboard, encoding="utf-8")
print("Dashboard written.")
