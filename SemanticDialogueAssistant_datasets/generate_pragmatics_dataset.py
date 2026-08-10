import csv
import os

os.makedirs("datasets", exist_ok=True)

headers = [
    "scenario_id",
    "character",
    "question",
    "expected_answer",
    "incorrect_answer",
    "error_type",
    "suggestion",
    "respect_required",
    "stars"
]

data = []

scenario = 1

characters = {

    "Parent": [
        ("En kooda kadaiki variya?", "Varen appa", "Varen da"),
        ("Saaptiya?", "Saapten appa", "Saapten"),
        ("TV off pannuva?", "Seri appa", "Seri da"),
        ("Book eduthu kudu.", "Idho appa", "Eduthuko"),
        ("Homework mudichacha?", "Aama appa", "Aama"),
        ("Water kondu va.", "Idho appa", "Va"),
        ("Late aagidathe.", "Seri appa", "Okay"),
        ("Phone kudu.", "Idho appa", "Eduthuko"),
        ("School epdi irundhudhu?", "Nalla irundhudhu appa", "Nalla"),
        ("Veliya polaama?", "Polaam appa", "Va")
    ],

    "Teacher": [
        ("Ulla vaanga.", "Seri teacher", "Seri"),
        ("Homework mudichacha?", "Aama teacher", "Yes"),
        ("Notebook kudunga.", "Idho teacher", "Eduthuko"),
        ("Question purinjutha?", "Purinjuthu teacher", "Theriyum"),
        ("Class aarambikkalaama?", "Ready teacher", "Ready"),
        ("Book open pannunga.", "Seri teacher", "Okay"),
        ("Board paarunga.", "Paakuren teacher", "Paakuren"),
        ("Assignment complete?", "Complete teacher", "Done"),
        ("Read pannunga.", "Padikuren teacher", "Padikuren"),
        ("Sit down.", "Seri teacher", "Okay")
    ],

    "Friend": [
        ("Cricket vilayaadalaama?", "Va da", "Mudiyadhu"),
        ("Movie polaama?", "Polaam da", "No"),
        ("Sapdalaama?", "Sapdalaam", "Mudiyadhu da"),
        ("PUBG aadalaama?", "Va machi", "No"),
        ("Cycle ottalaama?", "Polaam da", "Okay"),
        ("Beach polaama?", "Let's go da", "Later"),
        ("Football aadalaama?", "Va da", "No"),
        ("Tea kudikalaama?", "Va polaam", "Busy"),
        ("Shopping polaama?", "Polaam machi", "No"),
        ("Photo edukalaama?", "Seri da", "Vendaam")
    ],

    "Stranger": [
        ("Post office enga iruku?", "Theriyadhu sir", "Theriyadhu da"),
        ("Bus stand enga?", "Idho uncle", "Poi paru"),
        ("Nandri.", "Parava illa sir", "Okay"),
        ("Hospital enga?", "Straight sir", "Theriyadhu"),
        ("Library enga?", "Left sir", "Left"),
        ("Railway station enga?", "Right sir", "Right"),
        ("Bank enga?", "Near signal sir", "Anga"),
        ("Hotel enga?", "Opposite sir", "Theriyadhu"),
        ("School enga?", "Munnaadi sir", "Poi"),
        ("Temple enga?", "Indha road sir", "Anga")
    ]
}

for character, conversations in characters.items():

    for i in range(3):          # repeat 3 times

        for question, correct, wrong in conversations:

            if character == "Friend":
                respect = "No"
                error = "Informal Response"
                suggestion = "Friendly language is acceptable with friends."
            else:
                respect = "Yes"

                if "da" in wrong.lower():
                    error = "Disrespectful Slang"
                    suggestion = f"Use '{correct}' instead."
                elif wrong.lower() in ["yes", "okay", "done", "no"]:
                    error = "Missing Honorific"
                    suggestion = f"Reply politely like '{correct}'."
                else:
                    error = "Improper Response"
                    suggestion = f"Try saying '{correct}'."

            data.append([
                scenario,
                character,
                question,
                correct,
                wrong,
                error,
                suggestion,
                respect,
                5
            ])

            scenario += 1

with open("datasets/pragmatics.csv", "w", newline="", encoding="utf-8") as f:

    writer = csv.writer(f)

    writer.writerow(headers)

    writer.writerows(data)

print("=" * 50)
print("Dataset Generated Successfully!")
print(f"Total Examples : {len(data)}")
print("Saved to datasets/pragmatics.csv")
print("=" * 50)